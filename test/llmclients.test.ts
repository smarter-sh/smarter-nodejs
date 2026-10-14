/** Test src/resources/llmclients.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import {
  BadRequestError,
  ResourceNotFoundError,
  SmarterError,
  SmarterPromptError,
  SmarterValueError,
  messageText,
  requestMessages,
  toMessages,
  type PromptChatApiProgressEvent,
} from "../src/index.ts";
import { loadJson, loadText, mockPlatform, type MockPlatform } from "./helpers.ts";

type Json = Record<string, unknown>;

function sse(...events: [string, unknown][]): string {
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}

async function drain<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

describe("LLMClients", () => {
  let platform: MockPlatform;
  let promptResponse: Json;
  beforeEach(() => {
    platform = mockPlatform();
    promptResponse = loadJson("prompt") as Json;
  });

  it("lists, retrieves by id or hashed id, and finds by name", async () => {
    platform.route("GET", "llm-clients/", { fixture: "llmclients" });
    platform.route("GET", "llm-clients/5/", { fixture: "llmclient" });
    platform.route("GET", "llm-clients/rMTAwMDAwNQx/", { fixture: "llmclient" });
    const llmclients = await platform.client.llmClients.list();
    expect(llmclients).toHaveLength(2);
    expect((await platform.client.llmClients.retrieve(5)).name).toBe("calculator");
    expect((await platform.client.llmClients.retrieve("rMTAwMDAwNQx")).name).toBe("calculator");
    const second = llmclients[1];
    expect((await platform.client.llmClients.find(second?.name ?? "")).id).toBe(second?.id);
    await expect(platform.client.llmClients.find("nope")).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("reads an LLMClient's plugins, functions, api keys and custom domains", async () => {
    platform.route("GET", "llm-clients/1/plugins/", { fixture: "llmclient_plugins" });
    platform.route("GET", "llm-clients/5/functions", { fixture: "llmclient_functions" });
    const apiKeyId = "0b8e1c55-2f3a-4c1d-9a51-7d2f4e6b8a90";
    platform.route("GET", "llm-clients/5/apikeys/", { json: [{ id: 1, llmclient: 5, apiKey: apiKeyId }] });
    platform.route("GET", "llm-clients/5/customdomains", {
      json: [{ id: 3, name: "example_com", domainName: "example.com", verificationStatus: "Failed" }],
    });
    expect((await platform.client.llmClients.plugins(1))[0]?.pluginMeta.pluginClass).toBe("sql");
    expect((await platform.client.llmClients.functions(5))[0]?.name).toBe("calculator");
    expect((await platform.client.llmClients.apiKeys(5))[0]?.apiKey).toBe(apiKeyId);
    const domain = (await platform.client.llmClients.customDomains(5))[0];
    expect([domain?.domainName, domain?.verificationStatus]).toEqual(["example.com", "Failed"]);
  });

  it("config() starts or resumes a chat session", async () => {
    platform.route("POST", "llm-clients/5/config/", { fixture: "config" });
    const config = await platform.client.llmClients.config(5, { sessionKey: "abc" });
    expect(config.llmclient.name).toBe("calculator");
    expect(await platform.requestJson()).toEqual({ session_key: "abc" });
    await platform.client.llmClients.config(5);
    expect(await platform.requestJson()).toEqual({ session_key: null });
  });

  it("prompt() sends the user's message, and returns the LLM's reply", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { json: promptResponse });
    const response = await platform.client.llmClients.prompt(5, "What is 17 times 23?", { sessionKey: "k" });
    expect(response.text).toBeTruthy();
    expect(JSON.stringify(response)).not.toContain('"text":"' + response.text);
    expect(await platform.requestJson()).toEqual({
      session_key: "k",
      messages: [{ role: "user", content: "What is 17 times 23?" }],
    });
  });

  it("a failed prompt throws the LLM provider's status, with the error response as its body", async () => {
    const error = { errorClass: "LLMProviderError", description: "bad request", status: 400 };
    platform.route("POST", "llm-clients/5/prompt/", { status: 400, json: { ...promptResponse, error } });
    const thrown = await platform.client.llmClients.prompt(5, "hi").catch((err: unknown) => err);
    expect(thrown).toBeInstanceOf(BadRequestError);
    expect((thrown as BadRequestError).message).toBe("bad request");
  });

  it("doesn't send Smarter's own messages, and every message keeps its content key", () => {
    const thread = toMessages([
      { role: "system", content: "be brief" },
      { role: "assistant", tool_calls: [{ id: "c", type: "function", function: { name: "f", arguments: "{}" } }] },
      { role: "smarter", content: "charges" },
      { role: "tool", content: "1", tool_call_id: "c" },
    ]);
    const sent = requestMessages(thread) as Json[];
    expect(sent.map((message) => message["role"])).toEqual(["system", "assistant", "tool"]);
    expect(sent[1]).toHaveProperty("content", null);
    expect(messageText({ role: "user", content: [{ type: "text", text: "a" }] })).toBe("a");
  });

  it("a stream yields the progress events, then has the prompt's response", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { text: loadText("prompt_sse.txt") });
    const stream = platform.client.llmClients.stream(5, "hi");
    const events: PromptChatApiProgressEvent[] = await drain(stream);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.type).toBe("llm_request");
    expect(stream.result?.status).toBe(200);
    expect(stream.response.text).toBeTruthy();
    await expect(drain(stream)).rejects.toBeInstanceOf(SmarterError);
  });

  it("untilDone() reads the stream, and returns the response", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { text: loadText("prompt_sse.txt") });
    expect((await platform.client.llmClients.stream(5, "hi").untilDone()).text).toBeTruthy();
  });

  it("a stream that failed, or that hasn't been read, throws when its response is read", async () => {
    const error = { errorClass: "LLMProviderError", description: "boom", status: 400 };
    const failed = { ...promptResponse, error };
    const errorOnly = { error: { errorClass: "NotFound", description: "gone", status: 404 } };
    for (const [body, message] of [
      [failed, "boom"],
      [errorOnly, "gone"],
    ] as const) {
      platform.route("POST", "llm-clients/5/prompt/", { text: sse(["result", { status: 400, response: body }]) });
      const thrown = await platform.client.llmClients
        .stream(5, "hi")
        .untilDone()
        .catch((err: unknown) => err);
      expect(thrown).toBeInstanceOf(SmarterPromptError);
      expect((thrown as SmarterPromptError).message).toBe(message);
    }
    expect(() => platform.client.llmClients.stream(5, "hi").response).toThrow(SmarterError);
  });
});

describe("ChatSession", () => {
  let platform: MockPlatform;
  let promptResponse: Json;
  let config: Json & { session_key: string; history: Json; llmclient: Json };
  beforeEach(() => {
    platform = mockPlatform();
    platform.route("POST", "llm-clients/5/config/", { fixture: "config" });
    promptResponse = loadJson("prompt") as Json;
    config = (loadJson("config") as { data: typeof config }).data;
  });

  it("a new session's thread is the LLMClient's system prompt and welcome message", async () => {
    const chat = await platform.client.llmClients.chat(5);
    expect(chat.sessionKey).toBe(config.session_key);
    expect(chat.messages.map((message) => message.role).slice(0, 1)).toEqual(["system"]);
  });

  it("a resumed session's thread is its history", async () => {
    config.history["chat_history"] = [{ role: "user", content: "earlier" }];
    platform.route("POST", "llm-clients/5/config/", { json: { api: "smarter.sh/v1", data: config } });
    const chat = await platform.client.llmClients.chat(5, { sessionKey: config.session_key });
    expect(messageText(chat.messages[0] ?? { role: "user" })).toBe("earlier");
  });

  it("an LLMClient without a system prompt or welcome message starts with an empty thread", async () => {
    config.llmclient["default_system_role"] = null;
    config.llmclient["app_welcome_message"] = null;
    platform.route("POST", "llm-clients/5/config/", { json: { api: "smarter.sh/v1", data: config } });
    expect((await platform.client.llmClients.chat(5)).messages).toEqual([]);
  });

  it("send() sends the thread with the session key, and adds the prompt's messages to it", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { json: promptResponse });
    const chat = await platform.client.llmClients.chat(5);
    const before = chat.messages.length;
    const response = await chat.send("What is 17 times 23?");
    const body = (await platform.requestJson()) as { session_key: string; messages: Json[] };
    expect(body.session_key).toBe(chat.sessionKey);
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "What is 17 times 23?" });
    expect(chat.messages).toHaveLength(before + 1 + response.data.messages.length);
    await chat.send({ role: "user", content: "again" });
    expect(((await platform.requestJson()) as { messages: Json[] }).messages.at(-1)?.["content"]).toBe("again");
  });

  it("a chat stream updates the thread when it succeeds, and not when it fails", async () => {
    platform.route("POST", "llm-clients/5/prompt/", { text: loadText("prompt_sse.txt") });
    const chat = await platform.client.llmClients.chat(5);
    const before = chat.messages.length;
    await drain(chat.stream("hi"));
    expect(chat.messages.length).toBeGreaterThan(before + 1);
    const count = chat.messages.length;
    const failed = { error: { errorClass: "NotFound", description: "gone", status: 404 } };
    platform.route("POST", "llm-clients/5/prompt/", {
      handler: () => new Response(sse(["result", { status: 404, response: failed }])),
    });
    await drain(chat.stream({ role: "user", content: "again" }));
    expect(chat.messages).toHaveLength(count);
  });

  it("deploy() and undeploy() go through the manifest api", async () => {
    platform.route("POST", "cli/deploy/LLMClient/", { json: { message: "deployed" } });
    platform.route("POST", "cli/undeploy/LLMClient/", { json: { message: "undeployed" } });
    expect((await platform.client.llmClients.deploy("calculator")).message).toBe("deployed");
    expect((await platform.client.llmClients.undeploy("calculator")).message).toBe("undeployed");
  });

  it("a resource's apply() refuses a manifest of another kind", async () => {
    const guardrail = (loadJson("example_guardrail") as { data: Json }).data;
    await expect(platform.client.llmClients.apply(guardrail)).rejects.toBeInstanceOf(SmarterValueError);
  });
});
