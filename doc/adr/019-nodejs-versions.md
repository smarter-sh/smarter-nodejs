# ADR-019: Supported Node.js Versions

## Status

Accepted

Adapts the Python SDK's [ADR-019: Supported Python Versions](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/019-python-versions.md).

## Context

The SDK runs in its callers' environments, which are often older than the newest Node.js. Node.js releases an even-numbered LTS line every October, and each is supported for 30 months.

## Decision

The SDK supports every Node.js release line that is not end-of-life: 22, 24 and 26 as of October 2026 (`"engines": { "node": ">=22" }`). CI tests each one (ADR-010). The SDK relies only on what all of them have: global `fetch`, `AbortSignal.timeout()`, web streams, and `require()` of ES modules (ADR-020).

The SDK targets Node.js. It may work in other runtimes (Deno, Bun, edge functions) that have `fetch`, if every option is passed explicitly, but they are not tested.

## Alternatives Considered

- Only the newest LTS.
- Browsers. A browser would expose the api key to the page's users; front ends should call the chat api through their own back end, or use Smarter Chat.

## Consequences

- **Positive:**
  - The SDK installs in most current environments.
- **Negative:**
  - The minimum rises as versions reach end-of-life, which is a breaking change for callers on them.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-010: CI/CD](010-ci-cd.md)
- [ADR-020: ES Modules Only](020-esm-only.md)
