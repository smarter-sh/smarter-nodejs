# ADR-002: Configuration

## Status

Accepted

Follows the Python SDK's [ADR-002](https://github.com/smarter-sh/smarter-python/blob/main/doc/adr/002-configuration.md), which adapts the platform's [ADR-004: 12-Factor App](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/004-12-factor.rst) and [ADR-007: Settings](https://github.com/smarter-sh/smarter/blob/main/docs/source/adr/007-settings.rst).

## Context

A client needs an api key and the url of a platform. Programmers configure libraries in code, operators configure them with environment variables (12-factor), and Smarter developers already have both in the smarter cli's `~/.smarter/config.yaml`. A developer who uses both SDKs, or an SDK and the cli, expects one configuration to work everywhere.

## Decision

The lookup is exactly the Python SDK's, and its rules are the cli's. One module, `src/core/config.ts`, is the only code that reads `process.env`. `resolveClientConfig()` takes each value from the first of:

1. the client's options (`new Smarter({ apiKey, baseUrl, environment, timeout, maxRetries })`),
2. the environment: `SMARTER_API_KEY`, `SMARTER_BASE_URL`, `SMARTER_ENVIRONMENT`, `SMARTER_ROOT_DOMAIN`, `SMARTER_TIMEOUT`, `SMARTER_MAX_RETRIES`, `SMARTER_LOG` and `SMARTER_CONFIG_FILE`,
3. the cli's configuration file: `config.environment`, `config.root_domain`, the environment's `<environment>.api_key`, then the top-level `api_key`,
4. the defaults: `prod` on `platform.smarter.sh`.

Without a base url, the url is derived from the environment as the cli derives it. Every value is validated when the client is created, and an invalid one throws `SmarterConfigurationError`. `timeout` is in **seconds**, as in the Python SDK and the environment variable, not milliseconds.

The SDK never reads a `.env` file itself: an application decides how its environment is loaded (e.g. `node --env-file`).

## Alternatives Considered

- Options only, as a minimal library would do.
- Read `.env` with `dotenv`. A library that reads its caller's working directory surprises its caller.
- Milliseconds, the JavaScript convention for durations. The same `SMARTER_TIMEOUT` would then mean different things to two SDKs.

## Consequences

- **Positive:**
  - Developers who use the cli, or the Python SDK, need no setup.
  - Deployments configure the SDK with environment variables alone.
- **Negative:**
  - The lookup order must be documented and tested, because a value can come from four places.
  - Reading the cli's file needs a YAML parser at run time (ADR-011).
  - `process.env` and the home directory don't exist in a browser; the SDK targets Node.js (ADR-019), and a browser must pass every option.

## Related ADRs

- [ADR-000: Introduction](000-intro.md)
- [ADR-001: Scope and Purpose of the SDK](001-scope.md)
- [ADR-016: Security](016-security.md)
