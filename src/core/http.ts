/**
 * The SDK's http transport: authentication, retries, error mapping, and response validation.
 *
 * {@link SmarterHttpClient} sends every request of a `Smarter` client with `fetch`. It adds the api
 * key and the SDK's headers, retries requests that failed for transient reasons, throws an
 * {@link APIStatusError} for a 4xx or 5xx response, and validates the response's JSON with a Zod
 * schema. Its retry rules are the Python SDK's.
 */

import { z } from "zod";

import { CHAT_CONTRACT_V2_CAPABILITY } from "../models/chat.ts";
import { SAMJournalApiErrorBody } from "../models/journal.ts";
import { VERSION } from "../version.ts";
import type { ClientConfig } from "./config.ts";
import {
  APIConnectionError,
  APIResponseValidationError,
  APIStatusError,
  APITimeoutError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
  type APIStatusErrorOptions,
  type FailedRequest,
} from "./errors.ts";
import { maskSecret, type Logger } from "./log.ts";
import { EVENT_STREAM_CONTENT_TYPE, iterLines, iterSse, type ServerSentEvent } from "./sse.ts";

/** A query parameter's value. An array repeats the parameter once per item; `null` and `undefined` leave it out. */
export type QueryParamValue = string | number | boolean | readonly (string | number | boolean)[] | null | undefined;

/** The SDK's `User-Agent`. */
export const USER_AGENT = `smarter-nodejs/${VERSION}`;

/** The SDK's `X-Smarter-Client` header, which identifies it to the platform's logs and journal. */
export const CLIENT_NAME = "smarter-nodejs";

/** Statuses that mean the request may succeed if it is sent again. 503 is retried only when the platform did not send it: see {@link isRetryable}. */
export const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 429, 502, 504]);

/** Seconds. A longer `Retry-After` is not waited for. */
export const MAX_RETRY_AFTER = 60;

/** The `fetch` function that the client sends requests with. */
export type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** Per-request options, which every method of the SDK takes as its last argument. */
export interface RequestOptions {
  /** A signal to cancel the request. The request then rejects with the signal's reason. */
  signal?: AbortSignal | undefined;
  /** The timeout in seconds, instead of the client's. For a stream, it applies to each read. */
  timeout?: number | undefined;
  /** Headers for this request, which override the client's. */
  headers?: Record<string, string> | undefined;
}

/** What a request sends. */
export interface RequestInput extends RequestOptions {
  /** Query parameters. */
  params?: Record<string, QueryParamValue> | undefined;
  /** A JSON body. */
  json?: unknown;
  /** A raw or multipart body, e.g. a `FormData` of files. */
  body?: string | FormData | undefined;
}

const STATUS_ERRORS: Record<number, typeof APIStatusError> = {
  400: BadRequestError,
  401: AuthenticationError,
  403: PermissionDeniedError,
  404: NotFoundError,
  409: ConflictError,
  422: UnprocessableEntityError,
  429: RateLimitError,
};

/**
 * A response's body: its JSON, or its text when it is not JSON.
 *
 * @param text - The body's text.
 * @returns The parsed JSON, the text, or undefined for an empty body.
 */
export function parseBody(text: string): unknown {
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The Smarter Journal error of a response body, if it is a journaled error response.
 *
 * @param body - A parsed response body.
 * @returns The error body, or undefined.
 */
export function journalError(body: unknown): SAMJournalApiErrorBody | undefined {
  if (!isRecord(body) || !isRecord(body["error"])) return undefined;
  const parsed = SAMJournalApiErrorBody.safeParse(body["error"]);
  return parsed.success ? parsed.data : undefined;
}

/**
 * A human-readable message for an error response.
 *
 * The platform's views return errors in several shapes: the journal's `error` object, an `error`
 * string, Django REST framework's `detail`, plain text, or a Django error page.
 *
 * @param status - The response's status.
 * @param statusText - The response's status text.
 * @param body - Its parsed body.
 * @param error - Its journal error, if any.
 * @returns The message.
 */
export function errorMessage(
  status: number,
  statusText: string,
  body: unknown,
  error: SAMJournalApiErrorBody | undefined,
): string {
  if (error !== undefined) return error.description || error.errorClass;
  if (isRecord(body)) {
    for (const key of ["error", "detail", "message"]) {
      const value = body[key];
      if (typeof value === "string" && value) return value;
    }
    const nested = body["error"];
    if (isRecord(nested) && typeof nested["description"] === "string") return nested["description"];
  }
  if (typeof body === "string" && body && !body.slice(0, 500).toLowerCase().includes("<html")) {
    return body.slice(0, 500);
  }
  return `${String(status)} ${statusText}`.trim();
}

/**
 * The error for a 4xx or 5xx response, by its status.
 *
 * @param request - The request.
 * @param response - The response.
 * @param text - The response's body.
 * @returns e.g. a {@link NotFoundError} for a 404.
 */
export function makeStatusError(request: FailedRequest, response: Response, text: string): APIStatusError {
  const body = parseBody(text);
  const error = journalError(body);
  const message = errorMessage(response.status, response.statusText, body, error);
  const options: APIStatusErrorOptions = {
    request,
    body,
    error,
    statusCode: response.status,
    headers: response.headers,
  };
  const ErrorClass = STATUS_ERRORS[response.status] ?? (response.status >= 500 ? InternalServerError : APIStatusError);
  return new ErrorClass(message, options);
}

/**
 * True if a failed response may succeed when the request is sent again.
 *
 * A 503 is retried only when it is not a journaled response. The Smarter platform itself answers
 * 503 for a resource that is not ready (e.g. `SAMBrokerErrorNotReady`), which a retry won't change,
 * whereas a 503 from a load balancer or proxy means the platform is briefly unavailable.
 *
 * @param status - The response's status.
 * @param text - The response's body.
 * @returns True to retry.
 */
export function isRetryable(status: number, text: string): boolean {
  if (RETRYABLE_STATUSES.has(status)) return true;
  if (status === 503) return journalError(parseBody(text)) === undefined;
  return false;
}

/**
 * Seconds to wait before a retry: the response's `Retry-After`, or exponential backoff with jitter.
 *
 * @param attempt - The number of the attempt that failed, from 0.
 * @param headers - The failed response's headers, if there was one.
 * @returns The delay.
 */
export function retryDelay(attempt: number, headers?: Headers): number {
  const retryAfter = headers?.get("retry-after");
  if (retryAfter !== null && retryAfter !== undefined && retryAfter.trim() !== "") {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0 && seconds <= MAX_RETRY_AFTER) return seconds;
  }
  return Math.min(0.5 * 2 ** attempt, 8) * (1 - 0.25 * Math.random());
}

/**
 * Query parameters as strings: booleans as `true` or `false`, an array as the parameter repeated once
 * per item, and null values left out.
 *
 * @param params - The parameters.
 * @returns The parameters' query string, without its `?`, or an empty string.
 */
export function queryString(params: Record<string, QueryParamValue> | undefined): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === null || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, typeof item === "boolean" ? (item ? "true" : "false") : String(item));
    }
  }
  return search.toString();
}

function sleep(seconds: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason as Error);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, seconds * 1000);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason as Error);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Options of a {@link SmarterHttpClient}. */
export interface SmarterHttpClientOptions {
  /** Headers to add to every request. */
  defaultHeaders?: Record<string, string> | undefined;
  /** The `fetch` to send requests with, e.g. one with a proxy. The global `fetch` by default. */
  fetch?: Fetch | undefined;
  /** The client's logger. */
  logger: Logger;
}

/** Sends the requests of a Smarter client. */
export class SmarterHttpClient {
  /** The client's resolved configuration. */
  readonly config: ClientConfig;
  readonly #fetch: Fetch;
  readonly #defaultHeaders: Record<string, string>;
  readonly #logger: Logger;

  /**
   * @param config - The client's resolved configuration.
   * @param options - Default headers, a `fetch`, and the logger.
   */
  constructor(config: ClientConfig, options: SmarterHttpClientOptions) {
    this.config = config;
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#defaultHeaders = { ...options.defaultHeaders };
    this.#logger = options.logger;
  }

  /** The api's base url, e.g. `https://platform.smarter.sh/api/v1/`. */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /** How many times a failed request is retried. */
  get maxRetries(): number {
    return this.config.maxRetries;
  }

  /**
   * The absolute url of an api path.
   *
   * @param path - A path relative to the base url, e.g. `cli/whoami/`. An absolute url is returned as is.
   * @param params - Query parameters.
   * @returns The url.
   */
  url(path: string, params?: Record<string, QueryParamValue>): string {
    const base = /^https?:\/\//.test(path) ? path : this.baseUrl + path.replace(/^\/+/, "");
    const query = queryString(params);
    return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base;
  }

  /**
   * The headers of a request.
   *
   * @param extra - Headers for this request, which override the defaults.
   * @returns The headers.
   */
  headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Token ${this.config.apiKey}`,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      "X-Smarter-Client": CLIENT_NAME,
      "X-Smarter-Capabilities": CHAT_CONTRACT_V2_CAPABILITY,
      ...this.#defaultHeaders,
      ...extra,
    };
  }

  /**
   * Send a request, with retries, and throw for an error status.
   *
   * @param method - The http method.
   * @param path - The path, relative to the api's base url.
   * @param input - What to send.
   * @param stream - True to return as soon as the headers arrive, with the timeout applied to each read instead.
   * @returns The successful response, and the controller whose abort ends a stream.
   * @throws {@link APIConnectionError} If no response was received after the retries.
   * @throws {@link APITimeoutError} If the request timed out after the retries.
   * @throws {@link APIStatusError} For a 4xx or 5xx response, as the status's subclass.
   */
  async send(
    method: string,
    path: string,
    input: RequestInput = {},
    stream = false,
  ): Promise<{ response: Response; request: FailedRequest; idle: IdleTimeout }> {
    const url = this.url(path, input.params);
    const request: FailedRequest = { method, url };
    const headers = this.headers(input.headers);
    let body: string | FormData | undefined = input.body;
    if (input.json !== undefined) {
      body = JSON.stringify(input.json);
      headers["Content-Type"] = "application/json";
    }
    const timeout = input.timeout ?? this.config.timeout;
    if (this.#logger.enabled("debug")) {
      const shown = body instanceof FormData ? "<multipart>" : (body ?? "").slice(0, 2000);
      this.#logger.log(
        "debug",
        "http",
        `request ${method} ${url} api_key=${maskSecret(this.config.apiKey)} body=${shown}`,
      );
    }

    for (let attempt = 0; ; attempt++) {
      const idle = new IdleTimeout(timeout, input.signal);
      const started = performance.now();
      let response: Response;
      try {
        response = await this.#fetch(url, {
          method,
          headers,
          body: body ?? null,
          signal: idle.signal,
          redirect: "manual",
        });
      } catch (err) {
        idle.clear();
        if (input.signal?.aborted) throw input.signal.reason;
        const timedOut = idle.timedOut;
        if (attempt < this.maxRetries) {
          await this.#wait(attempt, request, timedOut ? "timeout" : "connection error", undefined, input.signal);
          continue;
        }
        if (timedOut) throw new APITimeoutError(request, err);
        throw new APIConnectionError(`Connection error: ${err instanceof Error ? err.message : String(err)}`, {
          request,
          cause: err,
        });
      }
      this.#logger.log(
        "info",
        "http",
        `${method} ${url} -> ${String(response.status)} in ${((performance.now() - started) / 1000).toFixed(2)}s`,
      );
      if (response.ok) {
        if (!stream) idle.clear();
        else idle.restart();
        return { response, request, idle };
      }
      const text = await this.#readText(response, idle, request);
      idle.clear();
      if (attempt < this.maxRetries && isRetryable(response.status, text)) {
        await this.#wait(attempt, request, String(response.status), response.headers, input.signal);
        continue;
      }
      throw makeStatusError(request, response, text);
    }
  }

  async #readText(response: Response, idle: IdleTimeout, request: FailedRequest): Promise<string> {
    try {
      return await response.text();
    } catch (err) {
      if (idle.timedOut) throw new APITimeoutError(request, err);
      throw new APIConnectionError(`Connection error: ${err instanceof Error ? err.message : String(err)}`, {
        request,
        cause: err,
      });
    }
  }

  async #wait(
    attempt: number,
    request: FailedRequest,
    reason: string,
    headers: Headers | undefined,
    signal: AbortSignal | undefined,
  ): Promise<void> {
    const delay = retryDelay(attempt, headers);
    this.#logger.log(
      "info",
      "http",
      `retrying ${request.method} ${request.url} in ${delay.toFixed(2)}s after ${reason}`,
    );
    await sleep(delay, signal);
  }

  /**
   * Send a request, and validate its JSON response.
   *
   * @param method - The http method, e.g. `GET`.
   * @param path - The path, relative to the api's base url, e.g. `guardrails/`.
   * @param schema - The schema of the response's JSON, e.g. `Guardrail` or `z.array(Guardrail)`.
   * @param input - What to send.
   * @returns The validated response.
   * @throws {@link APIResponseValidationError} If the response does not match the schema.
   */
  async request<S extends z.ZodType>(
    method: string,
    path: string,
    schema: S,
    input: RequestInput = {},
  ): Promise<z.output<S>> {
    const { response, request, idle } = await this.send(method, path, input);
    const text = await this.#readText(response, idle, request);
    idle.clear();
    const body = parseBody(text);
    if (this.#logger.enabled("debug")) {
      this.#logger.log("debug", "http", `response ${String(response.status)} ${text.slice(0, 2000)}`);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new APIResponseValidationError(
        `The response of ${method} ${request.url} does not match the SDK's model: ${z.prettifyError(parsed.error)}`,
        { request, body, statusCode: response.status, cause: parsed.error },
      );
    }
    return parsed.data;
  }

  /**
   * Send a request that asks for Server-Sent Events, and iterate its events.
   *
   * The request is sent when the iteration starts, and the response is closed when it ends, also
   * when the caller stops early.
   *
   * @param method - The http method.
   * @param path - The path, relative to the api's base url.
   * @param input - What to send. Its timeout applies to each read.
   * @returns The events.
   */
  async *events(method: string, path: string, input: RequestInput = {}): AsyncGenerator<ServerSentEvent> {
    const { response, request, idle } = await this.send(
      method,
      path,
      { ...input, headers: { Accept: EVENT_STREAM_CONTENT_TYPE, ...input.headers } },
      true,
    );
    const body = response.body;
    try {
      if (body === null) return;
      const chunks = (async function* (): AsyncGenerator<Uint8Array> {
        const reader = body.getReader();
        // a fetch that doesn't tie the body to its signal would never end a stalled read.
        const cancel = (): void => {
          reader.cancel(idle.signal.reason).catch(() => undefined);
        };
        idle.signal.addEventListener("abort", cancel, { once: true });
        try {
          for (;;) {
            let result: ReadableStreamReadResult<Uint8Array>;
            try {
              result = await reader.read();
            } catch (err) {
              if (input.signal?.aborted) throw input.signal.reason;
              if (idle.timedOut) throw new APITimeoutError(request, err);
              throw new APIConnectionError(`Connection error: ${err instanceof Error ? err.message : String(err)}`, {
                request,
                cause: err,
              });
            }
            if (result.done) {
              if (idle.timedOut) throw new APITimeoutError(request);
              if (input.signal?.aborted) throw input.signal.reason;
              return;
            }
            idle.restart();
            yield result.value;
          }
        } finally {
          idle.signal.removeEventListener("abort", cancel);
          reader.releaseLock();
        }
      })();
      yield* iterSse(iterLines(chunks));
    } finally {
      idle.clear();
      if (body !== null && !body.locked) await body.cancel().catch(() => undefined);
    }
  }
}

/**
 * A timeout that can be restarted, e.g. on each read of a stream, combined with the caller's signal.
 */
export class IdleTimeout {
  readonly #controller = new AbortController();
  readonly #seconds: number;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #timedOut = false;
  /** The signal to pass to `fetch`: aborted by the timeout or by the caller's signal. */
  readonly signal: AbortSignal;

  /**
   * @param seconds - The timeout.
   * @param signal - The caller's signal, if any.
   */
  constructor(seconds: number, signal: AbortSignal | undefined) {
    this.#seconds = seconds;
    this.signal = signal ? AbortSignal.any([this.#controller.signal, signal]) : this.#controller.signal;
    this.restart();
  }

  /** True once the timeout, not the caller, aborted the request. */
  get timedOut(): boolean {
    return this.#timedOut;
  }

  /** Start the timeout again. */
  restart(): void {
    this.clear();
    this.#timer = setTimeout(() => {
      this.#timedOut = true;
      this.#controller.abort(new DOMException("The request timed out.", "TimeoutError"));
    }, this.#seconds * 1000);
  }

  /** Stop the timeout. */
  clear(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }
}
