/**
 * The configuration of the Smarter SDK.
 *
 * A client needs an api key and the base url of a Smarter platform. Each is taken from the first of
 * these that sets it:
 *
 * 1. the options of `new Smarter({...})`,
 * 2. environment variables: `SMARTER_API_KEY`, `SMARTER_BASE_URL`, `SMARTER_ENVIRONMENT`,
 *    `SMARTER_ROOT_DOMAIN`, `SMARTER_TIMEOUT`, `SMARTER_MAX_RETRIES` and `SMARTER_LOG`,
 * 3. the `smarter` cli's configuration file, `~/.smarter/config.yaml` (`SMARTER_CONFIG_FILE`), so
 *    that a developer who has run `smarter configure` needs no other setup,
 * 4. the defaults: the `prod` environment of `platform.smarter.sh`.
 *
 * Without an explicit base url, the url is derived from the environment as the cli derives it:
 * `local` is `http://localhost:9357`, `alpha`, `beta` and `next` are
 * `https://<environment>.<root domain>`, and `prod` is `https://<root domain>`.
 *
 * This is the Python SDK's lookup, which follows the Smarter platform's settings design (ADR-007):
 * this module is the only one that reads the environment.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { parse as parseYaml } from "yaml";

import { SmarterConfigurationError } from "./errors.ts";
import type { Logger, SmarterLogLevel } from "./log.ts";

/** The environments of the smarter cli's configuration file. */
export type SmarterEnvironment = "local" | "alpha" | "beta" | "next" | "prod";

/** Every {@link SmarterEnvironment}. */
export const ENVIRONMENTS: readonly SmarterEnvironment[] = ["local", "alpha", "beta", "next", "prod"];

/** The environment when none is configured. */
export const DEFAULT_ENVIRONMENT: SmarterEnvironment = "prod";

/** The platform's root domain when none is configured. */
export const DEFAULT_ROOT_DOMAIN = "platform.smarter.sh";

/** The url of the Smarter platform's local development server. */
export const LOCAL_URL = "http://localhost:9357";

/** The path of the Smarter api, which every request url is relative to. */
export const API_PATH = "/api/v1/";

/** The request timeout, in seconds. Prompts that call several tools can take tens of seconds. */
export const DEFAULT_TIMEOUT = 60;

/** How many times a failed request is retried. */
export const DEFAULT_MAX_RETRIES = 2;

/**
 * The smarter cli's configuration file.
 *
 * @returns `~/.smarter/config.yaml`.
 */
export function defaultConfigFile(): string {
  return join(homedir(), ".smarter", "config.yaml");
}

/** The SDK's settings, from `SMARTER_*` environment variables. */
export interface SmarterSettings {
  /** A Smarter api key: 64 characters. */
  apiKey?: string | undefined;
  /** e.g. `https://platform.example.com` or `http://localhost:9357`. */
  baseUrl?: string | undefined;
  /** The environment of the cli's configuration file. */
  environment?: SmarterEnvironment | undefined;
  /** The platform's root domain, e.g. `platform.smarter.sh`. */
  rootDomain?: string | undefined;
  /** The request timeout, in seconds. */
  timeout: number;
  /** How many times a failed request is retried. */
  maxRetries: number;
  /** The path of the cli's configuration file. */
  configFile: string;
  /** Log the SDK's requests. */
  log?: SmarterLogLevel | undefined;
}

/** The options of a client that its configuration is resolved from. */
export interface ConfigOptions {
  /** A Smarter api key. */
  apiKey?: string | undefined;
  /** The platform's url, e.g. `https://platform.example.com` or `http://localhost:9357`. */
  baseUrl?: string | undefined;
  /** The environment of the smarter cli's configuration file to use. */
  environment?: SmarterEnvironment | undefined;
  /** The request timeout, in seconds. */
  timeout?: number | undefined;
  /** How many times to retry a request that failed for a transient reason. 0 disables retries. */
  maxRetries?: number | undefined;
}

/** The parts of the smarter cli's `~/.smarter/config.yaml` that the SDK reads. */
export interface CliConfig {
  /** `config.environment`. */
  environment?: SmarterEnvironment | undefined;
  /** `config.root_domain`. */
  rootDomain?: string | undefined;
  /** The top-level `api_key`, used by any environment. */
  apiKey?: string | undefined;
  /** The api key of each environment: `<environment>.api_key`. */
  apiKeys: Record<string, string>;
}

/** A client's resolved configuration. */
export interface ClientConfig {
  /** The api key. */
  readonly apiKey: string;
  /** The api's base url, ending in `/api/v1/`. */
  readonly baseUrl: string;
  /** The environment. */
  readonly environment: SmarterEnvironment;
  /** The request timeout, in seconds. */
  readonly timeout: number;
  /** How many times a failed request is retried. */
  readonly maxRetries: number;
}

type Environment = Record<string, string | undefined>;

function nonEmpty(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

function parseEnvironment(value: string | undefined, source: string): SmarterEnvironment | undefined {
  if (value === undefined) return undefined;
  if ((ENVIRONMENTS as readonly string[]).includes(value)) return value as SmarterEnvironment;
  throw new SmarterConfigurationError(
    `${source} must be one of ${ENVIRONMENTS.join(", ")}, not ${JSON.stringify(value)}.`,
  );
}

function parseNumber(value: string | undefined, name: string, integer: boolean, fallback: number): number {
  if (value === undefined) return fallback;
  const number = Number(value);
  const valid = Number.isFinite(number) && (integer ? Number.isInteger(number) && number >= 0 : number > 0);
  if (!valid) {
    const expected = integer ? "a whole number, 0 or more" : "a number of seconds, more than 0";
    throw new SmarterConfigurationError(`${name} must be ${expected}, not ${JSON.stringify(value)}.`);
  }
  return number;
}

/**
 * Read the SDK's settings from the environment.
 *
 * @param env - The environment, `process.env` by default.
 * @returns The settings.
 * @throws {@link SmarterConfigurationError} If a variable's value is invalid.
 */
export function readSettings(env: Environment = process.env): SmarterSettings {
  const log = nonEmpty(env["SMARTER_LOG"]);
  if (log !== undefined && !["debug", "info", "warn", "error", "off"].includes(log)) {
    throw new SmarterConfigurationError(
      `SMARTER_LOG must be debug, info, warn, error or off, not ${JSON.stringify(log)}.`,
    );
  }
  return {
    apiKey: nonEmpty(env["SMARTER_API_KEY"]),
    baseUrl: nonEmpty(env["SMARTER_BASE_URL"]),
    environment: parseEnvironment(nonEmpty(env["SMARTER_ENVIRONMENT"]), "SMARTER_ENVIRONMENT"),
    rootDomain: nonEmpty(env["SMARTER_ROOT_DOMAIN"]),
    timeout: parseNumber(nonEmpty(env["SMARTER_TIMEOUT"]), "SMARTER_TIMEOUT", false, DEFAULT_TIMEOUT),
    maxRetries: parseNumber(nonEmpty(env["SMARTER_MAX_RETRIES"]), "SMARTER_MAX_RETRIES", true, DEFAULT_MAX_RETRIES),
    configFile: nonEmpty(env["SMARTER_CONFIG_FILE"]) ?? defaultConfigFile(),
    log: log as SmarterLogLevel | undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOf(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Read the cli's configuration file.
 *
 * A missing, unreadable or invalid file is an empty configuration: the file is optional.
 *
 * @param path - The file's path.
 * @param logger - Where to log why a file was ignored.
 * @returns The configuration.
 */
export function loadCliConfig(path: string, logger?: Logger): CliConfig {
  let document: unknown;
  try {
    document = parseYaml(readFileSync(path, "utf-8"));
  } catch (err) {
    logger?.log("debug", "config", `smarter cli configuration ${path} not read: ${String(err)}`);
    return { apiKeys: {} };
  }
  if (!isRecord(document)) return { apiKeys: {} };
  const config = isRecord(document["config"]) ? document["config"] : {};
  const apiKeys: Record<string, string> = {};
  for (const [name, section] of Object.entries(document)) {
    const key = isRecord(section) ? stringOf(section["api_key"]) : undefined;
    if (key !== undefined) apiKeys[name] = key;
  }
  let environment: SmarterEnvironment | undefined;
  try {
    environment = parseEnvironment(stringOf(config["environment"]), `config.environment in ${path}`);
  } catch (err) {
    logger?.log("warn", "config", `smarter cli configuration ${path} is invalid and was ignored: ${String(err)}`);
    return { apiKeys: {} };
  }
  return {
    environment,
    rootDomain: stringOf(config["root_domain"]),
    apiKey: stringOf(document["api_key"]),
    apiKeys,
  };
}

/**
 * The platform url of an environment, as the smarter cli derives it.
 *
 * @param environment - The environment.
 * @param rootDomain - The platform's root domain, e.g. `platform.smarter.sh`.
 * @returns e.g. `https://alpha.platform.smarter.sh`.
 */
export function environmentUrl(environment: SmarterEnvironment, rootDomain: string): string {
  if (environment === "local") return LOCAL_URL;
  if (environment === "prod") return `https://${rootDomain}`;
  return `https://${environment}.${rootDomain}`;
}

/**
 * The api's base url for a platform url.
 *
 * `https://example.com` and `https://example.com/api/v1` both become `https://example.com/api/v1/`.
 *
 * @param url - A platform url, with or without the api's path.
 * @returns The url, with the api's path and a trailing slash.
 * @throws {@link SmarterConfigurationError} If the url is not an http or https url.
 */
export function apiBaseUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new SmarterConfigurationError(
      `The Smarter base url must be an http or https url, not ${JSON.stringify(url)}.`,
    );
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.host === "") {
    throw new SmarterConfigurationError(
      `The Smarter base url must be an http or https url, not ${JSON.stringify(url)}.`,
    );
  }
  let path = parsed.pathname.replace(/\/+$/, "");
  const apiPath = API_PATH.replace(/\/+$/, "");
  if (!path.endsWith(apiPath)) path += apiPath;
  return `${parsed.protocol}//${parsed.host}${path}/`;
}

/**
 * Resolve a client's configuration from its options, the environment, and the cli's configuration file.
 *
 * @param options - The client's options.
 * @param settings - The settings to use instead of reading the environment variables, for tests.
 * @param logger - Where to log why the cli's file was ignored.
 * @returns The configuration.
 * @throws {@link SmarterConfigurationError} If no api key is found, or a value is invalid.
 */
export function resolveClientConfig(
  options: ConfigOptions = {},
  settings: SmarterSettings = readSettings(),
  logger?: Logger,
): ClientConfig {
  const cli = loadCliConfig(settings.configFile, logger);
  const environment =
    parseEnvironment(options.environment, "environment") ??
    settings.environment ??
    cli.environment ??
    DEFAULT_ENVIRONMENT;

  const apiKey = nonEmpty(options.apiKey) ?? settings.apiKey ?? cli.apiKeys[environment] ?? cli.apiKey;
  if (apiKey === undefined) {
    throw new SmarterConfigurationError(
      "No Smarter api key. Pass { apiKey }, set SMARTER_API_KEY, or run 'smarter configure'.",
    );
  }

  const url =
    nonEmpty(options.baseUrl) ??
    settings.baseUrl ??
    environmentUrl(environment, settings.rootDomain ?? cli.rootDomain ?? DEFAULT_ROOT_DOMAIN);

  const timeout = options.timeout ?? settings.timeout;
  if (!(Number.isFinite(timeout) && timeout > 0)) {
    throw new SmarterConfigurationError(`timeout must be a number of seconds, more than 0, not ${String(timeout)}.`);
  }
  const maxRetries = options.maxRetries ?? settings.maxRetries;
  if (!(Number.isInteger(maxRetries) && maxRetries >= 0)) {
    throw new SmarterConfigurationError(`maxRetries must be a whole number, 0 or more, not ${String(maxRetries)}.`);
  }

  return { apiKey, baseUrl: apiBaseUrl(url), environment, timeout, maxRetries };
}
