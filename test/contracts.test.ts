/**
 * Test that the SDK's mirrors of the platform's api contracts are current.
 *
 * `test/data/contracts/` holds the platform's published JSON Schemas and examples, and the api's
 * OpenAPI document (see `scripts/sync-contracts.sh`). A field that the platform adds to a contract,
 * and that the SDK's schema doesn't declare yet, fails "every mirror declares every field". A request
 * of the SDK that the platform doesn't publish, or an operation that the platform adds and the SDK
 * doesn't call yet, fails "every request is published". The same checks as the Python SDK's
 * tests/test_contracts.py.
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { SmarterError } from "../src/index.ts";
import * as chat from "../src/models/chat.ts";
import * as journal from "../src/models/journal.ts";
import { loadJson, mockPlatform } from "./helpers.ts";

interface JsonSchemaDocument {
  $defs: Record<string, { properties?: Record<string, unknown> }>;
}
interface OpenApi {
  paths: Record<
    string,
    Record<
      string,
      { operationId: string; responses: Record<string, { content?: Record<string, { schema: unknown }> }> }
    >
  >;
}

const contract = (name: string): unknown => loadJson(`contracts/${name}`);

/** The Zod object schemas of a module that mirror a platform contract model of the same name. */
function mirrored(module: Record<string, unknown>): Map<string, z.ZodObject> {
  const result = new Map<string, z.ZodObject>();
  for (const [name, value] of Object.entries(module)) {
    if (value instanceof z.ZodObject && /^(PromptChatApi|SAMJournalApi)/.test(name)) result.set(name, value);
  }
  return result;
}

function declaresSchemaFields(schema: JsonSchemaDocument, models: Map<string, z.ZodObject>): number {
  let checked = 0;
  for (const [name, definition] of Object.entries(schema.$defs)) {
    const model = models.get(name);
    if (model === undefined) continue;
    const missing = Object.keys(definition.properties ?? {}).filter((field) => !(field in model.shape));
    expect(missing, `${name} does not declare the platform's fields`).toEqual([]);
    checked++;
  }
  return checked;
}

describe("chat and journal contracts", () => {
  it("every mirror declares every field of the platform's schema", () => {
    expect(
      declaresSchemaFields(contract("chat-contract.schema") as JsonSchemaDocument, mirrored(chat)),
    ).toBeGreaterThan(30);
    expect(
      declaresSchemaFields(contract("journal-contract.schema") as JsonSchemaDocument, mirrored(journal)),
    ).toBeGreaterThanOrEqual(4);
  });

  it("the platform's example of every version 2 model parses", () => {
    const examples = contract("chat-contract.example") as Record<string, unknown>;
    const models = mirrored(chat);
    let parsed = 0;
    for (const [name, example] of Object.entries(examples)) {
      if (name.endsWith("V1")) continue;
      const model = models.get(name);
      expect(model, name).toBeDefined();
      model?.parse(example);
      parsed++;
    }
    expect(parsed).toBeGreaterThanOrEqual(8);
  });
});

describe("OpenAPI contract", () => {
  /**
   * The operations that the SDK doesn't call: the cli's prompt commands, which it replaces with the
   * chat api, and the reads of one related row of an LLMClient, or of one model of a Provider, whose
   * lists it reads instead. The same as the Python SDK's.
   */
  const NOT_CALLED = new Set([
    "prompt",
    "prompt_config",
    "llmclient_plugin_retrieve",
    "llmclient_apikey_retrieve",
    "llmclient_customdomain_retrieve",
    "llmclient_function_retrieve",
    "provider_model",
  ]);

  const document = contract("openapi") as OpenApi;

  function operation(method: string, path: string): string {
    for (const [template, item] of Object.entries(document.paths)) {
      const pattern = new RegExp(
        "^/api/v1" + template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[^/]+?\\\}/g, "[^/]+") + "$",
      );
      const entry = item[method.toLowerCase()];
      if (pattern.test(path) && entry) return entry.operationId;
    }
    throw new Error(`${method} ${path} is not in the platform's OpenAPI document.`);
  }

  it("every request of the SDK is an operation, and the SDK calls every operation", async () => {
    const platform = mockPlatform();
    const client = platform.client;
    const manifest = loadJson("sam/Guardrail.example") as Record<string, unknown>;
    const upload = join(mkdtempSync(join(tmpdir(), "smarter-")), "notes.txt");
    writeFileSync(upload, "Some notes.", "utf-8");
    const calls: (() => Promise<unknown>)[] = [
      () => client.manifests.apply(manifest),
      () => client.manifests.validate(manifest),
      () => client.manifests.get("Guardrail"),
      () => client.manifests.describe("Guardrail", "example"),
      () => client.manifests.delete("Guardrail", "example"),
      () => client.manifests.deploy("LLMClient", "example"),
      () => client.manifests.undeploy("LLMClient", "example"),
      () => client.manifests.logs("LLMClient", "example"),
      () => client.manifests.exampleManifest("Guardrail"),
      () => client.manifests.jsonSchema("Guardrail"),
      () => client.whoami(),
      () => client.version(),
      () => client.status(),
      () => client.kinds(),
      () => client.llmClients.list(),
      () => client.llmClients.retrieve("rMTAwMDAxMgx"),
      () => client.llmClients.plugins(12),
      () => client.llmClients.functions(12),
      () => client.llmClients.apiKeys(12),
      () => client.llmClients.customDomains(12),
      () => client.guardrails.list(),
      () => client.guardrails.retrieve("rMTAwMDAwMQx"),
      () => client.guardrails.evaluate(1, "hello"),
      () => client.guardrails.events(1, { reviewed: false }),
      () => client.secrets.list(),
      () => client.secrets.retrieve(1),
      () => client.mcpClients.list(),
      () => client.mcpClients.retrieve("rMTAwMDAwMQx"),
      () => client.mcpClients.tools(1, { refresh: true }),
      () => client.mcpClients.refresh(1),
      () => client.mcpClients.callTool(1, "add_numbers", { a: 1, b: 2 }),
      () => client.vectorstores.list(),
      () => client.vectorstores.retrieve("rMTAwMDAwMQx"),
      () => client.vectorstores.status(1),
      () => client.vectorstores.deploy(1),
      () => client.vectorstores.undeploy(1),
      () => client.vectorstores.documents(1),
      () => client.vectorstores.addText(1, "Some text.", { name: "faq" }),
      () => client.vectorstores.addUrl(1, "https://example.com/page.html"),
      () => client.vectorstores.addFiles(1, [upload]),
      () => client.vectorstores.deleteDocument(1, 2),
      () => client.vectorstores.search(1, "query"),
      () => client.vectorstores.snapshots(1),
      () => client.vectorstores.createSnapshot(1),
      () => client.vectorstores.restore(1, 3),
      () => client.llmHosts.list(),
      () => client.llmHosts.retrieve("rMTAwMDAwMQx"),
      () => client.llmHosts.status(1),
      () => client.llmHosts.logs(1, { tail: 20 }),
      () => client.llmHosts.plan(1),
      () => client.llmHosts.deploy(1),
      () => client.llmHosts.undeploy(1, { purge: true }),
      () => client.llmHosts.report(),
      () => client.llmHosts.discover({ query: "llama" }),
      () => client.llmHosts.discoverManifest("BAAI/bge-m3"),
      () => client.plugins.list(),
      () => client.plugins.retrieveManifest(355),
      () => client.providers.list(),
      () => client.providers.retrieve("openai"),
      () => client.providers.models("openai"),
      () => client.proxies.list(),
      () => client.orchestrators.list(),
      () => client.orchestrators.retrieve("rMTAwMDAwMQx"),
      () => client.vectorsearches.list(),
      () => client.vectorsearches.retrieve(1),
      () => client.accounts.list(),
      () => client.accounts.retrieve(1),
      () => client.accounts.users.list(),
      () => client.accounts.users.retrieve(1),
      () => client.accounts.userProfiles.list(),
      () => client.accounts.userProfiles.retrieve(1),
      () => client.accounts.contacts.list(),
      () => client.accounts.contacts.retrieve(1),
      () => client.history.sessions(),
      () => client.history.session(1),
      () => client.history.toolCalls(),
      () => client.history.toolCall(1),
      () => client.history.pluginUsage(),
      () => client.history.pluginUse(1),
      () => client.journal.list({ page: 2, search: "apply" }),
      () => client.journal.retrieve("0".repeat(64)),
      () => client.llmClients.config(12),
      () => client.llmClients.prompt("rMTAwMDAxMgx", "Hello"),
      () => client.llmClients.stream(12, "Hello").untilDone(),
    ];
    for (const call of calls) {
      // the requests are answered with 404s: only their paths matter.
      await call().catch((err: unknown) => {
        if (!(err instanceof SmarterError)) throw err;
      });
    }
    expect(platform.requests).toHaveLength(calls.length);
    const called = new Set(
      platform.requests.map((request) => operation(request.method, new URL(request.url).pathname)),
    );
    const published = new Set<string>();
    for (const item of Object.values(document.paths)) {
      for (const method of ["get", "post", "delete"]) {
        const entry = item[method];
        if (entry) published.add(entry.operationId);
      }
    }
    const uncalled = [...published].filter((id) => !called.has(id)).sort();
    expect(uncalled, "The platform publishes operations that the SDK doesn't call.").toEqual([...NOT_CALLED].sort());
  });

  /** Each fixture of test/data/, by name, and the operation whose 200 response it is. */
  const FIXTURES: Record<string, [string, string]> = {
    llmclients: ["/llm-clients/", "get"],
    llmclient: ["/llm-clients/{id}/", "get"],
    llmclient_plugins: ["/llm-clients/{id}/plugins/", "get"],
    llmclient_functions: ["/llm-clients/{id}/functions", "get"],
    config: ["/llm-clients/{id}/config/", "post"],
    prompt: ["/llm-clients/{id}/prompt/", "post"],
    guardrails: ["/guardrails/", "get"],
    guardrail_eval: ["/guardrails/{id}/evaluate/", "post"],
    guardrail_events: ["/guardrails/{id}/events/", "get"],
    secrets: ["/secrets/", "get"],
    mcpclients: ["/mcpclients/", "get"],
    mcp_tools: ["/mcpclients/{id}/tools/", "get"],
    vectorstores: ["/vectorstores/", "get"],
    llmhosts: ["/llmhosts/", "get"],
    llmhost_status: ["/llmhosts/{id}/status/", "get"],
    llmhost_plan: ["/llmhosts/{id}/plan/", "get"],
    llmhost_report: ["/llmhosts/report/", "get"],
    llmhost_discover: ["/llmhosts/discover/", "get"],
    plugins: ["/plugins/", "get"],
    proxy: ["/proxy/", "get"],
    accounts: ["/accounts/", "get"],
    users: ["/accounts/users/", "get"],
    contacts: ["/accounts/contacts/", "get"],
    history: ["/prompts/history/prompt/", "get"],
    toolcalls: ["/prompts/history/tool-calls/", "get"],
    journal: ["/journal/", "get"],
    plugin_usage: ["/prompts/history/plugin-usage/", "get"],
    user_profiles: ["/accounts/user-profiles/", "get"],
  };

  it("the recorded responses that the tests replay are valid under the platform's OpenAPI document", () => {
    const uri = "urn:smarter:openapi";
    const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
    ajv.addSchema(document, uri);
    for (const [name, [path, method]] of Object.entries(FIXTURES)) {
      const schema = document.paths[path]?.[method]?.responses["200"]?.content?.["application/json"]?.schema;
      expect(schema, name).toBeDefined();
      const validate = ajv.compile(
        JSON.parse(JSON.stringify(schema).replaceAll('"#/components/', `"${uri}#/components/`)) as object,
      );
      const valid = validate(loadJson(name));
      const errors = (validate.errors ?? []).map((error) => `${error.instancePath}: ${error.message ?? ""}`);
      expect(valid ? [] : errors, name).toEqual([]);
    }
  });
});
