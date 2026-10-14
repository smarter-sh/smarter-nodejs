/** Test src/resources/catalog.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { ResourceNotFoundError, SmarterValueError } from "../src/index.ts";
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
});
