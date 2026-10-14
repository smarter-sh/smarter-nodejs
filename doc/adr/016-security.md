# ADR-016: Security

## Status

Accepted

Follows the Python SDK's [ADR-016](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/016-security.md), which adapts the platform's [ADR-016: Security](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/016-security.rst).

## Context

The SDK holds api keys that can change production resources, and some of its operations create billable infrastructure. Its repository is public, and its tests use data from real platforms. JavaScript objects are printed whole by `console.log` and serialized whole by `JSON.stringify`.

## Decision

- The api key is held in a private class field (`#apiKey`), sent only in the `Authorization` header, and masked in logs, in `util.inspect` and in `toJSON()` of the client.
- `deploy()` methods say in their doc comments that they create real infrastructure, and no test calls them against a platform.
- Test fixtures from real responses are sanitized: no names, emails, addresses, account numbers, keys or private hostnames.
- The SDK never evaluates code from a response, and never reads a `.env` file on its own.
- The package publishes only `dist/`, the README and the license (`files` in `package.json`).

## Alternatives Considered

- Leave key handling to the caller.

## Consequences

- **Positive:**
  - Keys don't leak through logs, error reports or serialized clients.
- **Negative:**
  - Sanitizing fixtures is manual, and must be reviewed.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-002: Configuration](002-configuration.md)
- [ADR-007: Logging](007-logging.md)
- [ADR-009: Testing](009-testing.md)
