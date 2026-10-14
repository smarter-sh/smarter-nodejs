# ADR-021: Names: camelCase Methods, the Wire's Field Names

## Status

Accepted

## Context

The platform's [APIs and SDKs](https://docs.smarter.sh/en/latest/smarter-framework/apis-and-sdks.html) design goals ask every SDK to be idiomatic in its language, with the platform's vocabulary. The Python SDK uses snake_case, and converts the api's camelCase fields to snake_case attributes. The api's own JSON mixes both: REST resources are camelCase (`hashedId`), and the chat contract is snake_case (`session_key`).

## Decision

- **The SDK's own names are camelCase**, as JavaScript's are: `client.llmClients.prompt()`, `client.manifests.exampleManifest()`, options such as `{ sessionKey }`. Classes and types are PascalCase.
- **The vocabulary is the Python SDK's**, translated mechanically: `llm_clients` is `llmClients`, `add_text` is `addText`, `SmarterPromptError` is `SmarterPromptError`.
- **A model's fields are the api's own names**, exactly as they are on the wire, whatever their case: a prompt response's `data.messages`, an LLMClient's `hashedId`, a chat configuration's `session_key`. The SDK doesn't rename fields.

## Alternatives Considered

- Convert every field to camelCase, as the Python SDK converts to snake_case. Each response would be copied, the platform's docs and examples would no longer match what callers see, and fields the SDK doesn't declare would keep their wire names anyway, so a response would mix both.

## Consequences

- **Positive:**
  - A response is the platform's JSON, as documented, and serializes back to it unchanged.
  - Code reads like other Node.js SDKs, e.g. `openai`, which also keeps the wire's names.
- **Negative:**
  - Callers see both snake_case and camelCase fields, as the api has them.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-001: Scope and Purpose of the SDK](001-scope.md)
- [ADR-004: Zod Models, Forward Compatible](004-zod-models.md)
