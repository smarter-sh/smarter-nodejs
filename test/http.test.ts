/** Test src/core/http.ts. */

import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  CLIENT_NAME,
  errorMessage,
  isRetryable,
  journalError,
  makeStatusError,
  parseBody,
  queryString,
  retryDelay,
} from "../src/core/http.ts";
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
} from "../src/index.ts";
import { API, API_KEY, jsonResponse, loadJson, loadText, mockPlatform, type MockPlatform } from "./helpers.ts";

const request = { method: "GET", url: API };

describe("http helpers", () => {
  it("writes booleans as true and false, and leaves out null values", () => {
    expect(queryString({ a: true, b: false, c: null, d: 3, e: undefined })).toBe("a=true&b=false&d=3");
    expect(queryString(undefined)).toBe("");
  });

  it("parses a body as JSON, as text, or as nothing", () => {
    expect(parseBody('{"a": 1}')).toEqual({ a: 1 });
    expect(parseBody("plain")).toBe("plain");
    expect(parseBody("")).toBeUndefined();
  });

  it("gives a readable message for each of the platform's error shapes", () => {
    const journaled = loadJson("describe_missing") as { error: { description: string } };
    const cases: [unknown, string][] = [
      [journaled, journaled.error.description],
      [{ error: "text is required." }, "text is required."],
      [{ detail: "Not found." }, "Not found."],
      [{ error: { description: "nested" } }, "nested"],
      ["Forbidden: no", "Forbidden: no"],
      ["<html><body>debug page</body></html>", "500 Internal Server Error"],
      [undefined, "500 Internal Server Error"],
    ];
    for (const [body, expected] of cases) {
      expect(errorMessage(500, "Internal Server Error", body, journalError(body))).toBe(expected);
    }
    expect(errorMessage(500, "", { error: { errorClass: "X", status: 500 } }, { errorClass: "X", status: 500 })).toBe(
      "X",
    );
  });

  it("throws each status's own error class", () => {
    const cases: [number, typeof APIStatusError][] = [
      [400, BadRequestError],
      [401, AuthenticationError],
      [403, PermissionDeniedError],
      [404, NotFoundError],
      [409, ConflictError],
      [422, UnprocessableEntityError],
      [429, RateLimitError],
      [500, InternalServerError],
      [503, InternalServerError],
      [418, APIStatusError],
    ];
    for (const [status, errorClass] of cases) {
      expect(makeStatusError(request, new Response("{}", { status }), "{}").constructor).toBe(errorClass);
    }
  });

  it("parses a journaled error response's error, and nothing else", () => {
    const body = loadText("describe_missing.json");
    expect(makeStatusError(request, new Response(body, { status: 404 }), body).errorClass).toBe(
      "SAMBrokerErrorNotReady",
    );
    expect(journalError({ error: { unexpected: true } })).toBeUndefined();
    expect(journalError(["not", "an", "object"])).toBeUndefined();
  });

  it("retries transient statuses, and a 503 only when the platform did not send it", () => {
    expect(isRetryable(502, "")).toBe(true);
    expect(isRetryable(429, "")).toBe(true);
    expect(isRetryable(503, "Service Unavailable")).toBe(true);
    expect(isRetryable(503, loadText("describe_missing.json"))).toBe(false);
    expect(isRetryable(500, "")).toBe(false);
    expect(isRetryable(404, "")).toBe(false);
  });

  it("honors Retry-After up to a limit, and otherwise backs off exponentially", () => {
    expect(retryDelay(0, new Headers({ "retry-after": "3" }))).toBe(3);
    expect(retryDelay(0, new Headers({ "retry-after": "3600" }))).toBeLessThanOrEqual(0.5);
    expect(retryDelay(0, new Headers({ "retry-after": "soon" }))).toBeLessThanOrEqual(0.5);
    expect(retryDelay(3)).toBeGreaterThan(2.9);
    expect(retryDelay(10)).toBeLessThanOrEqual(8);
  });
});

describe("SmarterHttpClient", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("sends the api key, the SDK's identity, and the chat contract version", async () => {
    platform.route("POST", "cli/whoami/", { fixture: "whoami" });
    await platform.makeClient({ defaultHeaders: { "X-Custom": "1" } }).whoami();
    const headers = platform.lastRequest.headers;
    expect(headers.get("authorization")).toBe(`Token ${API_KEY}`);
    expect(headers.get("x-smarter-client")).toBe(CLIENT_NAME);
    expect(headers.get("x-smarter-capabilities")).toBe("chat-contract-v2");
    expect(headers.get("user-agent")).toMatch(/^smarter-nodejs\//);
    expect(headers.get("x-custom")).toBe("1");
  });

  it("makes paths relative to the api's base url, and keeps absolute urls", () => {
    expect(platform.client.http.url("/cli/whoami/")).toBe(`${API}cli/whoami/`);
    expect(platform.client.http.url("https://other/x")).toBe("https://other/x");
    expect(platform.client.http.url("https://other/x?a=1", { b: 2 })).toBe("https://other/x?a=1&b=2");
  });

  it("retries a transient failure, and returns the retry's response", async () => {
    const statuses = [502, 200];
    platform.route("POST", "cli/whoami/", {
      handler: () => {
        const status = statuses.shift() ?? 500;
        return jsonResponse(status === 200 ? loadJson("whoami") : {}, status, { "retry-after": "0" });
      },
    });
    expect((await platform.makeClient({ maxRetries: 2 }).whoami()).user.username).toBeTruthy();
    expect(platform.requests).toHaveLength(2);
  });

  it("throws a failure that persists through the retries", async () => {
    platform.route("POST", "cli/whoami/", {
      status: 429,
      json: { detail: "slow down" },
      headers: { "retry-after": "0" },
    });
    await expect(platform.makeClient({ maxRetries: 2 }).whoami()).rejects.toBeInstanceOf(RateLimitError);
    expect(platform.requests).toHaveLength(3);
  });

  it("throws a 4xx other than 408 and 429 at once", async () => {
    platform.route("POST", "cli/whoami/", { status: 401, json: { detail: "Invalid token." } });
    const error = await platform
      .makeClient({ maxRetries: 3 })
      .whoami()
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect((error as AuthenticationError).message).toBe("Invalid token.");
    expect(platform.requests).toHaveLength(1);
  });

  it("retries a timeout, then throws an APITimeoutError", async () => {
    platform.route("POST", "cli/whoami/", {
      handler: (req) =>
        new Promise((_resolve, reject) => {
          req.signal.addEventListener("abort", () => {
            reject(req.signal.reason as Error);
          });
        }),
    });
    const client = platform.makeClient({ maxRetries: 1, timeout: 0.05 });
    await expect(client.whoami()).rejects.toBeInstanceOf(APITimeoutError);
    expect(platform.requests).toHaveLength(2);
  });

  it("retries a connection failure, then throws an APIConnectionError", async () => {
    platform.route("POST", "cli/whoami/", {
      handler: () => {
        throw new TypeError("fetch failed: refused");
      },
    });
    const error = await platform
      .makeClient({ maxRetries: 1 })
      .whoami()
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(APIConnectionError);
    expect(error).not.toBeInstanceOf(APITimeoutError);
    expect((error as APIConnectionError).message).toContain("refused");
    expect(platform.requests).toHaveLength(2);
  });

  it("rejects with the caller's reason when the caller aborts, without retrying", async () => {
    platform.route("POST", "cli/whoami/", {
      handler: (req) =>
        new Promise((_resolve, reject) => {
          req.signal.addEventListener("abort", () => {
            reject(req.signal.reason as Error);
          });
        }),
    });
    const controller = new AbortController();
    const pending = platform.makeClient({ maxRetries: 3 }).whoami({ signal: controller.signal });
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
    expect(platform.requests).toHaveLength(1);
  });

  it("throws APIResponseValidationError for a response that doesn't match its schema", async () => {
    platform.route("POST", "cli/whoami/", { json: { data: { user: "not an object" } } });
    const error = await platform.client.whoami().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(APIResponseValidationError);
    expect((error as APIResponseValidationError).statusCode).toBe(200);
  });

  it("accepts any body with a permissive schema", async () => {
    platform.route("DELETE", "x/", { status: 204 });
    expect(await platform.client.http.request("DELETE", "x/", z.unknown())).toBeUndefined();
  });

  it("streams a response's events, and asks for Server-Sent Events", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { text: loadText("prompt_sse.txt") });
    const names: (string | null)[] = [];
    for await (const event of platform.client.http.events("POST", "llm-clients/5/prompt/", { json: {} }))
      names.push(event.event);
    expect(names.at(-1)).toBe("result");
    expect(platform.lastRequest.headers.get("accept")).toBe("text/event-stream");
  });

  it("closes a stream that the caller stops reading early", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { text: loadText("prompt_sse.txt") });
    for await (const event of platform.client.http.events("POST", "llm-clients/5/prompt/")) {
      expect(event.event).toBe("progress");
      break;
    }
  });

  it("throws an APITimeoutError when a stream stalls", async () => {
    platform.route("POST", "llm-clients/5/prompt/", {
      handler: () => new Response(new ReadableStream({ start: () => undefined })),
    });
    const events = platform.client.http.events("POST", "llm-clients/5/prompt/", { timeout: 0.05 });
    await expect(events.next()).rejects.toBeInstanceOf(APITimeoutError);
  });

  it("throws an APIConnectionError when a stream breaks", async () => {
    platform.route("POST", "llm-clients/5/prompt/", {
      handler: () =>
        new Response(
          new ReadableStream({
            pull: (controller) => {
              controller.error(new Error("reset"));
            },
          }),
        ),
    });
    await expect(platform.client.http.events("POST", "llm-clients/5/prompt/").next()).rejects.toBeInstanceOf(
      APIConnectionError,
    );
  });

  it("sends a raw body as is", async () => {
    platform.route("POST", "cli/apply/", { json: { message: "ok" } });
    await platform.client.http.request("POST", "cli/apply/", z.unknown(), {
      body: "kind: Secret",
      headers: { "Content-Type": "application/x-yaml" },
    });
    expect(await platform.lastRequest.text()).toBe("kind: Secret");
    expect(platform.lastRequest.headers.get("content-type")).toBe("application/x-yaml");
  });
});
