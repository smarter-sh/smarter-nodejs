# ADR-009: Testing

## Status

Accepted

Follows the Python SDK's [ADR-009](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/009-testing.md), which adapts the platform's [ADR-013: Testing](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/013-testing.rst).

## Context

The SDK's correctness depends on a platform that it can't run in CI, and the local platform's containers hold credentials for real cloud infrastructure.

## Decision

[Vitest](https://vitest.dev), the platform's React test runner, runs two suites:

- **Unit tests** (`test/<module>.test.ts`, one per source module) build their client with `mockPlatform()` (`test/helpers.ts`), the SDK's counterpart of the Python SDK's `SmarterTestBase`. A `fetch` double answers every request from the routes that the test registers, with sanitized copies of real platform responses (`test/data/`, the same fixtures as the Python SDK's). They run in CI on every supported Node.js version, with at least 90% coverage (V8 coverage).
- **Live tests** (`test/live/`, skipped unless `SMARTER_TEST_LIVE=true`) run against a real platform, and validate every model against real responses. They may send billable prompts, and create and delete throwaway resources. **They never deploy anything.** A platform error skips a check with the platform's message, and an SDK error fails it.

## Alternatives Considered

- `node:test`, which needs no dependency. Vitest is what the platform's developers already use, and runs TypeScript without a build step.
- Only mocked tests, or only live tests.

## Consequences

- **Positive:**
  - Fast, hermetic CI, and models checked against reality before release.
  - Fixtures are shared with the Python SDK, so both SDKs are tested against the same responses.
- **Negative:**
  - Live tests must be run by hand before a release.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-005: Mirrored Contracts and Generated SAM Types](005-platform-models.md)
- [ADR-010: CI/CD](010-ci-cd.md)
- [ADR-016: Security](016-security.md)
