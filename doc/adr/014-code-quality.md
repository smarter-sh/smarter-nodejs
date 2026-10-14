# ADR-014: Code Quality

## Status

Accepted

Follows the Python SDK's [ADR-014](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/014-code-quality.md), and the platform's [ADR-028: Code Quality](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/028-code-quality.rst).

## Context

Consistent code is easier to review, and the SDK is developed beside the platform, whose React workspace already has a TypeScript standard.

## Decision

`.pre-commit-config.yaml` is the standard: Prettier, ESLint (`typescript-eslint`'s strict, type-checked rules), `tsc --noEmit`, codespell, the generic pre-commit hooks (whitespace, end of file, JSON and YAML syntax, merge conflicts, private keys, AWS credentials), and commitlint on commit messages, as on the platform. Rules aren't disabled indiscriminately: a suppression is narrow, and says why.

## Alternatives Considered

- Biome, which replaces Prettier and ESLint with one tool. The platform uses Prettier and ESLint.

## Consequences

- **Positive:**
  - The SDK reads like the platform's TypeScript.
- **Negative:**
  - Hook versions must be kept in step with the platform's.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-012: Doc Comments and Documentation](012-documentation.md)
