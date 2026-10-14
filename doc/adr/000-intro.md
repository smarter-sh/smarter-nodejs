# ADR Introduction

Architectural Design Records (ADRs) are short documents that capture a single architectural or design decision, its context, and its consequences. Less is more: keep them brief.

These are the ADRs of the Smarter Node.js SDK. They follow the Smarter Python SDK's [ADRs](https://github.com/smarter-sh/smarter-python/tree/main/doc/adr), which is the reference implementation of every Smarter SDK, and through them the Smarter platform's own [ADRs](https://github.com/smarter-sh/smarter/tree/main/docs/source/adr). ADRs 001 to 019 keep the Python SDK's numbers and titles, so that the same decision has the same number in every SDK, and each one says how it adapts the Python decision to Node.js. ADRs from 020 on are decisions that only a JavaScript SDK has to make.

The platform's decisions about its own runtime (Django, Docker, Kubernetes, the database, Celery, React, templates, feature flags, internationalization) don't apply to an SDK and are not repeated here.

See: [Michael Nygard's ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html)

## Guidelines for writing ADRs

- **One decision per ADR.**
- **Be concise.** Focus on clarity and brevity.
- **State the context:** the forces that led to the decision.
- **List the alternatives**, and why they weren't chosen.
- **Explain the decision**, and **describe its consequences**, positive and negative.
- **Use simple language**, for future contributors without today's context.
- **Use the same format** as the others, and **reference related ADRs**.
- **Keep the numbering aligned** with the Python SDK: a decision that every SDK shares takes the Python SDK's number.

## Index

- [ADR-001: Scope and Purpose of the SDK](001-scope.md)
- [ADR-002: Configuration](002-configuration.md)
- [ADR-003: Writes Go Through the Manifest API](003-writes-through-manifests.md)
- [ADR-004: Zod Models, Forward Compatible](004-zod-models.md)
- [ADR-005: Mirrored Contracts and Generated SAM Types](005-platform-models.md)
- [ADR-006: Error Handling](006-error-handling.md)
- [ADR-007: Logging](007-logging.md)
- [ADR-008: HTTP Transport, Retries and Timeouts](008-http-transport.md)
- [ADR-009: Testing](009-testing.md)
- [ADR-010: CI/CD](010-ci-cd.md)
- [ADR-011: Dependency Management](011-dependencies.md)
- [ADR-012: Doc Comments and Documentation](012-documentation.md)
- [ADR-013: Type Annotations](013-type-annotations.md)
- [ADR-014: Code Quality](014-code-quality.md)
- [ADR-015: Semantic Versioning and API Versions](015-versioning.md)
- [ADR-016: Security](016-security.md)
- [ADR-017: No Response Caching](017-caching.md)
- [ADR-018: An Asynchronous Client](018-asynchronous-client.md)
- [ADR-019: Supported Node.js Versions](019-nodejs-versions.md)
- [ADR-020: ES Modules Only](020-esm-only.md)
- [ADR-021: Names: camelCase Methods, the Wire's Field Names](021-naming.md)
