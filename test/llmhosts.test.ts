/** Test src/resources/llmhosts.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("LLMHosts", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists LLMHosts, and reads their status, logs, plan and report", async () => {
    platform.route("GET", "llmhosts/", { fixture: "llmhosts" });
    platform.route("GET", "llmhosts/1/status/", { fixture: "llmhost_status" });
    platform.route("GET", "llmhosts/1/logs/", { json: { llmhost: "m", logs: "line" } });
    platform.route("GET", "llmhosts/1/plan/", { fixture: "llmhost_plan" });
    platform.route("GET", "llmhosts/report/", { fixture: "llmhost_report" });
    const hosts = platform.client.llmHosts;
    expect((await hosts.list())[0]?.inferenceEngine).toBe("tei");
    expect((await hosts.status(1)).status).toBe("inactive");
    expect((await hosts.logs(1, { tail: 5 })).logs).toBe("line");
    expect(new URL(platform.lastRequest.url).searchParams.get("tail")).toBe("5");
    await hosts.logs(1);
    expect(new URL(platform.lastRequest.url).searchParams.get("tail")).toBe("200");
    expect((await hosts.plan(1)).resources[0]?.["kind"]).toBe("PersistentVolumeClaim");
    expect((await hosts.report()).totals["llmhosts"]).toBe(24);
  });

  it("deploy() and undeploy() return the state, and undeploy purges only when told to", async () => {
    const state = { llmhost: "m", status: "pending" };
    platform.route("POST", "llmhosts/1/deploy/", { json: state, status: 202 });
    platform.route("POST", "llmhosts/1/undeploy/", { json: state });
    expect((await platform.client.llmHosts.deploy(1)).status).toBe("pending");
    await platform.client.llmHosts.undeploy(1);
    expect(new URL(platform.lastRequest.url).searchParams.has("purge")).toBe(false);
    await platform.client.llmHosts.undeploy(1, { purge: true });
    expect(new URL(platform.lastRequest.url).searchParams.get("purge")).toBe("true");
  });

  it("discover() searches a catalog, and discoverManifest() drafts a manifest", async () => {
    platform.route("GET", "llmhosts/discover/", { fixture: "llmhost_discover" });
    const models = await platform.client.llmHosts.discover({ query: "minilm", limit: 2 });
    expect(models[0]?.repository).toBe("sentence-transformers/all-MiniLM-L6-v2");
    expect(Object.fromEntries(new URL(platform.lastRequest.url).searchParams)).toEqual({
      q: "minilm",
      catalog: "huggingface",
      limit: "2",
    });
    platform.route("GET", "llmhosts/discover/manifest/", { json: { manifest: loadJson("sam/LLMHost.example") } });
    const drafted = await platform.client.llmHosts.discoverManifest("sentence-transformers/all-MiniLM-L6-v2", {
      engine: "tei",
    });
    expect(drafted.kind).toBe("LLMHost");
    expect(new URL(platform.lastRequest.url).searchParams.get("engine")).toBe("tei");
  });
});
