# ADR-012: Doc Comments and Documentation

## Status

Accepted

Follows the Python SDK's [ADR-012](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/012-documentation.md).

## Context

The SDK's users read docs.smarter.sh, which is built with Sphinx from the platform's repository, and their editors show a function's doc comment on hover.

## Decision

- Every exported object has a **TSDoc** comment (`/** ... */`), with `@param`, `@returns`, `@throws` and `@example` tags. It is the same content as the Python SDK's docstring of the same object.
- The SDK's documentation lives **in the platform's repository**, under `docs/source/smarter-framework/smarter-nodejs*`, beside the Python SDK's, so that docs.smarter.sh is one site.
- Its api reference is **generated** from the doc comments: `scripts/generate-reference.ts` reads TypeDoc's JSON output and writes Sphinx's JavaScript domain directives (`.. js:class::`, `.. js:method::`), which need no Sphinx extension. The generated pages are never edited.

## Alternatives Considered

- A TypeDoc html site of its own. A second site, styled differently, and not searchable from docs.smarter.sh.
- Only the README.

## Consequences

- **Positive:**
  - One documentation site, and a reference that can't drift from the code.
- **Negative:**
  - Documenting the SDK touches two repositories.
  - The generator must follow TypeDoc's JSON format, which changes between minor versions of TypeDoc; it is pinned (ADR-011).

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-013: Type Annotations](013-type-annotations.md)
