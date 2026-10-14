# ADR-004: Zod Models, Forward Compatible

## Status

Accepted

Adapts the Python SDK's [ADR-004: Pydantic Models, Forward Compatible](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/004-pydantic-models.md), and through it the platform's [ADR-031: Pydantic Models Over Raw JSON](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/031-pydantic-over-json.rst).

## Context

Every response is JSON. TypeScript types alone are erased at run time: a response that doesn't match its type is discovered later, far from its cause. The Python SDK validates every response with Pydantic, and raises `APIResponseValidationError` at the request that returned it. An SDK also runs against platforms newer than itself, which add fields and enum values in minor releases.

## Decision

Every response is validated with a [Zod](https://zod.dev) (v4) schema, and its TypeScript type is inferred from that schema, so the two can't disagree. A model is exported as a schema and a type of the same name:

```ts
export const Guardrail = SmarterResource.extend({ stage: z.string().nullish(), ... });
export type Guardrail = z.infer<typeof Guardrail>;
```

As in the Python SDK:

- **every object schema keeps the fields that it doesn't declare** (`z.looseObject`), and they stay on the parsed object,
- a value that the platform may add to (a plugin's class, a progress event's type) is a `string` whose known values are listed in its doc comment, not a union of literals,
- arbitrary JSON is `JsonValue`, and a JSON object whose fields depend on a kind is `JsonObject` (ADR-013),
- a response that doesn't match its schema throws `APIResponseValidationError`.

Unlike the Python SDK, **timestamps stay ISO 8601 strings**: a `Date` doesn't survive `JSON.stringify` round trips unchanged, and some platform responses carry naive timestamps that `Date` would silently read as local time.

A few responses carry convenience accessors that the Python models have as properties: a prompt response's `text`, and a `get` result's `names`. They are added as non-enumerable getters, so `JSON.stringify` of a response is exactly the platform's JSON.

## Alternatives Considered

- Types only, without run-time validation, as `openai-node` does. A platform change would surface far from its cause.
- Validate against the JSON Schemas of `openapi.json` with Ajv, and generate the types from it. The platform's schemas are strict (`additionalProperties: false`, enums), which is the opposite of what a forward-compatible client needs, and the generated names are the platform's internal ones.
- `io-ts`, `valibot`, `typebox`. Zod is the most widely known, and its inferred types read well in editors.

## Consequences

- **Positive:**
  - Callers get typed, validated objects, with editor completion.
  - An SDK release keeps working when the platform is upgraded.
- **Negative:**
  - A field that the platform removes or renames still breaks the SDK, as it should.
  - Extra fields are typed `unknown` through the index signature.
  - Zod is a run-time dependency (ADR-011).

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-005: Mirrored Contracts and Generated SAM Types](005-platform-models.md)
- [ADR-013: Type Annotations](013-type-annotations.md)
- [ADR-021: Names: camelCase Methods, the Wire's Field Names](021-naming.md)
