# ADR-008: HTTP Transport, Retries and Timeouts

## Status

Accepted

Follows the Python SDK's [ADR-008](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/008-http-transport.md).

## Context

Requests fail for transient reasons: timeouts, rate limits, gateways. The platform also answers 503 for a resource that isn't ready (`SAMBrokerErrorNotReady`), which no retry will fix. A prompt that calls several tools can take tens of seconds. Node.js 22 and later have `fetch` built in.

## Decision

All requests go through one transport, `SmarterHttpClient` in `src/core/http.ts`, on the global `fetch`. Its retry rules are the Python SDK's: it retries a request that got no response, or a 408, 429, 502 or 504, and a 503 only when the platform didn't send it (its body is not a journaled response), with exponential backoff and jitter, honoring `Retry-After` up to 60 seconds. The default is 2 retries and a 60 second timeout, enforced with `AbortSignal.timeout()`. Every method takes a last `options` argument with a `signal` to cancel it, a `timeout`, and extra `headers`.

Callers may pass their own `fetch` (e.g. one with a proxy agent, or a test double). Prompt progress is read as Server-Sent Events from the response's stream by the SDK's own parser, a port of the Python SDK's.

## Alternatives Considered

- `axios`, `got` or `undici`'s own api: a dependency for what `fetch` does.
- No retries.

## Consequences

- **Positive:**
  - No HTTP dependency, and the same retry behavior as every other Smarter SDK.
  - Transient failures are absorbed, and semantic ones fail fast.
- **Negative:**
  - A retried prompt may be billed twice if the first attempt reached the LLM. `maxRetries: 0` disables retries where that matters.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-006: Error Handling](006-error-handling.md)
- [ADR-018: An Asynchronous Client](018-asynchronous-client.md)
