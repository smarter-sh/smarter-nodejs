---
name: smarter-nodejs-development
description: Start here for any change to the smarter-nodejs repository, the Smarter platform's Node.js SDK (the @smarter.sh/api npm package, written in TypeScript). Gives the non-negotiable rules, the SDK's architecture (client, transport, resources, Zod models, the generated SAM types and the mirrored api contracts), its relationship to the Python SDK (the reference implementation), how to cover a new platform endpoint, and an index of the narrower skills to load for each kind of work.
---

# Smarter Node.js SDK Development

`@smarter.sh/api` on npm is to the Smarter platform what the `openai` package is
to the OpenAI api: the library that JavaScript and TypeScript programmers
import to build custom software on their own Smarter installation, running
locally or on Kubernetes. The platform itself is
[smarter-sh/smarter](https://github.com/smarter-sh/smarter), usually checked out
beside this repository as `../smarter`. Its sibling SDKs are
[smarter-python](https://github.com/smarter-sh/smarter-python) (`../smarter-python`)
and [smarter-golang](https://github.com/smarter-sh/smarter-golang)
(`../smarter-golang`), and the [smarter cli](https://github.com/smarter-sh/smarter-cli)
(`../smarter-cli`, Go) covers the same api for people at a terminal.

The SDK's goal is to cover **all** of the platform's api, so that nobody needs
to customize or fork the backend to integrate with it.

## The Python SDK is the reference implementation

Every Smarter SDK has the same features, resources, verbs and errors
(`doc/adr/001-scope.md`). **Before you add or change a feature, read how
`../smarter-python` does it**, and keep the two in step: the same endpoint,
query parameters, request body, defaults, error and doc comment, in idiomatic
TypeScript (`doc/adr/021-naming.md`):

| Python SDK                                       | This SDK                                              |
| ------------------------------------------------ | ----------------------------------------------------- |
| `client.llm_clients.prompt(id, "hi")`            | `await client.llmClients.prompt(id, "hi")`            |
| `client.manifests.example_manifest("Guardrail")` | `await client.manifests.exampleManifest("Guardrail")` |
| keyword arguments (`session_key=...`)            | an options object (`{ sessionKey: "..." }`)           |
| Pydantic model, snake_case attributes            | Zod schema and type, **the wire's field names**       |
| `with client.llm_clients.stream(...) as s:`      | `for await (const event of stream)`                   |
| `except NotFoundError`                           | `if (err instanceof NotFoundError)`                   |
| `smarter/resources/guardrails.py`                | `src/resources/guardrails.ts`                         |
| `tests/test_guardrails.py`                       | `test/guardrails.test.ts`                             |

When the Python SDK has a feature that this SDK lacks, that is a bug here. When
you find a platform behavior that the Python SDK handles wrongly, tell the user:
both SDKs should be fixed.

## Repository map

| Path                                           | What lives there                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/index.ts`                                 | The package's exports                                                            |
| `src/client.ts`                                | `Smarter`, the client: configuration, the resources, `whoami`/`version`/`status` |
| `src/core/config.ts`                           | The configuration lookup (options, `SMARTER_*` env, the cli's config file)       |
| `src/core/http.ts`                             | `SmarterHttpClient`: auth, retries, error mapping, response validation, SSE      |
| `src/core/errors.ts`                           | The error hierarchy. Every error is a `SmarterError` (ADR-006)                   |
| `src/core/sse.ts`                              | The Server-Sent Events parser                                                    |
| `src/core/typing.ts`                           | `JsonValue`, `JsonObject`, `SmarterId`                                           |
| `src/resources/`                               | One module per resource family: `llmclients.ts`, `guardrails.ts`, ...            |
| `src/models/`                                  | Zod schemas and types of the api's responses, one module per family              |
| `src/models/chat.ts`, `journal.ts`, `react.ts` | Mirrors of the platform's api contracts                                          |
| `src/models/sam/`                              | **Generated** SAM types and schemas of every manifest kind. Never edit by hand   |
| `scripts/`                                     | `sync-contracts.sh`, `generate-sam-models.ts`, `generate-reference.ts`           |
| `test/`                                        | Unit tests (`*.test.ts`), fixtures (`test/data/`), live tests (`test/live/`)     |
| `doc/adr/`                                     | The SDK's architecture decision records                                          |
| `skills/`                                      | These skills                                                                     |

The SDK's documentation lives in the **platform's** repository:
`../smarter/docs/source/smarter-framework/smarter-nodejs*`. See
`smarter-sphinx-docs`.

## Before you start

The developer's shell may export `NODE_ENV=production`, which makes `npm
install` skip the devDependencies (Vitest, ESLint, TypeScript, ...). Install
with `npm install --include=dev`, as `make init` does.

## Non-negotiable rules

1. **Never execute git write commands**, in this repository or in `../smarter`.
   "Write a git commit" means output the command text. See `smarter-git-commits`.
2. **Run the tests yourself**, after every change: `make test` (or `npm test`).
   Never ask the user to re-run them. Report failures honestly, including
   pre-existing ones.
3. **Validate against a real platform.** A schema that has only met a
   hand-written fixture is a guess. Probe the endpoint (`smarter-api-testing`),
   build sanitized fixtures from real responses (or reuse the Python SDK's
   fixture of the same response), and run `make test-live` against the local
   platform before you call an endpoint covered.
4. **Never deploy from a test.** `deploy` creates real, billable cloud
   infrastructure (DNS, certificates, Kubernetes ingresses, GPU nodes). The live
   tests never call it. The local platform's containers hold live credentials:
   see `smarter-infrastructure-safety` in `../smarter/skills/`.
5. **The pre-commit hooks are the lint standard.** See `smarter-code-quality`.
6. **Coverage:** at least 90%, 95% where it takes moderate effort. CI fails
   below 90%.
7. **This repository is public.** No api keys, tokens, account numbers,
   private hostnames, names, addresses or customer data in code, fixtures,
   docs or skills. Sanitize every fixture taken from a real response, and grep
   it before you finish.
8. **No `any`.** Every response is a Zod schema (ADR-004). Arbitrary JSON is
   `JsonValue`, a JSON object whose shape depends on a kind is `JsonObject`.
   See `smarter-typescript-typing`.
9. **Doc comments are TSDoc** (`@param`, `@returns`, `@throws`, `@example`),
   saying what the Python SDK's docstring says. See `smarter-tsdoc`.
10. **No top-level `await`, and ES modules only** (ADR-020): CommonJS callers
    `require()` the package.
11. **smarter Sphinx docs** should build the SDK's pages in the smarter/docs/source/smarter-framework/. See `smarter-sphinx-docs`.

## Architecture, and why

Each decision below is recorded in `doc/adr/`, with the Python SDK ADR and the
platform ADR that it follows or adapts. Read the relevant ADR before you change
one of them, and add an ADR when you make a new decision of that size.

- **Writes go through the manifest api** (`/api/v1/cli/apply/`, `delete/`,
  ...), exactly as the cli sends them. The REST api is used only to **read**
  resources and for **actions** that the manifest api has no verb for (ADR-003).
- **Schemas keep extra fields** (`z.looseObject`), and values that the platform
  may add to are `z.string()`, not `z.enum()` (ADR-004). Timestamps stay
  strings.
- **Fields keep the wire's names**, camelCase or snake_case as the api has
  them; the SDK's own methods and options are camelCase (ADR-021).
- **A model is a schema and a type of the same name**:
  `export const Guardrail = ...; export type Guardrail = z.infer<typeof Guardrail>;`
- **The platform's models can't be imported**, so:
  - the **SAM types** are generated from the JSON Schema of each kind that the
    platform commits in `smarter/smarter/apps/api/v1/contract/sam/`
    (`make sam-models`), and `Manifest.toSam()` validates against the tolerant
    schemas with Ajv,
  - the **chat and journal contracts** are hand-mirrored in
    `src/models/chat.ts` and `journal.ts`, and `test/contracts.test.ts` checks
    them against the platform's committed schemas and examples
    (`make contracts`),
  - the **api** is published as `openapi.json`, and
    `test/contracts.test.ts` checks that every request of the SDK is one of its
    operations, and that the SDK calls every operation,
  - the **React contract** is copied in `src/models/react.ts`.
- **Configuration follows ADR-002**: options, `SMARTER_*` variables, the cli's
  `~/.smarter/config.yaml`, then defaults. Only `src/core/config.ts` reads
  `process.env`. Timeouts are in **seconds**.
- **Logging** goes to the caller's `logger` (console-compatible), and is off
  unless `SMARTER_LOG` or `logLevel` asks for it. Api keys are masked with
  `maskSecret()` (ADR-007, ADR-016).
- **The chat contract is always version 2**: every request sends
  `X-Smarter-Capabilities: chat-contract-v2`.
- **Every request method is `async`**, so that even an invalid argument is a
  rejection, never a synchronous throw. Its last argument is one options object:
  the method's own optional arguments (`{ sessionKey }`, `{ stage }`, ...) and
  the per-request `signal`, `timeout` (seconds) and `headers` (ADR-018, ADR-008).
- **One deliberate difference from the Python SDK**: the platform's
  `plugins/<id>/` returns a manifest, so `plugins.retrieve(id)` reads the
  plugin from the list, and `plugins.retrieveManifest(id)` is the Python SDK's
  `plugins.retrieve(id)`. TypeScript can't override a method with another
  return type.

## Covering a platform endpoint (the pattern)

1. Find the view and its url in `../smarter/smarter/smarter/apps/<app>/api/v1/`,
   and the Python SDK's method for it, if any. Read both.
2. Probe it on the local platform with a throwaway api key
   (`smarter-api-testing`) and save the real response in your scratchpad.
3. Add or extend the schema in `src/models/<family>.ts`: the fields that
   callers need, nullable (`.nullish()`) unless always present, on
   `z.looseObject`.
4. Add the method to `src/resources/<family>.ts`, copying its neighbors:
   `async`, `this.http.request("GET", path, Model, { ...options, params, json })`,
   ids through `resourceId()`, a TSDoc comment with an `@example`.
5. Add a sanitized fixture to `test/data/` (the Python SDK's, if it has one),
   a unit test in `test/<family>.test.ts`, the call in
   `test/contracts.test.ts`, and a check in `test/live/live.test.ts` if it is
   safe (no deploy, no destructive change to existing data).
6. Run `make test`, `make test-live`, and the hooks.
7. Update the docs page in `../smarter/docs/source/smarter-framework/smarter-nodejs/`
   and regenerate the api reference (`smarter-sphinx-docs`).
8. If the Python SDK lacks the endpoint, say so in your summary.

A **new resource kind** on the platform usually needs: `make sam-models`, a
resource class (extend `SmarterKindResource`, set `kind`, `path`, `model`), a
property on `Smarter`, and its tests and docs.

## Platform bugs

The SDK sees the platform from outside, so it finds the platform's bugs. When
an endpoint misbehaves, don't paper over it silently: work around it in the SDK
only when the workaround is harmless (e.g. `manifests.get()` filters by name
client-side, as the Python SDK does), say so in a comment, make the live test
skip with the platform's message rather than fail, and report the bug to the
user.

## Which skill to load

| Task                                                       | Skill                       |
| ---------------------------------------------------------- | --------------------------- |
| Unit tests, live tests, fixtures, coverage                 | `smarter-nodejs-testing`    |
| Probing the platform's api by hand                         | `smarter-api-testing`       |
| TSDoc comments                                             | `smarter-tsdoc`             |
| Types, `any`, `unknown`, Zod, the `core/typing.ts` aliases | `smarter-typescript-typing` |
| The SDK's pages in the platform's Sphinx docs              | `smarter-sphinx-docs`       |
| Lint, format, type-check, pre-commit                       | `smarter-code-quality`      |
| Writing a commit message                                   | `smarter-git-commits`       |
| Monthly sync with the platform, and dependency updates     | `monthly-maintenance`       |

The platform's own skills (`../smarter/skills/`) apply whenever you change the
platform itself, and the Python SDK's (`../smarter-python/skills/`) when you
change the Python SDK, e.g. to keep it in step with a fix made here.

## Definition of done

- The change follows an existing pattern in this repository, its ADRs, and
  the Python SDK's behavior.
- Unit tests cover it, `make test` passes, and coverage stays at 90% or more.
- `npm run typecheck` and the pre-commit hooks pass on the changed files.
- The live tests pass against the local platform, or their skips name platform bugs.
- Exported objects have TSDoc comments, and the docs in `../smarter/docs/source/`
  describe the feature.
- Your summary says what changed, what you verified, what you skipped, any
  platform bugs you found, and any difference from the Python SDK.
