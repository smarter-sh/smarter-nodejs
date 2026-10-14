---
name: monthly-maintenance
description: Use when asked to do smarter-nodejs's monthly maintenance, or either half of it - (1) bring the SDK back in sync with the Smarter platform and with the Python SDK (the reference implementation) by reviewing their commits since smarter-nodejs's last release and changing the SDK, its models, tests and docs as needed, and (2) update the SDK's npm dependencies, retest, and, if the tests pass, write a "fix" git commit. Covers finding the baseline, reading the delta by area, the mechanical refreshes (SAM types, contracts, api reference), the dependency update and its tests, and the commit messages.
---

# smarter-nodejs Monthly Maintenance

The SDK covers a platform that changes every week, and follows a Python SDK
that changes with it. Once a month, this maintenance brings it back in step,
and keeps its dependencies current. It has two parts, done in this order, each
with its own commit:

1. **Sync with the platform and the Python SDK** (Part 1).
2. **Update the dependencies and retest** (Part 2), so that the retest covers
   the sync too.

Load `smarter-nodejs-development` first. Its rules apply throughout, in
particular: **never run git write commands** (write the commit command as text,
see `smarter-git-commits`), **never deploy from a test or probe**, and run the
tests yourself.

Work from the smarter-nodejs repository root, with the platform checked out at
`../smarter` and its local dev server running (`../smarter`: `make run`; the
platform's `smarter-docker-environment` skill), and the Python SDK at
`../smarter-python`.

## Part 1: Sync with the platform and the Python SDK

### 1. Find the delta

```console
skills/monthly-maintenance/scripts/smarter-delta.sh
```

It fetches the platform (`git fetch` only updates its remote-tracking
branches), and lists the platform's commits on `origin/main`, its released
branch, since a baseline, grouped by what they mean for the SDK, with a diff
stat per area. Its last section lists the Python SDK's commits since the same
date. The baseline is the later of:

- the platform's commit at the date of smarter-nodejs's **last release tag**,
  and
- the commit named by the newest `Synced with smarter <sha>` line in
  smarter-nodejs's commit history, which every maintenance sync records (see
  step 5).

Pass an explicit base as the third argument to override it:
`smarter-delta.sh ../smarter origin/main <sha>`.

If the platform's release that users run is not `origin/main`, ask the user
which ref to sync with.

### 2. Review each area

For each area with changes, read the diffs, not only the subjects:

```console
git -C ../smarter diff <base>..origin/main -- <path>
git -C ../smarter show <sha>
git -C ../smarter-python show <sha>
```

| Area in the report                  | What to check, and what to change in the SDK                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest (cli) api                  | New or changed verbs, parameters, responses: `src/resources/manifests.ts`, `src/client.ts` (`whoami`, `version`, `kinds`)                    |
| REST urls and views                 | New endpoints to cover, changed paths, parameters, bodies or permissions: `src/resources/<family>.ts`                                        |
| Serializers                         | Changed REST response fields: `src/models/<family>.ts`, and the fixtures in `test/data/`                                                     |
| SAM manifest models and kinds       | A new, renamed or removed kind, or a changed spec: `make sam-models SMARTER_REF=origin/main`, then a resource class for a new kind           |
| Chat and journal contracts, OpenAPI | `make contracts SMARTER_REF=origin/main`, then fix `src/models/chat.ts`, `journal.ts` or the resources until `test/contracts.test.ts` passes |
| Django-React contract               | Copy the change into `src/models/react.ts`                                                                                                   |
| Authentication                      | Headers, schemes, token formats: `src/core/http.ts`                                                                                          |
| Platform settings that gate apis    | e.g. a new `SMARTER_ENABLE_*` switch: the docs, and the live tests' skips                                                                    |
| ADRs                                | A new or changed platform ADR that the SDK follows or adapts: `doc/adr/`                                                                     |
| Skills                              | A change to a platform skill that a skill here adapts: the adapted copy in `skills/`                                                         |
| Lint standard                       | The platform's Prettier, ESLint or hook changes: `.pre-commit-config.yaml`, `eslint.config.js`, `.prettierrc.json`                           |
| The SDK's own docs pages            | Someone edited them in the platform: keep the edit, and make sure the generated reference still matches                                      |
| The Python SDK                      | Every feature, fix, model change, ADR or skill change there: port it here, or say why not                                                    |

Follow the pattern in `smarter-nodejs-development` ("Covering a platform
endpoint") for every change: probe the real endpoint (`smarter-api-testing`),
model it, add a sanitized fixture and a unit test, and a live test when it is
safe.

Notes:

- **Everything comes from the platform's committed contract**, in
  `../smarter/smarter/smarter/apps/api/v1/contract/` (the SAM schemas and
  examples, and `openapi.json`), plus the chat and journal contracts. Pass the
  ref you sync with, e.g. `SMARTER_REF=origin/main`, so that the files are read
  with `git show` at that ref, not from `../smarter`'s working tree.
- **`test/contracts.test.ts` fails when the platform adds an operation** that
  the SDK doesn't call. Cover it, or add it to `NOT_CALLED` with a reason, the
  same reason as the Python SDK's.
- **Removals and renames are breaking changes** for the SDK's users. Keep the
  old name as a `@deprecated` alias for a release when that is cheap, and say
  so in the commit body.
- **Not every platform change concerns the SDK.** Internal refactors, Django
  views of the web console, React apps, migrations, Celery tasks and
  infrastructure are out of scope unless they change the api.

### 3. Refresh what is generated

```console
make sam-models SMARTER_REF=origin/main    # copies every contract, then regenerates src/models/sam/
npm run reference
skills/smarter-sphinx-docs/scripts/check-sdk-pages.sh
```

Regenerate the api reference whenever a doc comment changed, and update the
SDK's guide pages in `../smarter/docs/source/smarter-framework/smarter-nodejs/`
for any user-visible change (`smarter-sphinx-docs`).

### 4. Test

```console
make test
npm run typecheck
SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=<throwaway key> make test-live
git diff --name-only | xargs pre-commit run --files
git ls-files --others --exclude-standard | xargs pre-commit run --files
```

Read the live tests' skip reasons. A new skip is either a platform bug to report
or an SDK gap to fix.

### 5. Commit

Write the commit command (never run it), following `smarter-git-commits`. Its
type follows the change: `feat` when the SDK covers something new, `fix` when it
corrects drift. The body lists the platform and Python SDK commits that each
change follows, and ends with this line, which the next run's baseline reads:

```text
Synced with smarter <full sha of the platform ref you synced with>
```

Get the sha with `git -C ../smarter rev-parse origin/main`. Changes in
`../smarter` (the SDK's docs) get their own commit command, for that repository.

If nothing in the delta concerns the SDK, there is no commit. Report that, with
the range you reviewed.

## Part 2: Update the dependencies and retest

### The files

| Field of `package.json` | What it holds                                       | How it is updated                                                             |
| ----------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `dependencies`          | The runtime dependencies, as **caret ranges**       | Raise the range to a new major version, once the tests pass with it (ADR-011) |
| `devDependencies`       | The development tools, **pinned** to exact versions | Pin each to its latest version                                                |
| `engines.node`          | The lowest supported Node.js (ADR-019)              | Raise when a Node.js line reaches end-of-life, as a breaking change           |
| `package-lock.json`     | The resolved tree                                   | Regenerated by `npm install`                                                  |

The SDK is a library, so its runtime dependencies are never pinned: an
application must be free to resolve its own versions.

### 1. See what is outdated

```console
npm outdated
```

### 2. Update

- **devDependencies:** set every pin to its latest version
  (`npm install --save-exact --save-dev <name>@latest`, one per package, or
  edit `package.json` and run `npm install`). Keep the Prettier and ESLint
  versions at least those of `.pre-commit-config.yaml`, so that the editor and
  the hooks agree. The hooks' own versions are bumped weekly by the
  `precommitVersionBumps` workflow.
- **dependencies:** for each runtime dependency whose newest version is outside
  its range (a new major version), raise the range. Raise a lower bound only
  when the SDK starts to need a newer feature, and say which.
- Run `npm install`, and `npm audit` (report any finding; don't run
  `npm audit fix --force`).

### 3. Retest

```console
make test                                                        # the newest versions
skills/monthly-maintenance/scripts/test-minimum-versions.sh "$(nvm which 22)"   # the lowest versions the ranges allow, on Node 22
npm run typecheck && npm run lint
SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=<throwaway key> make test-live
npm run build && npm pack --dry-run && npx publint                # the package
```

`test-minimum-versions.sh` matters as much as `make test`: the development
`node_modules` has the newest versions, so it can't show that the declared
ranges hold. The package check matters too: it shows what users install.

If a test fails:

- fix the SDK when the fix is small and clearly right (e.g. a deprecation),
- otherwise keep the previous version of that package (the previous pin, or the
  previous range), retest, and report the failure, with its output.

### 4. Commit

Only when every test passes, write the commit command (never run it), following
`smarter-git-commits`:

```console
git commit --author="Claude <noreply@anthropic.com>" \
  -m "fix(deps): update the npm dependencies" \
  -m "Monthly maintenance: every development tool in devDependencies is pinned to its latest version, and the runtime dependencies' ranges admit their latest versions." \
  -m "devDependencies:" \
  -m "- vitest 5.0.4 -> 5.1.0
- ..." \
  -m "dependencies:" \
  -m "- no change: every runtime dependency's newest version is within its range" \
  -m "Tests: make test (n passed), test-minimum-versions.sh on Node 22 (n passed), make test-live (n passed, n skipped for platform bugs), typecheck, lint, and the package built and checked by publint." \
  -m "Co-authored-by: Lawrence McDaniel <lpm0073@gmail.com>"
```

`fix` makes semantic-release publish a patch release, which ships the
dependency updates. List every version change, and the real test counts. If
nothing was outdated, there is no commit: report that.

## Report

End with a summary for the user:

- the platform and Python SDK ranges that were reviewed, and what changed in
  the SDK because of them,
- the changes that were deliberately not followed, and why,
- platform bugs found (new live test skips), and differences from the Python SDK,
- the dependency updates, and any that were held back, with the failing output,
- the test results of every suite,
- the commit commands, one per repository and part.
