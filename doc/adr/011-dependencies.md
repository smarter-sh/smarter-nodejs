# ADR-011: Dependency Management

## Status

Accepted

Follows the Python SDK's [ADR-011](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/011-dependencies.md), which adapts the platform's [ADR-015: Dependency Management](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/015-dependency-management.rst).

## Context

An application pins its dependencies. A library can't: its pins would conflict with its callers', and every dependency it brings is installed in their `node_modules`.

## Decision

Runtime `dependencies` are few: `zod` (models, ADR-004), `ajv` (SAM validation, ADR-005) and `yaml` (manifests and the cli's configuration file). They are declared as caret ranges (`^4.1.0`). HTTP uses the built-in `fetch` (ADR-008). Development tools are `devDependencies` pinned to exact versions, and `package-lock.json` is committed, so that CI and every developer test with the same tools. Dependabot and Mergify keep both current, as on the platform.

## Alternatives Considered

- Pin runtime dependencies.
- Bundle the runtime dependencies into the package.

## Consequences

- **Positive:**
  - The SDK installs beside any application's own versions, and npm deduplicates the common ones.
- **Negative:**
  - The ranges must be tested: CI runs the newest versions within them, and the `monthly-maintenance` skill also tests the lowest.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-010: CI/CD](010-ci-cd.md)
