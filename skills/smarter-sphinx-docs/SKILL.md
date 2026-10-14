---
name: smarter-sphinx-docs
description: Use when adding or editing the smarter-nodejs SDK's documentation, which lives in the Smarter platform's Sphinx docs (../smarter/docs/source/smarter-framework/smarter-nodejs*, published to docs.smarter.sh), or when regenerating the SDK's api reference pages from its TSDoc comments. Covers where each page goes, the generated reference and why it is generated, the evergreen-prose rule, and how to verify without the platform's 20-minute build.
---

# The SDK's Sphinx Documentation

The SDK has no docs folder of its own. Its documentation is a section of the
platform's docs, in the platform's repository, beside the Python SDK's, so that
docs.smarter.sh is one site:

| Content                                        | Location (in `../smarter/docs/source/`)                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| The SDK's landing page: what it is, SDK vs CLI | `smarter-framework/smarter-nodejs.rst`, in `apis-and-sdks.rst`'s toctree |
| Guides: configuration, manifests, chat, ...    | `smarter-framework/smarter-nodejs/<topic>.rst`                           |
| The api reference, **generated**               | `smarter-framework/smarter-nodejs/reference/**`                          |
| The SDK's own architecture decisions           | Not here: `doc/adr/` in this repository                                  |

The guides mirror the Python SDK's guides
(`smarter-framework/smarter-python/<topic>.rst`): the same topics, in the same
order, with the same examples in TypeScript. When you change one, check whether
the other needs the same change.

Load the platform's own `smarter-sphinx-docs` skill (`../smarter/skills/`) for
its general rules: headings (`=`, `-`, `~`, `^`), toctrees, code blocks, and
writing for a reader new to Smarter.

## The api reference is generated

Sphinx can't read TypeScript. `npm run reference` runs TypeDoc to get the
SDK's exported api and doc comments as JSON, then
`scripts/generate-reference.ts` writes them as Sphinx's built-in JavaScript
domain directives (`.. js:class::`, `.. js:method::`, `.. js:function::`), which
need no Sphinx extension:

```console
npm run reference          # writes into ../smarter/docs/source/smarter-framework/smarter-nodejs/reference/
```

- **Never edit the generated pages.** Fix the doc comment (`smarter-tsdoc`) and
  regenerate.
- A new module must be exported from `src/index.ts` to appear.
- The JavaScript domain's names (`Smarter`, `Guardrails.evaluate`) are not
  qualified by a package, so two exported objects with the same name collide.
  Don't export a name twice.

## Writing rules

- **Evergreen prose**, as in the platform: no "New in 0.2" sections. Weave a
  feature into the page where its topic belongs.
- Every example must type-check against the SDK:
  [scripts/check-examples.sh](scripts/check-examples.sh) compiles every
  `typescript` block of the SDK's pages with `tsc`. A page may use `client`,
  `llmclient`, `guardrail`, `mcpclient`, `store`, `chat` and `text` without
  declaring them. Check SAM field paths against the generated types (e.g. an
  LLMClient's provider is `spec.config.prompt.provider`), and run new examples
  against the local platform.
- Examples use ES modules and top-level `await` (an application may; the SDK
  itself may not), and `.. code-block:: typescript`.
- Link the platform's resource pages with `:doc:`, e.g.
  `:doc:`Guardrails <../../smarter-resources/smarter-guardrail>``.
- Say when an operation is **billable** (prompts) or creates **real
  infrastructure** (deploy).

## Verify (never the full build)

1. Links, with the platform's checker, from `../smarter`:

   ```console
   cd ../smarter && skills/smarter-sphinx-docs/scripts/check-docs.sh \
     docs/source/smarter-framework/smarter-nodejs.rst docs/source/smarter-framework/smarter-nodejs/*.rst \
     docs/source/smarter-framework/smarter-nodejs/reference/*.rst
   ```

2. The reST itself, with a build of **only the SDK's pages**, which takes
   seconds: [scripts/check-sdk-pages.sh](scripts/check-sdk-pages.sh). It reports
   every warning except links to pages outside the SDK's section. It must report
   none.

3. The examples: [scripts/check-examples.sh](scripts/check-examples.sh). It
   must say `ok`.

The user builds the full docs.
