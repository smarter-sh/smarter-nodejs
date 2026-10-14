# CLAUDE.md

Guidance for Claude Code (and other coding agents) working in this repository.

smarter-nodejs is the Smarter platform's official Node.js SDK, written in
TypeScript and published to npm as `@smarter.sh/api`. It is to the Smarter platform
([smarter-sh/smarter](https://github.com/smarter-sh/smarter), usually checked
out beside this repository as `../smarter`) what the `openai` package is to the
OpenAI api: the library that JavaScript and TypeScript programmers import to
build software on their own Smarter installation, without customizing or
forking the platform. The [Python SDK](https://github.com/smarter-sh/smarter-python)
(`../smarter-python`) is the reference implementation of every Smarter SDK:
this SDK has its features, resources, verbs and errors, in idiomatic
TypeScript.

Detailed know-how lives in the Agent Skills under `skills/` (symlinked to
`.claude/skills`). **Load `smarter-nodejs-development` first for any change.**
This file holds only what applies to nearly every task.

## Hard rules

1. **Never run git write commands**, here, in `../smarter` or in
   `../smarter-python`. "Write a git commit" means print the command as text.
   See `smarter-git-commits`.
2. **Run the tests yourself** after any change (`make test`), and the live
   tests against the local platform when you change a model or an endpoint.
   Never ask the user to re-run them. Report failures honestly.
3. **Never deploy from a test or a probe.** Deploy creates real, billable
   infrastructure. The local platform's containers hold live credentials.
4. **The pre-commit hooks and `tsc` are the lint standard.** See `smarter-code-quality`.
5. **Coverage:** at least 90%, 95% where it takes moderate effort.
6. **This repository is public.** No api keys, tokens, account numbers,
   private hostnames, names or customer data in code, fixtures, docs or skills.
7. **Check the Python SDK first.** Before you add or change a feature, read how
   `../smarter-python` does it, and keep the two in step.
8. **Live prompt calls are fine.** Live tests and probes send billable LLM
   prompts; that is accepted.

## Repository map

| Path             | Contents                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `src/client.ts`  | `Smarter`, the client                                                                          |
| `src/core/`      | Configuration, http transport, errors, logging, SSE, type aliases                              |
| `src/resources/` | One module per resource family                                                                 |
| `src/models/`    | Zod schemas and types; `sam/` is generated, `chat.ts`/`journal.ts`/`react.ts` mirror contracts |
| `scripts/`       | Contract sync, SAM type generation, api reference generation                                   |
| `test/`          | Unit tests, fixtures in `test/data/`, live tests in `test/live/`                               |
| `doc/adr/`       | The SDK's architecture decision records                                                        |
| `skills/`        | Agent Skills                                                                                   |

The SDK's user documentation lives in the platform's repository:
`../smarter/docs/source/smarter-framework/smarter-nodejs*`.

## Common commands

```bash
make test                                   # unit tests (npm test)
make coverage                               # unit tests with coverage
npm run typecheck && npm run lint
SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=... make test-live
make contracts                              # copy the platform's contracts, SAM schemas and openapi.json from ../smarter
make sam-models                             # make contracts, then regenerate src/models/sam
npm run reference                           # api reference into ../smarter
npm run build                               # dist/
git diff --name-only | xargs pre-commit run --files
```

Monthly, sync the SDK with the platform and the Python SDK, and update its
dependencies: load the `monthly-maintenance` skill.

## Definition of done

- The change follows an existing pattern, the ADRs in `doc/adr/`, and the Python SDK's behavior.
- Tests cover it, you ran them, and the live tests pass or skip only for named platform bugs.
- `tsc` and the pre-commit hooks pass on the changed files.
- Exported objects have TSDoc comments; user-facing features are documented in `../smarter/docs/source/`.
- Your summary says what changed, what you verified, what you skipped, any
  platform bugs found, and any difference from the Python SDK.
