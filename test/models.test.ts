/** Test src/models: the base schemas, manifests, the chat helpers and the React contract. */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  KindInfo,
  Manifest,
  ManifestList,
  PromptChatApiPromptResponse,
  PromptChatApiPromptResult,
  ReactAppAssets,
  SmarterResource,
  SmarterValueError,
  ViteManifest,
  manifestNames,
  messageText,
  promptText,
  withPromptText,
} from "../src/index.ts";
import { loadJson } from "./helpers.ts";

const data = (name: string): unknown => (loadJson(name) as { data: unknown }).data;

describe("base schemas", () => {
  it("a resource keeps the fields it doesn't declare, with the api's own names", () => {
    const resource = SmarterResource.parse({ id: 1, name: "a", hashedId: "h", newField: 2 });
    expect(resource.hashedId).toBe("h");
    expect(resource["newField"]).toBe(2);
    expect(JSON.parse(JSON.stringify(resource))).toMatchObject({ hashedId: "h", newField: 2 });
  });
});

describe("Manifest", () => {
  it("parses YAML and JSON text, and nothing else", () => {
    const manifest = Manifest.fromYaml("apiVersion: smarter.sh/v1\nkind: Secret\nmetadata:\n  name: s\nspec: {}\n");
    expect(manifest.kind).toBe("Secret");
    expect(Manifest.fromYaml(JSON.stringify(manifest)).metadata.name).toBe("s");
    for (const text of ["- a list", "key: [unclosed", "kind: Secret"]) {
      expect(() => Manifest.fromYaml(text)).toThrow(SmarterValueError);
    }
  });

  it("round-trips through a YAML file, without its status, and keeps unknown fields", () => {
    const manifest = Manifest.parse({ ...(data("describe_llmclient") as object), extra: { a: 1 } });
    const path = join(mkdtempSync(join(tmpdir(), "smarter-")), "llmclient.yaml");
    writeFileSync(path, manifest.toYaml(), "utf-8");
    const loaded = Manifest.fromFile(path);
    expect(loaded.status).toBeUndefined();
    expect(loaded.spec).toEqual(manifest.spec);
    expect(loaded.toJSON()["extra"]).toEqual({ a: 1 });
    expect(manifest.toJSON()).toHaveProperty("status");
    expect(manifest.toApply()).not.toHaveProperty("status");
  });

  it("toSam() validates a manifest against its kind's schema", () => {
    const manifest = Manifest.parse(data("describe_llmclient"));
    const typed = manifest.toSam("LLMClient");
    expect(typed.status?.recordLocator).toBe(manifest.status?.["recordLocator"]);
    expect(manifest.toSam().kind).toBe("LLMClient");
    expect(() => manifest.toSam("Guardrail")).toThrow(SmarterValueError);
    expect(() => Manifest.parse({ kind: "Nope", metadata: { name: "x" } }).toSam()).toThrow(/no SAM model/);
    const broken = Manifest.parse({ ...(data("describe_llmclient") as object), spec: { config: "not an object" } });
    expect(() => broken.toSam()).toThrow(/does not match/);
  });

  it("a get result's rows and names", () => {
    const result = ManifestList.parse(data("get_llmclient"));
    expect(result.data.items).toHaveLength(2);
    expect(manifestNames(result)).toHaveLength(2);
    const users = ManifestList.parse({ kind: "User", data: { items: [{ username: "u" }, { id: 1 }] } });
    expect(manifestNames(users)).toEqual(["u"]);
  });

  it("a kind is read from the platform's PascalCase keys", () => {
    const kind = KindInfo.parse((data("resources") as unknown[])[0]);
    expect(kind.APIKind).toBe("Plugin");
    expect(kind.Deployable).toBe(false);
  });
});

describe("chat helpers", () => {
  it("a message's text, from a string or from its text parts", () => {
    expect(messageText({ role: "user", content: "hi" })).toBe("hi");
    expect(messageText({ role: "assistant" })).toBe("");
    const parts = {
      role: "user",
      content: [
        { type: "text" as const, text: "a" },
        { type: "image_url" as const, image_url: { url: "data:," } },
        { type: "text" as const, text: "b" },
      ],
    };
    expect(messageText(parts)).toBe("a\n\nb");
  });

  it("a prompt's text is the last assistant message with content, as a non-enumerable getter", () => {
    const response = withPromptText(PromptChatApiPromptResponse.parse(loadJson("prompt")));
    expect(response.text).toBeTruthy();
    expect(Object.keys(response)).not.toContain("text");
    expect(withPromptText(response)).toBe(response);
    expect(promptText(PromptChatApiPromptResult.parse({ status: 200 }))).toBe("");
  });
});

describe("React contract", () => {
  const MANIFEST = {
    "index.html": { file: "assets/index.js", isEntry: true, imports: ["_x.js", "_y.js"], css: ["a.css"] },
    "_x.js": { file: "assets/x.js", imports: ["index.html"], css: ["b.css"] },
    _custom: { buildTime: "2026-10-12T01:09:47.988Z", version: "0.3.0", buildEnv: "production" },
  };

  it("a manifest.json's entry point and assets, in order, and its build information", () => {
    const manifest = ViteManifest.parse(MANIFEST);
    expect(manifest.isEmpty).toBe(false);
    expect(manifest.entryKey()).toBe("index.html");
    expect(manifest.collectAssets("index.html", "js")).toEqual(["assets/index.js", "assets/x.js"]);
    expect(manifest.collectAssets("index.html", "css")).toEqual(["a.css", "b.css"]);
    expect(manifest.buildInfo?.version).toBe("0.3.0");
    expect(Object.keys(manifest.toJSON()).sort()).toEqual(["_custom", "_x.js", "index.html"]);
    expect(ReactAppAssets.parse({ js: ["a.js"] }).css).toEqual([]);
  });

  it("a manifest without chunks is empty, and has no entry point", () => {
    const manifest = ViteManifest.parse({});
    expect(manifest.isEmpty).toBe(true);
    expect(manifest.entryKey()).toBeNull();
    expect(new ViteManifest({}).toJSON()).toEqual({});
  });
});
