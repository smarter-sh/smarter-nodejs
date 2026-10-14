# ADR-007: Logging

## Status

Accepted

Follows the Python SDK's [ADR-007](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/007-logging.md), which adapts the platform's [ADR-011: Logging](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/011-logging.rst).

## Context

Node.js has no standard logging hierarchy like Python's `logging`. A library must not write to its caller's console unasked, and must never log an api key.

## Decision

The client takes a `logger` option: any object with `debug`, `info`, `warn` and `error` methods, which `console`, pino, winston and bunyan loggers all have. By default nothing is logged. `SMARTER_LOG=info` (requests: method, url, status, duration) or `SMARTER_LOG=debug` (and their bodies), or the `logLevel` option, turn logging on, to `console` when no logger is given. Each message starts with `smarter:` and its source (`smarter:http`). Api keys are masked by `maskSecret()` everywhere they appear.

## Alternatives Considered

- The `debug` package and `DEBUG=smarter:*`. Another dependency, and a different switch from the Python SDK's.
- Always log to `console`.

## Consequences

- **Positive:**
  - The SDK behaves as a well-mannered library, and writes to the application's own logger.
  - Debugging a request needs only an environment variable, the same one as in the Python SDK.
- **Negative:**
  - Debug logs contain request bodies, e.g. prompts, which the caller must treat as sensitive.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-016: Security](016-security.md)
