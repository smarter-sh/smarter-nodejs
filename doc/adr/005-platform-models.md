# ADR-005: Mirrored Contracts and Generated SAM Types

## Status

Accepted

Follows the Python SDK's [ADR-005](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/005-platform-models.md).

## Context

The platform's Pydantic models are the source of truth of its api: the SAM models of every manifest kind, and the published contracts (the Smarter Chat api, the Smarter Journal, the cli api's OpenAPI document). The platform commits them as JSON in `smarter/smarter/apps/api/v1/contract/` and beside each contract's models. The SDK can't import them, and must not drift from them.

## Decision

- The contract files are copied from a platform checkout, at a git ref, by `scripts/sync-contracts.sh` (`make contracts`), into `test/data/contracts/` and `test/data/sam/`, exactly as the Python SDK copies them.
- **SAM types** are generated from each kind's JSON Schema by `scripts/generate-sam-models.ts` (`make sam-models`) with `json-schema-to-typescript`, into `src/models/sam/`. Each kind gets an interface, e.g. `SAMGuardrail`. The generator first makes each schema tolerant (it drops `additionalProperties: false`), so that every interface keeps an index signature for fields a newer platform adds (ADR-004). It also writes the tolerant schemas, which `Manifest.toSam()` validates with Ajv (draft 2020-12) before it returns the typed manifest. String formats (`email`, `date-time`, ...) are not validated: the platform's `validate` checks them. Generated code is never edited by hand.
- **Contracts** are mirrored by hand as Zod schemas in `src/models/chat.ts` and `journal.ts`, with the platform's model names (`PromptChatApiMessage`, ...). A test fails when the platform declares a field that a mirror doesn't, or when a platform example doesn't parse.
- The SDK reads **only version 2** of the chat contract, and asks for it in every request (`X-Smarter-Capabilities: chat-contract-v2`).
- A test checks that every request that the SDK sends is an operation of the platform's `openapi.json`, and that the SDK calls every operation, apart from a named list.

## Alternatives Considered

- Hand-write the SAM types. 25 kinds, which drift as soon as they are written.
- Generate Zod schemas from the SAM JSON Schemas. The available converters handle Pydantic's `anyOf`-with-`null` and `$defs` unevenly, and Ajv validates JSON Schema exactly, by definition.
- Generate the contracts too. Hand-mirroring keeps their doc comments, helpers (`text`) and forward-compatible types (ADR-004).

## Consequences

- **Positive:**
  - Callers get the platform's own models, in TypeScript.
  - Drift is caught by tests, not by users.
- **Negative:**
  - Refreshing is a manual step (`make contracts`, `make sam-models`) that someone must run when the platform changes, monthly at least (the `monthly-maintenance` skill).
  - Ajv is a run-time dependency (ADR-011).
  - Generated types check structure, not the platform's business rules: `manifests.validate()` does.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-004: Zod Models, Forward Compatible](004-zod-models.md)
- [ADR-009: Testing](009-testing.md)
- [ADR-022: A Pinned Copy of the Platform's OpenAPI Document](022-pinned-openapi.md)
