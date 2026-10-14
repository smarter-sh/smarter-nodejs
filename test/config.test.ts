/** Test src/core/config.ts. */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  apiBaseUrl,
  defaultConfigFile,
  environmentUrl,
  loadCliConfig,
  readSettings,
  resolveClientConfig,
  type SmarterSettings,
} from "../src/core/config.ts";
import { Logger } from "../src/core/log.ts";
import { SmarterConfigurationError } from "../src/index.ts";

const CLI_CONFIG = `
config:
  account_number: 1234-5678-9012
  environment: alpha
  root_domain: example.com
local:
  api_key: local-key
alpha:
  api_key: alpha-key
prod:
  api_key: ""
`;

function writeCliConfig(text: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "smarter-")), "config.yaml");
  writeFileSync(path, text, "utf-8");
  return path;
}

function settings(overrides: Partial<SmarterSettings> = {}): SmarterSettings {
  return { timeout: 60, maxRetries: 2, configFile: "/no/such/config.yaml", ...overrides };
}

describe("config", () => {
  it("derives each environment's url as the cli does", () => {
    expect(environmentUrl("local", "example.com")).toBe("http://localhost:9357");
    expect(environmentUrl("prod", "example.com")).toBe("https://example.com");
    expect(environmentUrl("beta", "example.com")).toBe("https://beta.example.com");
  });

  it("gives a platform url the api's path and a trailing slash, once", () => {
    for (const url of [
      "https://example.com",
      "https://example.com/",
      "https://example.com/api/v1",
      " https://example.com/api/v1/ ",
    ]) {
      expect(apiBaseUrl(url)).toBe("https://example.com/api/v1/");
    }
    expect(apiBaseUrl("http://host:9357/prefix")).toBe("http://host:9357/prefix/api/v1/");
  });

  it("rejects a url that is not http or https", () => {
    for (const url of ["ftp://example.com", "example.com", ""]) {
      expect(() => apiBaseUrl(url)).toThrow(SmarterConfigurationError);
    }
  });

  it("prefers explicit options over settings", () => {
    const config = resolveClientConfig(
      { apiKey: "arg-key", baseUrl: "https://arg.example.com", environment: "beta", timeout: 5, maxRetries: 7 },
      settings({ apiKey: "env-key", baseUrl: "https://env.example.com", timeout: 9, maxRetries: 1 }),
    );
    expect(config).toEqual({
      apiKey: "arg-key",
      baseUrl: "https://arg.example.com/api/v1/",
      environment: "beta",
      timeout: 5,
      maxRetries: 7,
    });
  });

  it("uses the SMARTER_* settings when there are no options", () => {
    const config = resolveClientConfig({}, settings({ apiKey: "env-key", environment: "next", rootDomain: "x.io" }));
    expect(config.apiKey).toBe("env-key");
    expect(config.baseUrl).toBe("https://next.x.io/api/v1/");
  });

  it("defaults to prod on platform.smarter.sh", () => {
    const config = resolveClientConfig({ apiKey: "k" }, settings());
    expect(config.environment).toBe("prod");
    expect(config.baseUrl).toBe("https://platform.smarter.sh/api/v1/");
  });

  it("reads the environment, root domain and environment's api key from the cli's file", () => {
    const path = writeCliConfig(CLI_CONFIG);
    const config = resolveClientConfig({}, settings({ configFile: path }));
    expect(config.environment).toBe("alpha");
    expect(config.apiKey).toBe("alpha-key");
    expect(config.baseUrl).toBe("https://alpha.example.com/api/v1/");
    const local = resolveClientConfig({ environment: "local" }, settings({ configFile: path }));
    expect(local.apiKey).toBe("local-key");
    expect(local.baseUrl).toBe("http://localhost:9357/api/v1/");
  });

  it("uses the cli's top-level api_key for an environment without its own", () => {
    const path = writeCliConfig(CLI_CONFIG + "api_key: top-key\n");
    expect(resolveClientConfig({ environment: "prod" }, settings({ configFile: path })).apiKey).toBe("top-key");
  });

  it("says how to set an api key when there is none", () => {
    expect(() => resolveClientConfig({}, settings())).toThrow(/SMARTER_API_KEY/);
  });

  it("rejects an invalid environment, timeout or retry count", () => {
    expect(() => resolveClientConfig({ apiKey: "k", environment: "mars" as "prod" }, settings())).toThrow(
      SmarterConfigurationError,
    );
    expect(() => resolveClientConfig({ apiKey: "k", timeout: 0 }, settings())).toThrow(SmarterConfigurationError);
    expect(() => resolveClientConfig({ apiKey: "k", maxRetries: -1 }, settings())).toThrow(SmarterConfigurationError);
  });

  it("ignores a missing, malformed or invalid cli file, and logs why", () => {
    const empty = { apiKeys: {} };
    expect(loadCliConfig("/no/such/file.yaml")).toEqual(empty);
    expect(loadCliConfig(writeCliConfig("{not: [valid"))).toEqual(empty);
    expect(loadCliConfig(writeCliConfig("- a list\n"))).toEqual(empty);
    const warnings: string[] = [];
    const logger = new Logger("warn", {
      debug: () => undefined,
      info: () => undefined,
      warn: (m: string) => warnings.push(m),
      error: () => undefined,
    });
    expect(loadCliConfig(writeCliConfig("config:\n  environment: mars\n"), logger)).toEqual(empty);
    expect(warnings.join()).toContain("ignored");
  });

  it("reads the SMARTER_* environment variables", () => {
    const defaults = readSettings({});
    expect(defaults.apiKey).toBeUndefined();
    expect(defaults.maxRetries).toBe(2);
    expect(defaults.configFile).toBe(defaultConfigFile());
    const env = readSettings({
      SMARTER_API_KEY: "from-env",
      SMARTER_TIMEOUT: "12.5",
      SMARTER_MAX_RETRIES: "0",
      SMARTER_ENVIRONMENT: "local",
      SMARTER_LOG: "info",
      SMARTER_CONFIG_FILE: "/tmp/x.yaml",
    });
    expect(env).toMatchObject({
      apiKey: "from-env",
      timeout: 12.5,
      maxRetries: 0,
      environment: "local",
      log: "info",
      configFile: "/tmp/x.yaml",
    });
    for (const bad of [
      { SMARTER_TIMEOUT: "soon" },
      { SMARTER_MAX_RETRIES: "1.5" },
      { SMARTER_ENVIRONMENT: "mars" },
      { SMARTER_LOG: "loud" },
    ]) {
      expect(() => readSettings(bad)).toThrow(SmarterConfigurationError);
    }
  });
});
