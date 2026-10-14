# ADR-020: ES Modules Only

## Status

Accepted

## Context

A JavaScript package can ship ES modules, CommonJS, or both. Shipping both doubles the build and invites the "dual package hazard" (two copies of a class, so `instanceof` fails). Every supported Node.js version (ADR-019) can `require()` an ES module that has no top-level `await`.

## Decision

The package is ES modules only (`"type": "module"`), with one entry point in `exports` and its declaration files. The source has no top-level `await`, so CommonJS callers can `require("smarter-api")` on every supported Node.js version.

## Alternatives Considered

- Dual ESM and CommonJS builds, with `tsup` or similar.
- CommonJS only.

## Consequences

- **Positive:**
  - One build, one copy of each class, and no bundler.
- **Negative:**
  - Callers on end-of-life Node.js versions that can't `require()` ES modules must use `import()`.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-019: Supported Node.js Versions](019-nodejs-versions.md)
