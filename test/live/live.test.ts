/**
 * Test the SDK against a running Smarter platform.
 *
 * These tests are skipped unless `SMARTER_TEST_LIVE=true`. They read the client's configuration as
 * the SDK always does (`SMARTER_API_KEY`, `SMARTER_BASE_URL`, ...), e.g.:
 *
 *     SMARTER_BASE_URL=http://localhost:9357 SMARTER_API_KEY=... make test-live
 *
 * They validate the SDK's schemas against the platform's real responses. They prompt an LLMClient,
 * which makes billable LLM requests, and they apply and delete a throwaway Guardrail. They never
 * deploy anything: deploy creates real, billable infrastructure.
 *
 * `SMARTER_TEST_LLMCLIENT` names the LLMClient to prompt (default `calculator`, which the platform
 * creates as an example), and its built-in calculator function makes the prompt call a tool. These
 * are the Python SDK's live tests (tests/live/test_live.py).
 */

import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  APIStatusError,
  Manifest,
  PLUGIN_KINDS,
  ResourceNotFoundError,
  Smarter,
  type SAMKind,
} from "../../src/index.ts";

// test/setup.ts hid the developer's SMARTER_* variables from the unit tests; the live tests need them.
const saved = JSON.parse(process.env["SMARTER_LIVE_ENV"] ?? "{}") as Record<string, string>;
const LIVE = saved["SMARTER_TEST_LIVE"]?.toLowerCase() === "true";
const LLMCLIENT = saved["SMARTER_TEST_LLMCLIENT"] ?? "calculator";

/** Run a check, and skip it with the platform's message when the platform fails. */
async function platformCall<T>(
  skip: (note: string) => void,
  what: string,
  call: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await call();
  } catch (err) {
    if (err instanceof APIStatusError) {
      skip(`the platform's ${what} failed: ${String(err)}`);
      return undefined;
    }
    throw err;
  }
}

describe.skipIf(!LIVE)("live", { timeout: 180_000 }, () => {
  let client: Smarter;
  const restored: string[] = [];

  beforeAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        restored.push(key);
      }
    }
    Reflect.deleteProperty(process.env, "SMARTER_CONFIG_FILE");
    client = new Smarter();
  });

  afterAll(() => {
    for (const key of restored) Reflect.deleteProperty(process.env, key);
  });

  it("whoami, version, status and kinds parse", async () => {
    expect((await client.whoami()).user.username).toBeTruthy();
    expect((await client.version()).api.version).toBeTruthy();
    await client.status();
    expect((await client.kinds()).map((kind) => kind.APIKind)).toContain("LLMClient");
  });

  it("every REST list parses", async () => {
    for (const resource of [
      client.llmClients,
      client.guardrails,
      client.mcpClients,
      client.secrets,
      client.plugins,
      client.llmHosts,
      client.orchestrators,
      client.vectorsearches,
      client.accounts,
    ]) {
      await resource.list();
    }
    await client.accounts.users.list();
    await client.accounts.contacts.list();
    await client.accounts.userProfiles.list();
    await client.history.sessions();
    await client.history.toolCalls();
    await client.history.pluginUsage();
  });

  it("the first row of each list of the accounts and the prompt history is retrieved by its id", async () => {
    const pairs: [() => Promise<{ id: number }[]>, (id: number) => Promise<{ id: number }>][] = [
      [() => client.accounts.users.list(), (id) => client.accounts.users.retrieve(id)],
      [() => client.accounts.userProfiles.list(), (id) => client.accounts.userProfiles.retrieve(id)],
      [() => client.accounts.contacts.list(), (id) => client.accounts.contacts.retrieve(id)],
      [() => client.history.sessions(), (id) => client.history.session(id)],
      [() => client.history.toolCalls(), (id) => client.history.toolCall(id)],
      [() => client.history.pluginUsage(), (id) => client.history.pluginUse(id)],
    ];
    for (const [list, retrieve] of pairs) {
      const rows = await list();
      const first = rows[0];
      if (first !== undefined) expect((await retrieve(first.id)).id).toBe(first.id);
    }
  });

  it("the apis that a platform may disable, or that require a superuser, parse when they answer", async (context) => {
    const skipped: string[] = [];
    for (const [name, call] of [
      ["vectorstores", () => client.vectorstores.list()],
      ["proxies", () => client.proxies.list()],
      ["journal", () => client.journal.list()],
      ["providers", () => client.providers.list()],
    ] as const) {
      try {
        await call();
      } catch (err) {
        if (err instanceof ResourceNotFoundError || err instanceof APIStatusError)
          skipped.push(`${name}: ${String(err)}`);
        else throw err;
      }
    }
    if (skipped.length > 0) context.skip(`not enabled, or failed on the platform: ${skipped.join("; ")}`);
  });

  it("get, exampleManifest and jsonSchema parse for every kind", async () => {
    const failures: string[] = [];
    for (const kind of await client.kinds()) {
      try {
        await client.manifests.get(kind.APIKind);
      } catch (err) {
        if (err instanceof APIStatusError) {
          failures.push(`get ${kind.APIKind}: ${String(err)}`);
          continue;
        }
        throw err;
      }
      expect((await client.manifests.exampleManifest(kind.APIKind)).kind).toBe(kind.APIKind);
      expect(await client.manifests.jsonSchema(kind.APIKind)).toHaveProperty("properties");
    }
    if (failures.length > 0) console.warn(`platform failures (skipped): ${failures.join("; ")}`);
  });

  it("a described resource of every kind validates against its kind's SAM schema", async () => {
    const plugins = await client.plugins.list();
    const notes: string[] = [];
    for (const kind of await client.kinds()) {
      const skip = (note: string): void => {
        notes.push(note);
      };
      let names: string[] | undefined;
      if (PLUGIN_KINDS.includes(kind.APIKind)) {
        // the platform's get of a plugin kind returns every plugin, so they are picked by kind.
        names = plugins.filter((plugin) => plugin.kind === kind.APIKind).map((plugin) => plugin.name);
      } else {
        names = (await platformCall(skip, `get ${kind.APIKind}`, () => client.manifests.get(kind.APIKind)))?.names;
      }
      const name = names?.[0];
      if (name === undefined) {
        if (names !== undefined) notes.push(`there is no ${kind.APIKind} to describe`);
        continue;
      }
      const manifest = await platformCall(skip, `describe ${kind.APIKind} ${name}`, () =>
        client.manifests.describe(kind.APIKind, name),
      );
      if (manifest === undefined) continue;
      // the platform returns some names with dashes in get, and underscores in describe.
      const typed = manifest.toSam(kind.APIKind as SAMKind);
      expect(typed.metadata.name.replaceAll("-", "_")).toBe(name.replaceAll("-", "_"));
    }
    if (notes.length > 0) console.warn(`skipped: ${notes.join("; ")}`);
  });

  it("a Guardrail is validated, applied, described, found, evaluated and deleted", async () => {
    const manifest = await client.guardrails.exampleManifest();
    const name = `sdk_live_test_${randomUUID().replaceAll("-", "").slice(0, 8)}`;
    manifest.metadata.name = name;
    manifest.metadata.annotations = { ...manifest.metadata.annotations, "example.com/sdk-live-test": name };
    expect((await client.manifests.validate(manifest)).valid).toBe(true);
    await client.guardrails.apply(manifest);
    try {
      const described = await client.guardrails.describe(name);
      expect(described).toBeInstanceOf(Manifest);
      expect(described.metadata.name).toBe(name);
      expect(described.metadata.annotations?.["example.com/sdk-live-test"]).toBe(name);
      expect((await client.manifests.get("Guardrail", name)).names).toEqual([name]);
      const selected = await client.manifests.get("Guardrail", null, {
        annotation: `example.com/sdk-live-test=${name}`,
      });
      expect(selected.names).toEqual([name]);
      const guardrail = await client.guardrails.find(name);
      expect(guardrail.annotations?.["example.com/sdk-live-test"]).toBe(name);
      expect((await client.guardrails.retrieve(guardrail.id)).name).toBe(name);
      const stage = guardrail.stage === "output" ? "output" : "input";
      const evaluation = await client.guardrails.evaluate(guardrail.id, "My SSN is 078-05-1120.", { stage });
      expect(evaluation.guardrail).toBe(name);
      await client.guardrails.events(guardrail.id);
    } finally {
      await client.guardrails.delete(name);
    }
  });

  it("a prompt returns the LLM's reply, and its tool call", async () => {
    const llmclient = await client.llmClients.find(LLMCLIENT);
    const response = await client.llmClients.prompt(llmclient.id, "What is 17 times 23? Use the calculator.");
    expect(response.text.replaceAll(",", "")).toContain("391");
    expect(llmclient.tools.map((tool) => [tool.name, tool.kind])).toContainEqual(["calculator", "Function"]);
    await client.llmClients.extensions(llmclient.id);
    await client.llmClients.plugins(llmclient.id);
    await client.llmClients.apiKeys(llmclient.id);
    await client.llmClients.customDomains(llmclient.id);
  });

  it("a chat keeps its session and thread, and a streamed prompt reports its progress", async () => {
    const llmclient = await client.llmClients.find(LLMCLIENT);
    const chat = await client.llmClients.chat(llmclient.hashedId ?? llmclient.id);
    expect((await chat.send("What is 2 to the 10th power? Use the calculator.")).text.replaceAll(",", "")).toContain(
      "1024",
    );
    const stream = chat.stream("Divide that by 4, with the calculator.");
    const events = [];
    for await (const event of stream) events.push(event);
    expect(events.some((event) => event.type === "llm_request")).toBe(true);
    expect(stream.response.text).toContain("256");
    expect(chat.messages).toContainEqual(stream.response.data.messages.at(-1));
    const resumed = await client.llmClients.chat(llmclient.id, { sessionKey: chat.sessionKey });
    expect(resumed.sessionKey).toBe(chat.sessionKey);
    expect(resumed.messages.length).toBeGreaterThan(0);
  });

  it("the MCPClient tools and the LLMHost report parse", async () => {
    const mcpclient = (await client.mcpClients.list())[0];
    if (mcpclient !== undefined) await client.mcpClients.tools(mcpclient.id);
    const llmhost = (await client.llmHosts.list())[0];
    await client.llmHosts.report();
    if (llmhost !== undefined) {
      await client.llmHosts.status(llmhost.id);
      await client.llmHosts.plan(llmhost.id);
    }
  });
});
