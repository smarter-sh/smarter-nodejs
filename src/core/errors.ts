/**
 * The errors of the Smarter Node.js SDK.
 *
 * Every error that the SDK throws is a {@link SmarterError}, so a caller can catch them all with one
 * `instanceof` test. The classes, their names and their hierarchy are the Python SDK's:
 *
 * ```text
 * SmarterError
 * ├── SmarterConfigurationError        the client has no api key or base url
 * ├── SmarterValueError                an argument is invalid, before any request is sent
 * ├── ResourceNotFoundError            a resource was not found, by the api (NotFoundError) or by find()
 * ├── SmarterPromptError               a streamed prompt failed
 * └── APIError
 *     ├── APIConnectionError           the request never got a response
 *     │   └── APITimeoutError
 *     ├── APIResponseValidationError   the response does not match the SDK's schema of it
 *     └── APIStatusError               the api returned a 4xx or 5xx status
 *         ├── BadRequestError          400
 *         ├── AuthenticationError      401
 *         ├── PermissionDeniedError    403
 *         ├── NotFoundError            404, also an instanceof ResourceNotFoundError
 *         ├── ConflictError            409
 *         ├── UnprocessableEntityError 422
 *         ├── RateLimitError           429
 *         └── InternalServerError      5xx
 * ```
 *
 * @example
 * ```ts
 * try {
 *   await client.manifests.describe("LLMClient", "no_such_client");
 * } catch (err) {
 *   if (err instanceof NotFoundError) console.log(err.statusCode, err.message, err.errorClass);
 *   else throw err;
 * }
 * ```
 */

import type { SAMJournalApiErrorBody } from "../models/journal.ts";
import type { PromptChatApiErrorResponse, PromptChatApiPromptResponse } from "../models/chat.ts";

/** The method and url of a request that failed. */
export interface FailedRequest {
  /** The http method, e.g. `POST`. */
  method: string;
  /** The request's url. */
  url: string;
}

/** The base class of every error that the Smarter SDK throws. */
export class SmarterError extends Error {
  override readonly name: string = "SmarterError";
}

/** The client is missing configuration that it needs, e.g. an api key or a base url. */
export class SmarterConfigurationError extends SmarterError {
  override readonly name: string = "SmarterConfigurationError";
}

/** An argument is invalid. Thrown before a request is sent. */
export class SmarterValueError extends SmarterError {
  override readonly name: string = "SmarterValueError";
}

/**
 * A resource was not found: the api answered 404 ({@link NotFoundError}), or `find()` found no resource of that name.
 *
 * `err instanceof ResourceNotFoundError` is also true for a {@link NotFoundError}, as in the Python SDK,
 * where `NotFoundError` subclasses both.
 */
export class ResourceNotFoundError extends SmarterError {
  override readonly name: string = "ResourceNotFoundError";

  static override [Symbol.hasInstance](value: unknown): boolean {
    if (Function.prototype[Symbol.hasInstance].call(this, value)) return true;
    return this === ResourceNotFoundError && value instanceof NotFoundError;
  }
}

/** Options of an {@link APIError}. */
export interface APIErrorOptions extends ErrorOptions {
  /** The request that failed. */
  request: FailedRequest;
  /** The response's parsed JSON body, or its text, or `undefined` when there is no response. */
  body?: unknown;
}

/** A request to the Smarter api failed. */
export class APIError extends SmarterError {
  override readonly name: string = "APIError";
  /** The request that failed. */
  readonly request: FailedRequest;
  /** The response's parsed JSON body, or its text, or `undefined` when there is no response. */
  readonly body: unknown;

  /**
   * @param message - A human-readable description of the error.
   * @param options - The request, the body, and the cause.
   */
  constructor(message: string, options: APIErrorOptions) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.request = options.request;
    this.body = options.body;
  }
}

/** The request did not get a response, e.g. the server is unreachable. */
export class APIConnectionError extends APIError {
  override readonly name: string = "APIConnectionError";
}

/** The request timed out. */
export class APITimeoutError extends APIConnectionError {
  override readonly name: string = "APITimeoutError";

  /**
   * @param request - The request that timed out.
   * @param cause - The abort that ended it.
   */
  constructor(request: FailedRequest, cause?: unknown) {
    super("Request timed out.", { request, cause });
  }
}

/**
 * The api's response does not match the SDK's schema of it.
 *
 * This usually means that the SDK and the Smarter platform are of incompatible versions.
 */
export class APIResponseValidationError extends APIError {
  override readonly name: string = "APIResponseValidationError";
  /** The response's http status. */
  readonly statusCode: number;

  /**
   * @param message - A description of the mismatch.
   * @param options - The request, the response's status and body, and the validation error.
   */
  constructor(message: string, options: APIErrorOptions & { statusCode: number }) {
    super(message, options);
    this.statusCode = options.statusCode;
  }
}

/** Options of an {@link APIStatusError}. */
export interface APIStatusErrorOptions extends APIErrorOptions {
  /** The response's http status. */
  statusCode: number;
  /** The response's headers. */
  headers: Headers;
  /** The Smarter Journal error body, when the response is a journaled error. */
  error?: SAMJournalApiErrorBody | undefined;
}

/** The api returned a 4xx or 5xx status. */
export class APIStatusError extends APIError {
  override readonly name: string = "APIStatusError";
  /** The response's http status. */
  readonly statusCode: number;
  /** The response's headers. */
  readonly headers: Headers;
  /** The Smarter Journal error body, when the response is a journaled error. */
  readonly error: SAMJournalApiErrorBody | undefined;

  /**
   * @param message - The error's description, from the response when it has one.
   * @param options - The request, the response's status, headers and body, and its journal error.
   */
  constructor(message: string, options: APIStatusErrorOptions) {
    super(message, options);
    this.statusCode = options.statusCode;
    this.headers = options.headers;
    this.error = options.error;
  }

  /** The name of the server-side exception class, e.g. `SAMBrokerErrorNotFound`, when the platform sent it. */
  get errorClass(): string | undefined {
    return this.error?.errorClass;
  }

  override toString(): string {
    return `${this.name}: Error code: ${String(this.statusCode)} - ${this.message}`;
  }
}

/** 400: the request is invalid, e.g. a malformed manifest. */
export class BadRequestError extends APIStatusError {
  override readonly name: string = "BadRequestError";
}

/** 401: the api key is missing, invalid, or inactive. */
export class AuthenticationError extends APIStatusError {
  override readonly name: string = "AuthenticationError";
}

/** 403: the api key's user may not perform the operation. */
export class PermissionDeniedError extends APIStatusError {
  override readonly name: string = "PermissionDeniedError";
}

/** 404: the resource does not exist, or the api key's user may not read it. Also an `instanceof` {@link ResourceNotFoundError}. */
export class NotFoundError extends APIStatusError {
  override readonly name: string = "NotFoundError";
}

/** 409: the request conflicts with the resource's current state. */
export class ConflictError extends APIStatusError {
  override readonly name: string = "ConflictError";
}

/** 422: the request is well-formed but cannot be processed. */
export class UnprocessableEntityError extends APIStatusError {
  override readonly name: string = "UnprocessableEntityError";
}

/** 429: too many requests. */
export class RateLimitError extends APIStatusError {
  override readonly name: string = "RateLimitError";
}

/** 5xx: the platform failed to process the request. */
export class InternalServerError extends APIStatusError {
  override readonly name: string = "InternalServerError";
}

/** A streamed prompt failed: its `result` event carried an error response. */
export class SmarterPromptError extends SmarterError {
  override readonly name: string = "SmarterPromptError";
  /** The error response. */
  readonly response: PromptChatApiPromptResponse | PromptChatApiErrorResponse;

  /**
   * @param message - The error's description.
   * @param response - The error response.
   */
  constructor(message: string, response: PromptChatApiPromptResponse | PromptChatApiErrorResponse) {
    super(message);
    this.response = response;
  }
}
