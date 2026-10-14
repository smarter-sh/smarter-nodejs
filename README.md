# The Smarter Node.js SDK

![Test Status](https://github.com/smarter-sh/smarter-nodejs/actions/workflows/test.yml/badge.svg?branch=main)
![Build Status](https://github.com/smarter-sh/smarter-nodejs/actions/workflows/build.yml/badge.svg?branch=main)
[![Node.js coverage](https://img.shields.io/codecov/c/github/smarter-sh/smarter-nodejs/main?flag=nodejs&label=coverage&logo=codecov)](https://codecov.io/gh/smarter-sh/smarter-nodejs)
[![Latest Release](https://img.shields.io/github/v/release/smarter-sh/smarter-nodejs?label=release)](https://github.com/smarter-sh/smarter-nodejs/releases)
[![npm](https://img.shields.io/npm/v/@smarter.sh/api?logo=npm&label=npm)](https://www.npmjs.com/package/@smarter.sh/api)
[![Docs](https://img.shields.io/badge/Read%20the%20Docs-smarter.sh-blue?logo=readthedocs)](https://docs.smarter.sh/en/latest/smarter-framework/smarter-nodejs.html)
[![Website](https://img.shields.io/badge/official%20web%20site-smarter.sh-blue?logo=google-chrome)](https://smarter.sh)
[![License: GNU AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)<br>

`@smarter.sh/api` is the official Node.js SDK of the
[Smarter platform](https://github.com/smarter-sh/smarter), written in
TypeScript. It is to Smarter what the `openai` package is to the OpenAI api:
one `npm install` gives your JavaScript or TypeScript software typed, complete
access to your own Smarter installation, whether it runs on your laptop or on
Kubernetes.

Use it to build custom software that is tightly integrated with your Smarter
resources and functionality, without customizing or forking the Smarter
backend: a web back end that chats with your LLMClients, a CI job that applies
your manifests, a serverless function that loads documents into a vectorstore,
or a service that calls your MCP servers' tools.

```ts
import { Smarter } from "@smarter.sh/api";

const client = new Smarter(); // SMARTER_API_KEY, or the smarter cli's ~/.smarter/config.yaml

const llmclient = await client.llmClients.find("customer_support");
const response = await client.llmClients.prompt(llmclient.id, "Where is my order #1234?");
console.log(response.text);
```

It has the same features as the [Smarter Python SDK](https://github.com/smarter-sh/smarter-python),
which is the reference implementation of every Smarter SDK, with the same
resources, verbs and errors, in idiomatic TypeScript.

## Smarter Node.js SDK or Smarter CLI?

Both manage the same resources through the same api. The difference is how
you use them:

| [smarter-nodejs](https://github.com/smarter-sh/smarter-nodejs) (this package) | [smarter-cli](https://github.com/smarter-sh/smarter-cli) |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| A library that you **import** into your own software.                         | A program that you **install** on your computer.         |
| `await client.manifests.apply("guardrail.yaml")`                              | `smarter apply -f guardrail.yaml`                        |
| Returns typed, validated objects, and throws typed errors.                    | Prints JSON or YAML in a terminal window.                |
| For applications, services, serverless functions, tests and automation.       | For people at a keyboard, and shell scripts.             |

The SDK reads the cli's configuration file, so if you have run
`smarter configure`, the SDK needs no other setup.

## At a Glance

- **Every resource kind**, through the same manifest api as the cli:
  `apply`, `validate`, `get`, `describe`, `delete`, `deploy`, `undeploy` and
  `logs`, for LLMClients, Plugins, Guardrails, MCPClients, Vectorstores,
  LLMHosts, Secrets, Custom Domains, Accounts, Users, and every other kind.
- **Prompts and conversations**: prompt an LLMClient, hold a multi-turn chat
  that keeps its session, and stream a prompt's progress (its LLM requests,
  tool calls and MCP calls) as it runs, with `for await`.
- **Resource actions**: evaluate a Guardrail, call an MCP server's tools, add
  documents to and search a vectorstore, plan and deploy an LLMHost, discover
  open-weight models, and call an LLM provider through a Proxy.
- **The platform's own models**: a TypeScript type of every
  [SAM manifest](https://docs.smarter.sh/en/latest/smarter-framework/smarter-manifests.html)
  kind (e.g. `SAMLLMClient`), generated from the platform's JSON Schemas, and
  Zod schemas of the Smarter Chat api contract (e.g. `PromptChatApiConfig`),
  the Smarter Journal contract and every REST response, kept in step with the
  platform by tests.
- **Production behavior**: retries with backoff, timeouts and cancellation
  (`AbortSignal`), typed errors, logging that never prints your api key, ES
  modules that CommonJS can `require()`, and no HTTP dependency.

## Quickstart

```console
npm install @smarter.sh/api
```

Point the SDK at your platform with environment variables, or pass them as
options to `new Smarter({...})`:

```console
export SMARTER_API_KEY="your 64-character Smarter api key"
export SMARTER_BASE_URL="https://platform.example.com"   # or http://localhost:9357
```

### Manifests

```ts
import { Smarter } from "@smarter.sh/api";

const client = new Smarter();

await client.manifests.apply("pii-redactor.yaml"); // create or update
const manifest = await client.guardrails.describe("pii_redactor"); // read it back
const guardrail = manifest.toSam("Guardrail"); // as a typed SAMGuardrail
console.log(guardrail.spec.config.action);
await client.guardrails.delete("pii_redactor");
```

### Chat

```ts
const chat = await client.llmClients.chat(llmclient.id);
console.log((await chat.send("What is 2 to the 10th power?")).text);
console.log((await chat.send("And divided by 4?")).text);

const stream = chat.stream("Now take its square root.");
for await (const event of stream) {
  console.log("...", event.message); // e.g. "Calling tool calculator"
}
console.log(stream.response.text);
```

### Errors

```ts
import { NotFoundError, SmarterError } from "@smarter.sh/api";

try {
  await client.manifests.describe("LLMClient", "no_such_client");
} catch (err) {
  if (err instanceof NotFoundError) console.log(err.statusCode, err.message, err.errorClass);
  else if (err instanceof SmarterError) console.log("something else went wrong:", err);
  else throw err;
}
```

## Documentation

Read the Docs: [The Smarter Node.js SDK](https://docs.smarter.sh/en/latest/smarter-framework/smarter-nodejs.html)
on [docs.smarter.sh](https://docs.smarter.sh/). The design decisions are
recorded in [doc/adr/](./doc/adr/).

## Requirements

Node.js 22 or later, and a Smarter platform to connect to. See the
[Quick Start Guide](https://docs.smarter.sh/en/latest/smarter-platform/installation/quick-start.html)
to run one on your laptop.

## Development

```console
make init        # the dependencies, and the pre-commit hooks
make test        # the unit tests, which never reach a platform
make coverage    # the unit tests, with a coverage report
SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=... make test-live
```

If your shell sets `NODE_ENV=production`, npm skips the development
dependencies: `make init` installs them anyway.

`make init` also creates a Python virtual environment in `venv/` with
[pre-commit](https://pre-commit.com/) (Python 3.13), and installs the
pre-commit and commit-msg hooks, which lint each commit and check its message.
`make python-init` does only that part.

### Versions and releases

Commit messages are [conventional commits](https://www.conventionalcommits.org/), and
[semantic-release](https://semantic-release.gitbook.io/) versions the package from them, as it does
[Smarter Chat](https://github.com/smarter-sh/smarter-chat). On each push to `main`, and to `alpha` and
`beta` (prereleases, e.g. `1.0.0-alpha.1`), `.github/workflows/pushMain.yml` determines the next
version, writes it to `package.json` and `src/version.ts`, adds the release notes to `CHANGELOG.md`,
tags the commit and creates a GitHub release. A release on `main` is then merged back into `alpha`.
`feat` commits are minor releases, `fix` and `perf` commits are patches, and a `BREAKING CHANGE:`
footer is a major release. See `release.config.js`.

semantic-release does not publish to npm. After a release on `main`, pull it and publish it with
`make release`, which runs the tests, builds `dist/` and publishes
[@smarter.sh/api](https://www.npmjs.com/package/@smarter.sh/api) with an npm token that may publish to
the `@smarter.sh` scope (in `.npmrc`, which is gitignored, or `~/.npmrc`).

The agent skills in [skills/](./skills/) describe how this repository is
developed, tested and documented, for people and for AI coding agents.

## Support

Please report bugs to the [GitHub Issues Page](https://github.com/smarter-sh/smarter-nodejs/issues)
for this project.

## Contributing

Please see [CONTRIBUTING](./.github/CONTRIBUTING.md).
