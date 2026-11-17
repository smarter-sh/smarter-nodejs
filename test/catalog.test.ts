/** Test src/resources/catalog.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import {
  BadRequestError,
  isRunDone,
  PaymentRequiredError,
  ResourceNotFoundError,
  SmarterError,
  SmarterValueError,
} from "../src/index.ts";
import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("catalog", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists and retrieves secrets, without their values", async () => {
    platform.route("GET", "secrets/", { fixture: "secrets" });
    platform.route("GET", "secrets/1/", { json: (loadJson("secrets") as unknown[])[0] });
    expect((await platform.client.secrets.list())[0]?.name).toBe("anthropic_api_key");
    expect((await platform.client.secrets.retrieve(1)).lastAccessed).toBeTruthy();
  });

  it("lists plugins, and describes and deletes them by their own kind", async () => {
    const plugins = loadJson("plugins") as Record<string, unknown>[];
    const plugin = plugins[0] ?? {};
    plugin["kind"] = "SqlPlugin";
    const name = String(plugin["name"]);
    platform.route("GET", "plugins/", { json: plugins });
    platform.route("GET", `plugins/${String(plugin["id"])}/`, {
      json: { apiVersion: "smarter.sh/v1", kind: "SqlPlugin", metadata: { name }, spec: {} },
    });
    platform.route("POST", "cli/describe/SqlPlugin/", { json: { data: { kind: "SqlPlugin", metadata: { name } } } });
    platform.route("POST", "cli/delete/SqlPlugin/", { json: { message: "deleted" } });
    expect(await platform.client.plugins.kindOf(name)).toBe("SqlPlugin");
    expect((await platform.client.plugins.describe(name)).kind).toBe("SqlPlugin");
    expect((await platform.client.plugins.delete(name)).message).toBe("deleted");
    const manifest = await platform.client.plugins.retrieveManifest(Number(plugin["id"]));
    expect([manifest.kind, manifest.metadata.name]).toEqual(["SqlPlugin", name]);
    expect((await platform.client.plugins.retrieve(Number(plugin["id"]))).name).toBe(name);
    await expect(platform.client.plugins.retrieve(-1)).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("apply() accepts any plugin kind, and refuses other kinds", async () => {
    platform.route("POST", "cli/apply/", { json: { message: "applied" } });
    const manifest = { kind: "ApiPlugin", metadata: { name: "p" }, spec: {} };
    expect((await platform.client.plugins.apply(manifest)).message).toBe("applied");
    await expect(platform.client.plugins.apply({ ...manifest, kind: "Secret" })).rejects.toBeInstanceOf(
      SmarterValueError,
    );
  });

  it("lists orchestrators and vectorsearches", async () => {
    platform.route("GET", "orchestrators/", { json: [] });
    platform.route("GET", "vectorsearches/", { json: [{ id: 1, name: "v" }] });
    expect(await platform.client.orchestrators.list()).toEqual([]);
    expect((await platform.client.vectorsearches.list())[0]?.name).toBe("v");
  });

  it("orchestrators.run() starts a run with its objective, and runStatus() and runs() read it with its steps", async () => {
    const run = loadJson("orchestration_run") as Record<string, unknown>;
    const pending = { ...run, status: "pending", iterationCount: 0, result: null, steps: [] };
    platform.route("POST", "orchestrators/rMTAwMDAwMQx/runs/", { status: 202, json: pending });
    platform.route("GET", "orchestrators/rMTAwMDAwMQx/runs/3/", { fixture: "orchestration_run" });
    platform.route("GET", "orchestrators/1/runs/", { json: [run] });
    const started = await platform.client.orchestrators.run("rMTAwMDAwMQx", String(run["objective"]));
    expect([started.id, started.status, isRunDone(started)]).toEqual([3, "pending", false]);
    expect(await platform.requestJson()).toEqual({ objective: run["objective"] });
    const finished = await platform.client.orchestrators.runStatus("rMTAwMDAwMQx", started.id);
    expect(isRunDone(finished)).toBe(true);
    expect(finished.result).toBe(run["result"]);
    expect([finished.steps[0]?.sequence, finished.steps[0]?.role]).toEqual([1, "executor"]);
    expect(finished.startedBy?.account?.accountNumber).toBe("1234-5678-9012");
    expect(finished.completedAt).toBeTruthy();
    expect((await platform.client.orchestrators.runs(1)).map((listed) => listed.id)).toEqual([3]);
  });

  it("orchestrators.run() is never retried: a retry would start a second run", async () => {
    platform.route("POST", "orchestrators/1/runs/", { status: 503, json: { detail: "unavailable" } });
    platform.route("POST", "orchestrators/2/runs/", {
      status: 400,
      json: { detail: "Strategy debate can't run yet." },
    });
    const client = platform.makeClient({ maxRetries: 3 });
    await expect(client.orchestrators.run(1, "Do it.")).rejects.toBeInstanceOf(SmarterError);
    expect(platform.requests).toHaveLength(1);
    await expect(client.orchestrators.run(2, "Do it.")).rejects.toBeInstanceOf(BadRequestError);
  });

  it("vectorsearches.run() sends the query, and the filter only when it has keys", async () => {
    platform.route("POST", "vectorsearches/rMTAwMDAxMgx/vectorsearch/", { fixture: "vectorsearch_run" });
    const found = await platform.client.vectorsearches.run("rMTAwMDAxMgx", "refunds", { filter: { topic: "refunds" } });
    expect(await platform.requestJson()).toEqual({ query: "refunds", filter: { topic: "refunds" } });
    expect(found.vectorstore).toBe("example_policies");
    expect(found.results[0]?.metadata?.["document"]).toBe("refunds.txt");
    expect(found.results[0]?.score).toBe(0.83);
    await platform.client.vectorsearches.run("rMTAwMDAxMgx", "refunds", { filter: {} });
    expect(await platform.requestJson()).toEqual({ query: "refunds" });
  });

  it("vectorsearches.run() throws the platform's refusals", async () => {
    platform.route("POST", "vectorsearches/1/vectorsearch/", {
      status: 400,
      json: { detail: "Vectorsearch example is disabled." },
    });
    platform.route("POST", "vectorsearches/2/vectorsearch/", { status: 402, json: { detail: "Budget exceeded." } });
    await expect(platform.client.vectorsearches.run(1, "x")).rejects.toBeInstanceOf(BadRequestError);
    const error = await platform.client.vectorsearches.run(2, "x").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(PaymentRequiredError);
    expect((error as PaymentRequiredError).statusCode).toBe(402);
    expect((error as PaymentRequiredError).message).toBe("Budget exceeded.");
  });
});
