# ADR-018: An Asynchronous Client

## Status

Accepted

Replaces, for Node.js, the Python SDK's [ADR-018: A Synchronous Client First](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/018-synchronous-client.md).

## Context

Python programs are synchronous or `asyncio`-based, so the Python SDK chose one of two clients. In Node.js, I/O is asynchronous: `fetch` returns a promise, and a synchronous HTTP client would block the event loop.

## Decision

Every method that sends a request returns a `Promise`. A streamed prompt is an async iterable of progress events (`for await (const event of stream)`), whose `response` resolves when the stream has been read. A `ChatSession` keeps its thread between `await`ed calls.

## Alternatives Considered

- A synchronous client as well. Node.js has no good way to make one.

## Consequences

- **Positive:**
  - One client, idiomatic for Node.js, and concurrent calls cost nothing extra.
- **Negative:**
  - The method names and arguments are the Python SDK's, but callers `await` them.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-008: HTTP Transport, Retries and Timeouts](008-http-transport.md)
