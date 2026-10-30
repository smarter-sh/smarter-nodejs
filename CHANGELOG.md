# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).



## [1.0.0](https://github.com/smarter-sh/smarter-nodejs/compare/v0.2.2...v1.0.0) (2026-10-30)

### ⚠ BREAKING CHANGES

* **models:** annotations are a map of keys to string values. SmarterResource.annotations, ManifestMetadata.annotations and PromptChatApiPluginMeta.annotations are Record<string, string> or null instead of a list of one-key objects, and a resource's annotations are no longer an empty list by default. Read a value as annotations?.[key] instead of searching the list. A manifest with the legacy list still parses: it is converted to the map.

Synced with smarter 9f2c3cda24b6602de9674e8cc20607180f5e7d3f

Co-authored-by: Lawrence McDaniel <lpm0073@gmail.com>

### Features

* **models:** read SAM annotations as a map, sync with smarter v0.38.0 ([5effd5d](https://github.com/smarter-sh/smarter-nodejs/commit/5effd5d5214d0de3ee986dc68550311d6b88e679))

## [0.2.2](https://github.com/smarter-sh/smarter-nodejs/compare/v0.2.1...v0.2.2) (2026-10-22)

### Bug Fixes

* **contracts:** sync with smarter v0.36.6 ([bd04971](https://github.com/smarter-sh/smarter-nodejs/commit/bd0497164d70ce2b9964846e8019823c8cfe76df))
* **llmclients:** add verbose option to config() ([4bb054f](https://github.com/smarter-sh/smarter-nodejs/commit/4bb054f0190b7c98e35ba6dc5b6d6578a1701bb0))

## [0.2.1](https://github.com/smarter-sh/smarter-nodejs/compare/v0.2.0...v0.2.1) (2026-10-15)

### Bug Fixes

* **contracts:** sync with smarter v0.27.1, functions become extensions ([df65270](https://github.com/smarter-sh/smarter-nodejs/commit/df6527007a0ca6c5ead449f4440650748280e69b))

## [0.2.1-alpha.1](https://github.com/smarter-sh/smarter-nodejs/compare/v0.2.0...v0.2.1-alpha.1) (2026-10-15)

### Bug Fixes

* **contracts:** sync with smarter v0.27.1, functions become extensions ([df65270](https://github.com/smarter-sh/smarter-nodejs/commit/df6527007a0ca6c5ead449f4440650748280e69b))

## [0.2.0](https://github.com/smarter-sh/smarter-nodejs/compare/v0.1.0...v0.2.0) (2026-10-15)

### Features

* **llmclients:** add mcpclients, guardrails and tools to llmclient ([33a4214](https://github.com/smarter-sh/smarter-nodejs/commit/33a4214e2335a4fb8689d3662d208f088f579a02))

### Bug Fixes

* **contracts:** sync with smarter v0.25.1 and regenerate sam models ([d70c181](https://github.com/smarter-sh/smarter-nodejs/commit/d70c181a8d4d1c514d1f5dcbed705bd61c2d6710))
* **deps:** pin conventional-changelog-conventionalcommits to 9.3.1 ([41ad8a1](https://github.com/smarter-sh/smarter-nodejs/commit/41ad8a1e7e4d7386e89564cb7d7999ad6dc26f5f))

## [0.1.0](https://github.com/smarter-sh/smarter-nodejs/compare/v0.0.0...v0.1.0) (2026-10-14)

### Features

* add the smarter node.js sdk, modeled on smarter-python ([ee6c62d](https://github.com/smarter-sh/smarter-nodejs/commit/ee6c62d4c3a824a34e47607206494033a8025d99))
