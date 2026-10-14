#!/usr/bin/env bash
# Run the unit tests with the lowest versions that package.json's dependency ranges allow, on the
# lowest supported Node.js, in a throwaway copy of the repository. The development node_modules has
# the newest versions, so it can't show that the declared ranges hold.
#
# usage, from the smarter-nodejs repository root:
#   skills/monthly-maintenance/scripts/test-minimum-versions.sh [node binary, default: node]
# e.g. with nvm: skills/monthly-maintenance/scripts/test-minimum-versions.sh "$(nvm which 22)"
set -euo pipefail

NODE="${1:-node}"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# each "^X.Y.Z" or ">=X.Y.Z" runtime dependency becomes "name@X.Y.Z"
pins=$("$NODE" -e '
const deps = require("./package.json").dependencies || {};
console.log(Object.entries(deps).map(([n, r]) => `${n}@${r.replace(/^[\^~>=]+/, "").split(" ")[0]}`).join(" "));
')
echo "Node.js: $("$NODE" --version)"
echo "minimum versions: $pins"

rsync -a --files-from=<(git ls-files) . "$WORK"
cd "$WORK"
PATH="$(dirname "$("$NODE" -p process.execPath)"):$PATH"
npm ci --silent
# shellcheck disable=SC2086 # one argument per pin
npm install --no-save --silent $pins
npx vitest run
