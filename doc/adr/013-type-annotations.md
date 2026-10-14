# ADR-013: Type Annotations

## Status

Accepted

Follows the Python SDK's [ADR-013](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/013-type-annotations.md), and the platform's [ADR-027: Python Annotations](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/027-annotations.rst).

## Context

The SDK's types are read by its callers' compilers and editors, not only by its own developers. `any` switches type checking off for everything it touches, in the SDK and in its callers' code.

## Decision

The SDK is written in TypeScript with `strict` on, and ships its declaration files. `any` is not used: a value whose type really is unknown is `unknown`, and is narrowed before use. ESLint's `@typescript-eslint/no-explicit-any` enforces it. Repeated constructions are the aliases of `src/core/typing.ts`, which mirror the Python SDK's `smarter.core.typing`:

| Alias        | Means                                  | Python SDK              |
| ------------ | -------------------------------------- | ----------------------- |
| `JsonValue`  | any JSON value                         | `SmarterJsonType`       |
| `JsonObject` | `{ [key: string]: JsonValue }`         | `SmarterJsonObjectType` |
| `SmarterId`  | `number \| string`, an id or hashed id | `SmarterIdType`         |

## Alternatives Considered

- Allow `any` where it is convenient, as much JavaScript does.

## Consequences

- **Positive:**
  - Callers get completion and type checking for every call and response.
- **Negative:**
  - Types are part of the public api, and change with it (ADR-015).

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-004: Zod Models, Forward Compatible](004-zod-models.md)
