# ADR-010: CI/CD

## Status

Accepted

Follows the Python SDK's [ADR-010](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/010-ci-cd.md), and the platform's [ADR-014: CI/CD](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/014-ci-cd.rst).

## Context

Every change should be tested, and every release built the same way.

## Decision

GitHub Actions only, as on the platform and in the other SDKs. `test.yml` type-checks, lints and runs the unit tests on every supported Node.js version (ADR-019) for every push and pull request, enforces 90% coverage, and uploads coverage to Codecov. `build.yml` builds the package and checks it with `npm pack --dry-run` and `publint`. Releases are versioned by semantic-release (ADR-015). Publishing to npm is done by hand (`make publish`), as publishing to PyPI is for the Python SDK.

## Alternatives Considered

- Publish from CI with npm provenance. A good next step once the package has a stable api; it needs an npm token in the repository's secrets.

## Consequences

- **Positive:**
  - Consistent with the platform's and the Python SDK's workflows.
- **Negative:**
  - Publishing is a manual step.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-009: Testing](009-testing.md)
- [ADR-015: Semantic Versioning and API Versions](015-versioning.md)
