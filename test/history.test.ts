/** Test src/resources/history.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

const first = (name: string): unknown => (loadJson(name) as unknown[])[0];

describe("history", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists and retrieves sessions, tool calls and plugin uses", async () => {
    platform.route("GET", "prompts/history/prompt/", { fixture: "history" });
    platform.route("GET", "prompts/history/prompt/43/", { json: first("history") });
    platform.route("GET", "prompts/history/tool-calls/", { fixture: "toolcalls" });
    platform.route("GET", "prompts/history/tool-calls/3/", { json: first("toolcalls") });
    platform.route("GET", "prompts/history/plugin-usage/", { fixture: "plugin_usage" });
    platform.route("GET", "prompts/history/plugin-usage/4/", { json: first("plugin_usage") });
    const history = platform.client.history;
    expect((await history.sessions())[0]?.session_key).toHaveLength(64);
    expect((await history.session(43)).llmclient).toBe(5);
    const toolCall = (await history.toolCalls())[0];
    expect(toolCall?.function_name).toBe("calculator");
    expect(typeof toolCall?.prompt === "object" ? toolCall.prompt?.llmclient : undefined).toBe(5);
    expect((await history.toolCall(3)).id).toBe(3);
    const usage = (await history.pluginUsage())[0];
    expect(typeof usage?.prompt === "object" ? usage.prompt?.llmclient : undefined).toBe(5);
    expect(usage?.plugin?.kind).toBe("WebsearchPlugin");
    expect((await history.pluginUse(4)).input_text).toBe("What is 17 * 23?");
  });

  it("pages the journal, and retrieves an entry by key", async () => {
    platform.route("GET", "journal/", { fixture: "journal" });
    const page = await platform.client.journal.list({ page: 2, pageSize: 10, search: "apply", ordering: "-createdAt" });
    expect(page.pagination.pageSize).toBe(25);
    expect([page.pagination.filter, page.pagination.filters]).toEqual(["", []]);
    expect(Object.fromEntries(new URL(platform.lastRequest.url).searchParams)).toEqual({
      page: "2",
      page_size: "10",
      search: "apply",
      ordering: "-createdAt",
    });
    await platform.client.journal.list();
    expect(new URL(platform.lastRequest.url).search).toBe("?page=1");
    const key = "a".repeat(64);
    platform.route("GET", `journal/${key}/`, {
      json: { key, thing: "Guardrail", command: "apply", statusCode: 200, user: "admin", request: {} },
    });
    expect((await platform.client.journal.retrieve(key)).statusCode).toBe(200);
  });
});
