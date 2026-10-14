/** Test src/client.ts. */

import { inspect } from "node:util";

import { beforeEach, describe, expect, it } from "vitest";

import {
  Accounts,
  Guardrails,
  Journal,
  LLMClients,
  LLMHosts,
  Manifests,
  MCPClients,
  Orchestrators,
  Plugins,
  PromptHistory,
  Providers,
  Proxies,
  Secrets,
  Smarter,
  SmarterConfigurationError,
  VERSION,
  Vectorsearches,
  Vectorstores,
} from "../src/index.ts";
import { API, API_KEY, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("Smarter", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("the platform endpoints return the data of their journaled responses", async () => {
    for (const path of ["whoami", "version", "status", "resources"]) {
      platform.route("POST", `cli/${path}/`, { fixture: path });
    }
    const whoami = await platform.client.whoami();
    expect(whoami.account.accountNumber).toBe("1234-5678-9012");
    expect((await platform.client.version()).api.version).toBeTruthy();
    expect(await platform.client.status()).toHaveProperty("compute");
    const kinds = await platform.client.kinds();
    expect(kinds.map((kind) => kind.APIKind)).toContain("LLMClient");
  });

  it("each property is its resource", () => {
    const expected = {
      manifests: Manifests,
      llmClients: LLMClients,
      guardrails: Guardrails,
      mcpClients: MCPClients,
      vectorstores: Vectorstores,
      llmHosts: LLMHosts,
      secrets: Secrets,
      plugins: Plugins,
      orchestrators: Orchestrators,
      vectorsearches: Vectorsearches,
      accounts: Accounts,
      history: PromptHistory,
      journal: Journal,
      providers: Providers,
      proxies: Proxies,
    };
    for (const [name, resourceClass] of Object.entries(expected)) {
      expect(platform.client[name as keyof typeof expected]).toBeInstanceOf(resourceClass);
    }
  });

  it("has the api key and base url, and masks the key when printed or serialized", () => {
    const client = platform.client;
    expect(client.apiKey).toBe(API_KEY);
    expect(client.baseUrl).toBe(API);
    for (const shown of [String(client), inspect(client), JSON.stringify(client)]) {
      expect(shown).not.toContain(API_KEY);
      expect(shown).toContain("****beef");
    }
    expect(JSON.stringify(client.config)).not.toContain(API_KEY);
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("refuses to start without an api key", () => {
    expect(() => new Smarter({ baseUrl: "http://testserver" })).toThrow(SmarterConfigurationError);
  });

  it("logs requests to its logger at the level asked for, without the api key", async () => {
    platform.route("POST", "cli/whoami/", { fixture: "whoami" });
    const lines: string[] = [];
    const logger = {
      debug: (message: string) => lines.push(message),
      info: (message: string) => lines.push(message),
      warn: (message: string) => lines.push(message),
      error: (message: string) => lines.push(message),
    };
    await platform.makeClient({ logger, logLevel: "debug" }).whoami();
    const output = lines.join("\n");
    expect(output).toContain("smarter:http");
    expect(output).toContain("****beef");
    expect(output).not.toContain(API_KEY);
    lines.length = 0;
    await platform.makeClient({ logger }).whoami();
    expect(lines).toEqual([]);
  });
});
