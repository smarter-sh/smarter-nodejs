---
name: smarter-tsdoc
description: Use when writing or editing doc comments in the smarter-nodejs SDK. Doc comments are TSDoc, shown in editors and generated into the SDK's api reference on docs.smarter.sh, and they say what the Python SDK's docstring of the same object says. Covers the tags, layout, content, links, and how to check them.
---

# Smarter Node.js SDK Doc Comments

Doc comments do three jobs: editors show them on hover, they explain the code
to developers, and `scripts/generate-reference.ts` turns them into the SDK's
api reference on docs.smarter.sh (see `smarter-sphinx-docs`). Write for a
JavaScript programmer who is new to Smarter.

**Start from the Python SDK's docstring** of the same object
(`../smarter-python/smarter/...`), and translate it: same summary, same
parameters, same warnings, with this SDK's names (`sessionKey`, not
`session_key`). The two SDKs' docs should read as one set.

## Style: TSDoc

````ts
/**
 * Dry-run a Guardrail on a text, without saving an event.
 *
 * @param id - The Guardrail's id or hashed id.
 * @param text - The text, e.g. a prompt (`input`) or an LLM's reply (`output`).
 * @param params - `stage`: the stage to evaluate the text as. The Guardrail must run on it.
 * @param options - Per-request options: `signal`, `timeout` and `headers`.
 * @returns Whether it triggered, its disposition, and the text after its action.
 * @throws {@link BadRequestError} If the text is empty or too long, or the Guardrail does not run on the stage.
 *
 * @example
 * ```ts
 * const result = await client.guardrails.evaluate(17, "My card is 4111 1111 1111 1111");
 * if (result.triggered) console.log(result.disposition, result.text);
 * ```
 */
````

- `@param name - description` for each parameter (the hyphen is TSDoc's).
  Types come from the signature: don't repeat them.
- `@returns` says what the value means, including `null` cases.
- `@throws {@link SomeError} when ...` for each error that callers should handle.
- `@example` with a fenced `ts` block, for every resource method that a user
  calls, and every module.
- `@deprecated Use x instead.` for a renamed api, kept for a release.

## Layout

- The first paragraph is **one sentence that ends with a period**: it is the
  summary that the reference and editors show in lists.
- Then a blank line, then the body, then the tags.
- Use one blank line between paragraphs. Don't hard-wrap below 100 columns
  unless Prettier does.

## Content

- **Modules** start with a `@packageDocumentation`-style comment (the file's
  first comment) that says what the module is for, with an `@example`.
- **Classes** say what the class represents. A resource class names its
  endpoint and its manifest kind (e.g. `Guardrails: /api/v1/guardrails/, and the
manifest api's Guardrail kind.`).
- **Methods** cover purpose, parameters, return value, the errors a caller
  should handle, and side effects that matter to a caller: **billable** LLM
  requests, and **real infrastructure** that a deploy creates.
- **Schema fields** are documented with a comment on the field in the
  `z.looseObject({...})` call. Values that the platform may add to are listed,
  e.g. `/** http, sse or stdio. */`.
- **Generated code** (`src/models/sam/`) takes its comments from the
  platform's schema. Fix those in the platform's models, then regenerate.
- Say why, not only what, when the reason isn't obvious.
- Be accurate. When you change behavior, update the comment in the same edit.

## Links and code

- `` `backticks` `` for literals: field names, values, commands, file names.
- `{@link Guardrails.evaluate}` for a link to another exported object.
- Don't link the platform's or the Python SDK's code: the reference can't
  resolve it. Name it in backticks instead.
- Don't let a letter follow a closing backtick (`` `File`s ``): the reference
  turns backticks into reST literals, which must end before a non-word
  character. Write "`File` objects".

## Test names

A test's name states the behavior it proves:
`it("evaluate() sends the text and stage, and returns the findings", ...)`.
A `describe` block names the module or class under test.

## Verify

- ESLint's `tsdoc/syntax` rule checks the syntax (`smarter-code-quality`).
- Regenerate the api reference (`npm run reference`) and check its pages as
  `smarter-sphinx-docs` describes. Don't build the platform's docs.
