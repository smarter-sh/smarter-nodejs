---
name: smarter-typescript-typing
description: Use when writing or reviewing TypeScript types in the smarter-nodejs SDK, especially any use of any, unknown, Record<string, unknown>, type assertions (as), non-null assertions (!), or a type construction that repeats. Explains when unknown is honest, the aliases in src/core/typing.ts (JsonValue, JsonObject, SmarterId), the Zod schema-and-type convention, and the SDK's typing traps (z.enum versus z.string, nullish, inferred types in declarations).
---

# Smarter Node.js SDK Types

A type is a claim about what a value can be. Callers' compilers and editors
take the SDK's declaration files at their word, so a loose type in the SDK
becomes a loose type in every caller. This is the platform's and the Python
SDK's rule (platform ADR-027, Python SDK `smarter-python-typing`), applied to
TypeScript (ADR-013).

## `any` is never used

`@typescript-eslint/no-explicit-any` is an error. Use:

- **a Zod schema** for a response (ADR-004). Its type is `z.infer<typeof Schema>`.
- **`JsonValue`** for JSON whose shape really is free, e.g. a tool's result or a
  proxy's response.
- **`JsonObject`** for a JSON object whose fields depend on a kind, e.g. a
  manifest's `spec`.
- **`unknown`** for a value the SDK hasn't inspected yet, e.g. a caught error
  or `await response.json()`, and narrow it before use (`instanceof`, `typeof`,
  or a schema's `safeParse`).
- **a union** when you can list the possibilities.

## Aliases in `src/core/typing.ts`

| Alias        | Means                          | Python SDK              | Use for                               |
| ------------ | ------------------------------ | ----------------------- | ------------------------------------- |
| `JsonValue`  | any JSON value                 | `SmarterJsonType`       | a tool's result, a proxy's response   |
| `JsonObject` | `{ [key: string]: JsonValue }` | `SmarterJsonObjectType` | a `spec`, a JSON object of free shape |
| `SmarterId`  | `number \| string`             | `SmarterIdType`         | a resource's id or hashed id          |

Each has a Zod schema of the same name (`JsonValue`, `JsonObject`) for use
inside other schemas. `src/core/typing.ts` imports only `zod`, so that any
module can import it. Keep it that way.

## Schemas and types

- A model is a schema and a type of the same name:

  ```ts
  export const MCPTool = z.looseObject({ name: z.string(), title: z.string().nullish() });
  export type MCPTool = z.infer<typeof MCPTool>;
  ```

- Every object schema is a `z.looseObject`, so a newer platform's fields are
  kept (ADR-004). Use `.extend()` to build on one; it stays loose.
- A field that the platform may omit or send as `null` is `.nullish()`. A field
  that is always present (e.g. an `id`) is required.
- **`z.enum` versus `z.string`.** An enum of values that the platform may add
  to (a plugin's class, an event's type) breaks the SDK when the platform is
  upgraded. Use `z.string()`, and list the known values in the field's doc
  comment. Keep literal unions for discriminators, and for arguments that the
  SDK sends (e.g. `stage: "input" | "output"`).
- **Timestamps are `z.string()`**, not `z.coerce.date()` (ADR-004).
- An exported function's return type is written out, not inferred, so that the
  declaration files stay readable and a change is deliberate.

## Assertions

- `as` tells the compiler to stop checking. Use it only after a check that the
  compiler can't follow, with a comment, never to silence an error.
- `!` (non-null assertion) is the same. Prefer a check that throws a
  `SmarterError` with a message.

## Checking your work

```console
npm run typecheck
git diff -- 'src/*.ts' | grep -nE '^\+.*(\bany\b| as [A-Z]|!\.)'
```

For each hit, ask: can I state what this value is? If so, state it.
