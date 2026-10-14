# ADR-006: Error Handling

## Status

Accepted

Follows the Python SDK's [ADR-006](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/006-error-handling.md), which adapts the platform's [ADR-012: Error Handling](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/012-error-handling.rst).

## Context

Callers need to tell a missing resource from a bad manifest, an expired key, an unreachable server, or a platform bug, and the platform returns errors in several shapes: the journal's `error` object, an `error` string, Django REST Framework's `detail`, and Django's html error page. JavaScript has single inheritance, and `catch` clauses can't filter by type.

## Decision

The error classes, their names and their hierarchy are the Python SDK's:

```text
SmarterError
├── SmarterConfigurationError
├── SmarterValueError
├── ResourceNotFoundError
├── SmarterPromptError
└── APIError
    ├── APIConnectionError
    │   └── APITimeoutError
    ├── APIResponseValidationError
    └── APIStatusError
        ├── BadRequestError          400
        ├── AuthenticationError      401
        ├── PermissionDeniedError    403
        ├── NotFoundError            404
        ├── ConflictError            409
        ├── UnprocessableEntityError 422
        ├── RateLimitError           429
        └── InternalServerError      5xx
```

An `APIStatusError` carries `statusCode`, a readable `message` from whichever shape the platform used, the parsed `body`, the `headers`, and the journal's `error` with `errorClass` when there is one. Every class sets `name`, so logs and `instanceof` read alike.

In Python, `NotFoundError` is also a `ResourceNotFoundError`, so that one `except` handles both a 404 and `find()` finding nothing. JavaScript has no multiple inheritance, so `ResourceNotFoundError` defines `Symbol.hasInstance`: `err instanceof ResourceNotFoundError` is true for a `NotFoundError` too.

Errors keep their cause (`new APIConnectionError(..., { cause })`).

## Alternatives Considered

- Let `fetch`'s `TypeError`s and `AbortError`s propagate.
- One error class with a status property.
- An `isNotFound(err)` helper instead of `Symbol.hasInstance`. It reads worse, and differs from the other SDKs.

## Consequences

- **Positive:**
  - Callers test exactly what they can handle, with `instanceof`.
  - Platform errors keep their server-side class name.
- **Negative:**
  - The mapping of the platform's error shapes must follow the platform.
  - `Symbol.hasInstance` is unusual, and is tested.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-004: Zod Models, Forward Compatible](004-zod-models.md)
- [ADR-008: HTTP Transport, Retries and Timeouts](008-http-transport.md)
