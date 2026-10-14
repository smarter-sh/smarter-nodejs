/**
 * The helpers of the SDK's unit tests: the counterpart of the Python SDK's `SmarterTestBase`.
 *
 * {@link mockPlatform} gives each test a {@link Smarter} client whose requests never leave the
 * process. They are answered by a `fetch` double from the routes that the test registers, usually
 * with the sanitized JSON of a real platform response from `test/data/`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Smarter, type SmarterOptions } from "../src/index.ts";

export const DATA = join(import.meta.dirname, "data");
export const API_KEY = "a".repeat(60) + "beef";
export const BASE_URL = "http://testserver";
export const API = `${BASE_URL}/api/v1/`;

/** Answers a request. */
export type Handler = (request: Request) => Response | Promise<Response>;

/** A route's answer. */
export interface Reply {
  /** The name of a JSON file in `test/data/`, without `.json`, as the response's JSON. */
  fixture?: string;
  /** The response's JSON. */
  json?: unknown;
  /** The response's status, 200 by default. */
  status?: number;
  /** The response's text, instead of JSON. */
  text?: string;
  /** The response's headers. */
  headers?: Record<string, string>;
  /** A function that answers the request, instead of a fixed response. */
  handler?: Handler;
}

/**
 * A JSON file of `test/data/`.
 *
 * @param name - The file's name, without `.json`.
 * @returns Its content.
 */
export function loadJson(name: string): unknown {
  return JSON.parse(readFileSync(join(DATA, `${name}.json`), "utf-8")) as unknown;
}

/**
 * A text file of `test/data/`.
 *
 * @param name - The file's name, with its extension.
 * @returns Its content.
 */
export function loadText(name: string): string {
  return readFileSync(join(DATA, name), "utf-8");
}

/**
 * A JSON response.
 *
 * @param body - The JSON.
 * @param status - The status.
 * @param headers - The headers.
 * @returns The response.
 */
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  const text = body === undefined ? null : JSON.stringify(body);
  return new Response(status === 204 ? null : text, {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** A mock platform, and a client whose requests it answers. */
export interface MockPlatform {
  /** A client whose requests are answered by the routes. */
  client: Smarter;
  /** Every request that a client sent, in order. Their bodies can still be read. */
  requests: Request[];
  /** The last request that a client sent. */
  readonly lastRequest: Request;
  /** Answer requests to a path, relative to `/api/v1/`. */
  route(method: string, path: string, reply?: Reply): void;
  /** The JSON body of a request, the last by default. */
  requestJson(index?: number): Promise<unknown>;
  /** Another client on the same routes. */
  makeClient(options?: SmarterOptions): Smarter;
  /** The `fetch` double. */
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
}

/**
 * A mock platform. An unrouted request gets a 404.
 *
 * @returns The platform, and its client.
 */
export function mockPlatform(): MockPlatform {
  const routes = new Map<string, Handler>();
  const requests: Request[] = [];

  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    requests.push(request.clone());
    const handler = routes.get(`${request.method} ${new URL(request.url).pathname}`);
    if (handler === undefined) {
      return jsonResponse({ detail: `no route for ${request.method} ${new URL(request.url).pathname}` }, 404);
    }
    return handler(request);
  };

  const makeClient = (options: SmarterOptions = {}): Smarter =>
    new Smarter({ apiKey: API_KEY, baseUrl: BASE_URL, maxRetries: 0, fetch, ...options });

  return {
    client: makeClient(),
    requests,
    get lastRequest(): Request {
      const request = requests.at(-1);
      if (request === undefined) throw new Error("no request was sent");
      return request;
    },
    route(method: string, path: string, reply: Reply = {}): void {
      const handler: Handler =
        reply.handler ??
        (() => {
          if (reply.text !== undefined)
            return new Response(reply.text, { status: reply.status ?? 200, headers: reply.headers ?? {} });
          return jsonResponse(reply.fixture ? loadJson(reply.fixture) : reply.json, reply.status ?? 200, reply.headers);
        });
      routes.set(`${method} /api/v1/${path.replace(/^\/+/, "")}`, handler);
    },
    async requestJson(index = -1): Promise<unknown> {
      const request = requests.at(index);
      if (request === undefined) throw new Error("no such request");
      return JSON.parse(await request.clone().text()) as unknown;
    },
    makeClient,
    fetch,
  };
}
