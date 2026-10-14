#!/usr/bin/env bash
# Type-check every TypeScript example of the SDK's pages in the platform's docs against the SDK's
# source, so that the docs can't describe an api that doesn't exist. Each code block becomes the
# body of an async function. The variables that the pages use without declaring them (client,
# llmclient, guardrail, mcpclient, store, chat, text) are declared. Blocks that import a package that the
# SDK doesn't depend on (openai, pino, undici) are skipped, and listed.
#
# usage, from the smarter-nodejs repository root:
#   skills/smarter-sphinx-docs/scripts/check-examples.sh [path of a smarter checkout, default ../smarter]
set -euo pipefail

SMARTER="${1:-../smarter}"
WORK=$(mktemp -d .doccheck-XXXXXX)
trap 'rm -rf "$WORK"' EXIT

python3 - "$SMARTER/docs/source/smarter-framework" "$WORK" <<'PY'
import glob, os, re, sys
docs, work = sys.argv[1], sys.argv[2]
files = [os.path.join(docs, "smarter-nodejs.rst")] + sorted(glob.glob(os.path.join(docs, "smarter-nodejs", "*.rst")))
imports, bodies, names = set(), [], set()
for path in files:
    for match in re.finditer(r"\.\. code-block:: typescript\n\n((?:   .*\n|\n)+)", open(path).read()):
        code = "\n".join(line[3:] for line in match.group(1).split("\n"))
        if re.search(r'from "(openai|pino|undici)"', code):
            print(f"skipped: an example of {os.path.basename(path)} imports another package")
            continue
        for line in code.split("\n"):
            if line.startswith("import "):
                if '"smarter-api"' in line:
                    type_only = line.startswith("import type ")
                    for name in re.search(r"\{(.*)\}", line).group(1).split(","):
                        name = name.strip()
                        names.add("type " + name if type_only and not name.startswith("type ") else name)
                else:
                    imports.add(line)
        body = "\n".join("  " + line for line in code.split("\n") if not line.startswith("import "))
        bodies.append(f"// {os.path.basename(path)}\nexport async function example{len(bodies)}(): Promise<void> {{\n{body}\n}}\n")
names.discard("Smarter")
names.discard("type Smarter")
values = sorted(n for n in names if not n.startswith("type "))
types = sorted(n for n in names if n.startswith("type "))
header = [
    'import type * as S from "../src/index.ts";',
    "import { Smarter" + "".join(", " + n for n in values + types) + ' } from "../src/index.ts";',
    *sorted(imports),
    "declare const client: S.Smarter;",
    "declare const llmclient: S.LLMClient;",
    "declare const guardrail: S.Guardrail;",
    "declare const mcpclient: S.MCPClient;",
    "declare const store: S.Vectorstore;",
    "declare const chat: S.ChatSession;",
    "declare const text: string;",
    "void Smarter;",
]
open(os.path.join(work, "check.ts"), "w").write("\n".join(header) + "\n\n" + "\n".join(bodies))
print(f"{len(bodies)} examples")
PY
printf '{ "extends": "../tsconfig.json", "compilerOptions": { "noEmit": true }, "include": ["check.ts"] }\n' > "$WORK/tsconfig.json"
npx tsc -p "$WORK/tsconfig.json"
echo "ok"
