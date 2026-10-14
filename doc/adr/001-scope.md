# ADR-001: Scope and Purpose of the SDK

## Status

Accepted

Follows the Python SDK's [ADR-001](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/001-scope.md).

## Context

The Smarter platform is managed through its REST api. The smarter cli (Go) serves people at a terminal, Smarter Chat (React) serves web pages, and the Python SDK serves Python programmers. JavaScript and TypeScript programmers, who build most web back ends, serverless functions and chat front ends, had no client: they had to hand-write HTTP calls, or customize the platform. The platform's [APIs and SDKs](https://docs.smarter.sh/en/latest/smarter-framework/apis-and-sdks.html) page lists a Node.js SDK as planned, and sets the requirements that every SDK meets.

## Decision

smarter-nodejs is the platform's official, complete Node.js SDK, written in TypeScript and published to npm as `smarter-api`, the same name as the Python SDK's PyPI package. It is to Smarter what the `openai` package is to the OpenAI api:

- it covers **all** of the platform's public api: every resource kind through the manifest api, the chat and prompt apis, and every resource's REST reads and actions,
- it exposes the platform's own models: a TypeScript type of every SAM kind, and the api contracts (ADR-005),
- it has the **same features and vocabulary as the Python SDK**, which is the reference implementation: what the Python SDK does, this SDK does, with the same resources, verbs and exceptions, in idiomatic TypeScript (ADR-021).

The platform is never imported. Everything goes through its http api, so the SDK works against a platform on a laptop or on Kubernetes, of any version that serves `smarter.sh/v1`.

## Alternatives Considered

- Generate a client from the platform's `openapi.json` alone (e.g. `openapi-typescript` plus `openapi-fetch`). It would type the REST routes, but not the manifest api's broker semantics, the configuration lookup that the cli shares, the chat session and streaming helpers, or the error hierarchy. The generated types are still useful to callers, and the platform's docs explain how to make them.
- Port only the chat api, for front ends. Back ends need the rest.

## Consequences

- **Positive:**
  - JavaScript and TypeScript software can integrate with Smarter without forking it.
  - A third client of the api finds the api's inconsistencies and bugs.
- **Negative:**
  - The SDK must track the platform's api, and the Python SDK's features, as they change (ADR-005, ADR-015).

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-002: Configuration](002-configuration.md)
- [ADR-003: Writes Go Through the Manifest API](003-writes-through-manifests.md)
- [ADR-005: Mirrored Contracts and Generated SAM Types](005-platform-models.md)
- [ADR-021: Names: camelCase Methods, the Wire's Field Names](021-naming.md)
