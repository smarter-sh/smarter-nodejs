---
name: smarter-code-quality
description: Use before finishing any change to the smarter-nodejs SDK, to type-check, lint and format it with the repository's pre-commit hooks (Prettier, ESLint with typescript-eslint, tsc, codespell, the generic hooks, commitlint). Explains which tools are authoritative, how to run them on changed files under zsh, and the traps (generated SAM types, test fixtures).
---

# Smarter Node.js SDK Code Quality

`.pre-commit-config.yaml` at the repository root is the authoritative
standard. It matches the platform's (`../smarter/.pre-commit-config.yaml`)
where they overlap: the platform's React workspace's Prettier and ESLint, and
its generic hooks. If a hook passes, the code meets the standard. If it fails,
fix the code. Never bypass a hook (`--no-verify`, `SKIP=`, blanket
`eslint-disable`).

## What the hooks enforce

| Hook      | Configuration                         | Notes                                                                                  |
| --------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| prettier  | `.prettierrc.json`, `.prettierignore` | Formatter of TypeScript, Markdown, YAML and JSON. Let it reformat. Skips `test/data/`. |
| eslint    | `eslint.config.js`                    | `typescript-eslint` strict and type-checked rules, `no-explicit-any`, `tsdoc/syntax`.  |
| tsc       | `tsconfig.json`                       | `npm run typecheck`: `strict`, no emit. Type errors fail.                              |
| codespell | `codespell.txt` ignore list           | Skips `test/data/`. Add real project words to `codespell.txt`.                         |

Also: trailing whitespace, end-of-file newline, YAML/JSON syntax, merge
conflict markers, private keys, AWS credentials, and commitlint on commit
messages.

## How to run

pre-commit lives in a Python virtual environment, `venv/`, which `make init`
(or `make python-init`) creates from `requirements/local.txt`, and which also
installs the pre-commit and commit-msg hooks. If `venv/` is missing, or
`.git/hooks/pre-commit` points at a Python that no longer exists, run
`make python-init`. From the repository root:

```console
npm run typecheck
npm run lint
source venv/bin/activate
git diff --name-only | xargs pre-commit run --files
git ls-files --others --exclude-standard | xargs pre-commit run --files   # new files
```

- Use `xargs`. Under zsh, `pre-commit run --files $FILES` passes one argument,
  and pre-commit checks nothing.
- Hooks that modify files fail the first run, then pass. Run them until they
  pass, and read the diff of what they changed.
- `src/models/sam/` is generated, and Prettier formats it like any other code,
  which is fine. Don't hand-edit it to satisfy a hook: change
  `scripts/generate-sam-models.ts` instead. ESLint ignores it, and its hook runs
  with `--no-warn-ignored`, because an ignored file is otherwise a warning, and
  the hook allows no warnings.
- `tsconfig.json` has `noPropertyAccessFromIndexSignature`: a field that a
  schema doesn't declare is read with brackets (`item["name"]`), and a declared
  one with a dot. ESLint's `dot-notation` follows it.
- `prefer-nullish-coalescing` ignores strings: `a || b` is meant where an
  empty string from the platform must fall back too.
- If `npx eslint` or `npx vitest` is missing, the shell's `NODE_ENV=production`
  made npm skip the devDependencies: `npm install --include=dev`.
- `make lint` runs every hook on every file.

## Principles

- Match the surrounding code: its naming, comment density, logging (through
  the client's logger, never the api key), and the errors of
  `src/core/errors.ts`.
- Fix the cause of a finding. Suppress one only with a narrow, commented
  directive that explains why, on the line it concerns
  (`// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- the schema validates it next`).
- Don't reformat code you didn't otherwise change.
