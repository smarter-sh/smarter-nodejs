# ADR-010: CI/CD

## Status

Accepted

Follows the Python SDK's [ADR-010](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/010-ci-cd.md), and the platform's [ADR-014: CI/CD](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/014-ci-cd.rst).

## Context

Every change should be tested, and every release built the same way.

## Decision

GitHub Actions only, as on the platform and in the other SDKs. `test.yml` type-checks, lints and runs the unit tests on every supported Node.js version (ADR-019), enforces 90% coverage, and uploads coverage to Codecov. `build.yml` builds the package and checks it with `npm pack --dry-run` and `publint`. Both run on every pull request.

`pushMain.yml` releases and publishes, in one workflow, as the Python SDK's `release.yml` does, so that a version can't be tagged on GitHub and never reach npm. On each push to `main`, and to `alpha` and `beta`, it runs `test.yml` and `build.yml`, and only if both pass, semantic-release versions the release (ADR-015), as a prerelease on `alpha` and `beta`. The publish job then builds the release's tag, checks the package and the version it reports, and publishes it to the public npm registry in the `@smarter.sh` scope with `--access public`: a release from `main` with the `latest` dist-tag, and a prerelease with `alpha` or `beta`, so that a plain `npm install` never gets a prerelease. It uses npm's trusted publishing (OIDC) with provenance, as the platform publishes `@smarter.sh/ui-chat`: no npm token is stored in the repository. `make release` publishes by hand, for when the workflow can't, e.g. the first version, before a trusted publisher can be configured.

## Alternatives Considered

- Publish by hand with `make release`. The SDK's first releases were; versions were tagged on GitHub that never reached npm.
- `@semantic-release/npm`. It needs an npm token in the repository's secrets, and publishes before the tag's own build is checked.

## Consequences

- **Positive:**
  - Every release that passes the tests and the build reaches npm, with provenance.
  - Consistent with the platform's and the Python SDK's workflows.
- **Negative:**
  - The trusted publisher must be configured on npmjs.com (repository `smarter-sh/smarter-nodejs`, workflow `pushMain.yml`, environment `npm`).

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-009: Testing](009-testing.md)
- [ADR-015: Semantic Versioning and API Versions](015-versioning.md)
