/** Test src/resources/providers.ts and src/resources/proxies.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { API, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("Providers and Proxies", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists and retrieves providers, with their models", async () => {
    platform.route("GET", "providers/", { json: [{ name: "openai", baseUrl: "https://api.openai.com/v1/" }] });
    platform.route("GET", "providers/openai/", { json: { name: "openai", isActive: true } });
    platform.route("GET", "providers/openai/models/", { json: [{ name: "gpt-4o-mini", supportsTools: true }] });
    expect((await platform.client.providers.list())[0]?.baseUrl).toBe("https://api.openai.com/v1/");
    expect((await platform.client.providers.retrieve("openai")).isActive).toBe(true);
    expect((await platform.client.providers.models("openai"))[0]?.supportsTools).toBe(true);
  });

  it("lists proxies, and gives a proxy's base url for a provider's own SDK", async () => {
    platform.route("GET", "proxy/", { fixture: "proxy" });
    expect((await platform.client.proxies.list())[0]?.allowedPaths.length).toBeGreaterThan(0);
    expect(platform.client.proxies.baseUrl("openai")).toBe(`${API}proxy/openai/`);
  });

  it("request() sends the provider's request through the proxy", async () => {
    platform.route("POST", "proxy/openai/v1/chat/completions", { json: { id: "chatcmpl-1" } });
    expect(await platform.client.proxies.request("openai", "/v1/chat/completions", { json: { model: "m" } })).toEqual({
      id: "chatcmpl-1",
    });
    expect(await platform.requestJson()).toEqual({ model: "m" });
    platform.route("GET", "proxy/openai/v1/models", { json: { data: [] } });
    expect(
      await platform.client.proxies.request("openai", "v1/models", { method: "get", params: { limit: 1 } }),
    ).toEqual({ data: [] });
    expect(new URL(platform.lastRequest.url).searchParams.get("limit")).toBe("1");
  });
});
