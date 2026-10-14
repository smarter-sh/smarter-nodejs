---
name: smarter-nodejs-testing
description: Use when writing, fixing or running the smarter-nodejs SDK's tests, or raising its coverage. Covers the Vitest unit tests (mockPlatform, routes answered by a fetch double, sanitized fixtures in test/data shared with the Python SDK), the opt-in live tests against a running Smarter platform, the contract and SAM tests, coverage, and what never to do in a test.
---

# Smarter Node.js SDK Testing

## Two kinds of tests

| Kind | Where                    | Reaches a platform? | Runs in CI | Command                                     |
| ---- | ------------------------ | ------------------- | ---------- | ------------------------------------------- |
| Unit | `test/<module>.test.ts`  | Never               | Yes        | `make test` (`npm test`)                    |
| Live | `test/live/live.test.ts` | Yes                 | No         | `make test-live` (`SMARTER_TEST_LIVE=true`) |

Run them on the host, from the repository root. Vitest runs the TypeScript
source directly, with no build step:

```console
npm test                                  # every unit test
npx vitest run test/guardrails.test.ts    # one file
npx vitest run -t "evaluate"              # tests whose name matches
make coverage                             # with V8 coverage, fails below 90%
```

Run the tests yourself, after every change, and report the counts.

## Unit tests

- One test file per source module: `src/resources/guardrails.ts` is tested by
  `test/guardrails.test.ts`.
- Build the client with `mockPlatform()` from `test/helpers.ts`, the
  counterpart of the Python SDK's `SmarterTestBase`. Its `client` is a
  `Smarter` whose `fetch` is a double: nothing leaves the process.
  `test/setup.ts` hides the developer's `SMARTER_*` variables and
  `~/.smarter/config.yaml` from every test, so that a local configuration
  can't change a result.
- Register answers with
  `platform.route(method, path, { fixture, json, status, text, headers, handler })`.
  `path` is relative to `/api/v1/`. An unrouted request gets a 404.
- Assert what was sent with `platform.lastRequest` (a `Request`),
  `await platform.requestJson()` and `new URL(platform.lastRequest.url).searchParams`.
- `platform.makeClient({ maxRetries: 2 })` builds another client on the same
  routes. A test that retries answers with a `retry-after: 0` header, so that
  it doesn't wait.
- Test behavior through the public api (the client's methods), not private
  helpers, and assert on errors with `await expect(promise).rejects.toBeInstanceOf(NotFoundError)`.

## Fixtures

- Fixtures are **real platform responses**, trimmed and sanitized, in
  `test/data/<name>.json` (and `prompt_sse.txt` for a stream). They are the
  same files as the Python SDK's `tests/data/`: copy a new one from there, or
  add it to both. Don't invent a response shape: probe the endpoint first
  (`smarter-api-testing`).
- **Sanitize before saving.** Replace names, emails, addresses, phone numbers,
  account numbers, api keys (even masked ones), tool call ids and private
  hostnames with placeholders (`Example Company`, `user@example.com`,
  `1234-5678-9012`). Then grep `test/data/` for what you replaced. The
  repository is public.
- `test/data/contracts/` and `test/data/sam/` are copies of what the platform
  publishes. Refresh them with `make contracts`, never by hand.

## Contract and SAM tests

- `test/contracts.test.ts` fails when the platform's chat or journal contract
  has a field that the SDK's mirror doesn't declare, when a platform example
  doesn't parse, when the SDK sends a request that isn't an operation of
  `openapi.json`, or when `openapi.json` has an operation that the SDK doesn't
  call and that isn't in `NOT_CALLED` (with its reason). It also validates the
  recorded fixtures against `openapi.json`.
- `test/sam.test.ts` fails when a kind's example manifest doesn't validate
  against its generated schema, or a kind has no type. Regenerate
  (`make sam-models`), don't edit the generated code.

## Live tests

```console
SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=<throwaway key> make test-live
```

- They validate every schema against the platform's real responses, including
  `describe` of a real resource of every kind validated as its SAM type.
- They prompt an LLMClient (`SMARTER_TEST_LLMCLIENT`, default `calculator`),
  which makes **billable LLM requests**. That is accepted in this project.
- They apply and delete a throwaway Guardrail named `sdk_live_test_<hash>`,
  in a `finally` or `onTestFinished`. Anything a live test creates, it deletes.
- **They never deploy, undeploy, snapshot, restore, or delete existing
  data.** Deploy creates real, billable infrastructure.
- A platform error (an `APIStatusError`) doesn't fail a check: it is recorded
  with the platform's message, and the test skips (`context.skip(message)`) or
  prints the messages (`console.warn`) when it checks many kinds in one test. An
  SDK error (e.g. `APIResponseValidationError`) fails it. Read the skip reasons
  and warnings: they are platform bugs to report.
- `test/setup.ts` hides the `SMARTER_*` variables from every test, so the live
  tests restore them from `SMARTER_LIVE_ENV`, which it saves. Their timeout is
  three minutes: a prompt that calls tools takes several seconds.

Create and delete the throwaway api key as `smarter-api-testing` describes.

## Coverage

At least 90% of statements, branches, functions and lines (CI enforces it in
`vitest.config.ts`), and 95% where that takes moderate effort. The generated
`src/models/sam/` types have no run-time code to cover.

## Reporting

Report passed, failed and skipped counts honestly, for both suites. Name the
live tests' skips, and separate platform bugs from SDK failures.
