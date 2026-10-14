/** Test src/core/errors.ts. */

import { describe, expect, it } from "vitest";

import * as errors from "../src/core/errors.ts";

const request = { method: "GET", url: "http://testserver/api/v1/guardrails/" };

describe("errors", () => {
  it("every error class is a SmarterError, and has its own name", () => {
    for (const [name, value] of Object.entries(errors)) {
      if (typeof value !== "function") continue;
      expect(value === errors.SmarterError || value.prototype instanceof errors.SmarterError, name).toBe(true);
    }
    expect(new errors.SmarterValueError("x").name).toBe("SmarterValueError");
  });

  it("a NotFoundError is also an instanceof ResourceNotFoundError, and nothing else is", () => {
    const notFound = new errors.NotFoundError("gone", { request, statusCode: 404, headers: new Headers() });
    expect(notFound).toBeInstanceOf(errors.ResourceNotFoundError);
    expect(new errors.ResourceNotFoundError("x")).toBeInstanceOf(errors.ResourceNotFoundError);
    expect(new errors.BadRequestError("bad", { request, statusCode: 400, headers: new Headers() })).not.toBeInstanceOf(
      errors.ResourceNotFoundError,
    );
    expect(new errors.SmarterError("x")).not.toBeInstanceOf(errors.ResourceNotFoundError);
    class Subclass extends errors.ResourceNotFoundError {}
    expect(notFound).not.toBeInstanceOf(Subclass);
  });

  it("a status error carries its status, body and journal error", () => {
    const error = { errorClass: "SAMBrokerErrorNotFound", status: 404, description: "gone" };
    const e = new errors.NotFoundError("gone", {
      request,
      statusCode: 404,
      headers: new Headers(),
      body: { error: {} },
      error,
    });
    expect(e.statusCode).toBe(404);
    expect(e.errorClass).toBe("SAMBrokerErrorNotFound");
    expect(e.message).toBe("gone");
    expect(String(e)).toBe("NotFoundError: Error code: 404 - gone");
    expect(e.request).toBe(request);
    expect(
      new errors.APIStatusError("x", { request, statusCode: 418, headers: new Headers() }).errorClass,
    ).toBeUndefined();
  });

  it("connection and timeout errors carry their request and cause", () => {
    const cause = new Error("refused");
    const connection = new errors.APIConnectionError("Connection error.", { request, cause });
    expect(connection.cause).toBe(cause);
    const timeout = new errors.APITimeoutError(request);
    expect(timeout.message).toBe("Request timed out.");
    expect(timeout).toBeInstanceOf(errors.APIConnectionError);
  });

  it("a validation error carries its status and body", () => {
    const e = new errors.APIResponseValidationError("mismatch", { request, statusCode: 200, body: { a: 1 } });
    expect(e.statusCode).toBe(200);
    expect(e.body).toEqual({ a: 1 });
  });
});
