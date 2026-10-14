/** Test src/resources/vectorstores.ts. */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { beforeEach, describe, expect, it } from "vitest";

import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

const ADDED = { documents: [{ id: 1, name: "refunds", status: "pending" }], duplicates: [], queued: false };

describe("Vectorstores", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists vectorstores, and checks a vectorstore's status", async () => {
    platform.route("GET", "vectorstores/", { fixture: "vectorstores" });
    platform.route("GET", "vectorstores/2/status/", { fixture: "vs_status" });
    expect((await platform.client.vectorstores.list())[0]?.backend).toBe("qdrant");
    expect((await platform.client.vectorstores.status(2)).status).toBe("pending");
  });

  it("deploy() and undeploy() return the vectorstore", async () => {
    const vectorstore = (loadJson("vectorstores") as { name: string }[])[0];
    platform.route("POST", "vectorstores/2/deploy/", { json: vectorstore });
    platform.route("POST", "vectorstores/2/undeploy/", { json: vectorstore });
    expect((await platform.client.vectorstores.deploy(2)).name).toBe(vectorstore?.name);
    expect((await platform.client.vectorstores.undeploy(2)).name).toBe(vectorstore?.name);
  });

  it("lists documents, adds them from a text, a url or files, and deletes them", async () => {
    platform.route("GET", "vectorstores/2/documents/", { json: { documents: ADDED.documents } });
    platform.route("POST", "vectorstores/2/documents/", { json: ADDED, status: 202 });
    platform.route("DELETE", "vectorstores/2/documents/1/", { json: { document: "refunds", status: "deleting" } });
    const vectorstores = platform.client.vectorstores;
    expect((await vectorstores.documents(2)).documents[0]?.name).toBe("refunds");
    await vectorstores.addText(2, "30 days", { name: "refunds", metadata: { topic: "refunds" } });
    expect(await platform.requestJson()).toEqual({ text: "30 days", name: "refunds", metadata: { topic: "refunds" } });
    await vectorstores.addText(2, "30 days");
    expect(await platform.requestJson()).toEqual({ text: "30 days" });
    await vectorstores.addUrl(2, "https://example.com/faq", { metadata: { a: 1 } });
    expect(await platform.requestJson()).toEqual({ url: "https://example.com/faq", metadata: { a: 1 } });
    await vectorstores.addUrl(2, "https://example.com/faq");
    expect(await platform.requestJson()).toEqual({ url: "https://example.com/faq" });
    const path = join(mkdtempSync(join(tmpdir(), "smarter-")), "handbook.txt");
    writeFileSync(path, "handbook", "utf-8");
    const added = await vectorstores.addFiles(2, [path, pathToFileURL(path), new File(["notes"], "notes.txt")]);
    expect(added.queued).toBe(false);
    const form = await platform.lastRequest.formData();
    expect(form.getAll("files").map((file) => (file as File).name)).toEqual([
      "handbook.txt",
      "handbook.txt",
      "notes.txt",
    ]);
    expect(await (form.get("files") as File).text()).toBe("handbook");
    expect((await vectorstores.deleteDocument(2, 1)).status).toBe("deleting");
  });

  it("search() sends only the options that are set", async () => {
    const results = { vectorstore: "kb", results: [{ id: "a", text: "30 days", metadata: {}, score: 0.9 }] };
    platform.route("POST", "vectorstores/2/search/", { json: results });
    expect((await platform.client.vectorstores.search(2, "refunds")).results[0]?.score).toBe(0.9);
    expect(await platform.requestJson()).toEqual({ query: "refunds", k: 4, searchType: "similarity" });
    await platform.client.vectorstores.search(2, "refunds", {
      k: 2,
      searchType: "mmr",
      fetchK: 8,
      lambdaMult: 0.5,
      scoreThreshold: 0.1,
      filter: { a: 1 },
    });
    expect(await platform.requestJson()).toEqual({
      query: "refunds",
      k: 2,
      searchType: "mmr",
      scoreThreshold: 0.1,
      fetchK: 8,
      lambdaMult: 0.5,
      filter: { a: 1 },
    });
  });

  it("lists, takes and restores snapshots", async () => {
    const snapshot = { id: 3, name: "s3", status: "ready" };
    platform.route("GET", "vectorstores/2/snapshots/", { json: { snapshots: [snapshot] } });
    platform.route("POST", "vectorstores/2/snapshots/", { json: snapshot, status: 201 });
    platform.route("POST", "vectorstores/2/snapshots/3/restore/", {
      json: { vectorstore: "kb", restored: "s3", vectorCount: 10 },
    });
    expect((await platform.client.vectorstores.snapshots(2)).snapshots[0]?.id).toBe(3);
    expect((await platform.client.vectorstores.createSnapshot(2)).name).toBe("s3");
    expect((await platform.client.vectorstores.restore(2, 3)).vectorCount).toBe(10);
  });
});
