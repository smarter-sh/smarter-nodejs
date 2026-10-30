/** Test src/resources/manifests.ts and src/resources/base.ts. */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { beforeEach, describe, expect, it } from "vitest";

import {
  BadRequestError,
  InternalServerError,
  Manifest,
  SmarterValueError,
  kindSegment,
  resourceId,
  toManifest,
  type SAMGuardrail,
} from "../src/index.ts";
import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

type Example = Record<string, unknown> & { metadata: { name: string } };

describe("Manifests", () => {
  let platform: MockPlatform;
  let example: Example;
  beforeEach(() => {
    platform = mockPlatform();
    example = (loadJson("example_guardrail") as { data: Example }).data;
  });

  it("apply() sends the manifest as JSON, without its status, and returns the platform's message", async () => {
    platform.route("POST", "cli/apply/", { json: { message: "applied", api: "smarter.sh/v1" } });
    const response = await platform.client.manifests.apply({ ...example, status: { x: 1 } });
    expect(response.message).toBe("applied");
    const sent = (await platform.requestJson()) as Example;
    expect(sent.metadata.name).toBe(example.metadata.name);
    expect(sent).not.toHaveProperty("status");
  });

  it("throws the platform's error for a rejected manifest", async () => {
    platform.route("POST", "cli/apply/", { status: 400, fixture: "get_bad" });
    const error = await platform.client.manifests.apply(example).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as BadRequestError).errorClass).toBe("APIV1CLIViewBadRequestError");
  });

  it("validate() returns whether the manifest is valid", async () => {
    platform.route("POST", "cli/validate/", { fixture: "validate" });
    expect((await platform.client.manifests.validate(example)).valid).toBe(true);
    platform.route("POST", "cli/validate/", { json: { message: "no data" } });
    expect((await platform.client.manifests.validate(example)).valid).toBe(false);
  });

  it("get() returns the table, and filters it by name", async () => {
    platform.route("POST", "cli/get/LLMClient/", { fixture: "get_llmclient" });
    const result = await platform.client.manifests.get("LLMClient");
    expect(result.data.items).toHaveLength(2);
    expect(JSON.stringify(result)).not.toContain('"names"');
    const name = result.names[0] ?? "";
    const filtered = await platform.client.manifests.get("LLMClient", name);
    expect(filtered.names).toEqual([name]);
    expect(filtered.metadata.count).toBe(1);
    expect(new URL(platform.lastRequest.url).searchParams.get("name")).toBe(name);
    platform.route("POST", "cli/get/LLMClient/", { json: { api: "smarter.sh/v1" } });
    expect((await platform.client.manifests.get("LLMClient")).data.items).toEqual([]);
  });

  it("get() sends an annotation selector, each requirement as a repeated annotation parameter", async () => {
    platform.route("POST", "cli/get/LLMClient/", { fixture: "get_llmclient" });
    await platform.client.manifests.get("LLMClient", null, { annotation: "acme.com/crm-account-id=A-10042" });
    let params = new URL(platform.lastRequest.url).searchParams;
    expect(params.getAll("annotation")).toEqual(["acme.com/crm-account-id=A-10042"]);
    expect(params.has("name")).toBe(false);
    await platform.client.manifests.get("LLMClient", null, {
      annotation: ["acme.com/crm-account-id", "!acme.com/archived"],
      headers: { "X-Test": "1" },
    });
    params = new URL(platform.lastRequest.url).searchParams;
    expect(params.getAll("annotation")).toEqual(["acme.com/crm-account-id", "!acme.com/archived"]);
    expect(platform.lastRequest.headers.get("X-Test")).toBe("1");
    await platform.client.manifests.get("LLMClient", null, { annotation: null });
    expect(new URL(platform.lastRequest.url).searchParams.has("annotation")).toBe(false);
  });

  it("get() throws a BadRequestError for an invalid annotation selector", async () => {
    platform.route("POST", "cli/get/Guardrail/", {
      status: 400,
      json: {
        error: {
          errorClass: "SmarterAnnotationError",
          description: "Smarter Annotation Error: Annotation key 'Bad Key' has an invalid name segment 'Bad Key'.",
          status: 400,
        },
        api: "smarter.sh/v1",
        metadata: { command: "get", thing: "Guardrail" },
      },
    });
    const error = await platform.client.manifests
      .get("Guardrail", null, { annotation: "Bad Key==" })
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as BadRequestError).errorClass).toBe("SmarterAnnotationError");
  });

  it("describe() returns the manifest, with its status", async () => {
    platform.route("POST", "cli/describe/LLMClient/", { fixture: "describe_llmclient" });
    const manifest = await platform.client.manifests.describe("LLMClient", "calculator");
    expect(manifest).toBeInstanceOf(Manifest);
    expect(manifest.metadata.name).toBe("calculator");
    expect(manifest.status).toBeTruthy();
    expect(new URL(platform.lastRequest.url).searchParams.get("name")).toBe("calculator");
  });

  it("throws the platform's error for a missing resource, and a SmarterValueError for an empty response", async () => {
    platform.route("POST", "cli/describe/LLMClient/", { status: 503, fixture: "describe_missing" });
    await expect(platform.client.manifests.describe("LLMClient", "nope")).rejects.toBeInstanceOf(InternalServerError);
    platform.route("POST", "cli/describe/LLMClient/", { json: { api: "smarter.sh/v1" } });
    await expect(platform.client.manifests.describe("LLMClient", "nope")).rejects.toBeInstanceOf(SmarterValueError);
  });

  it("delete, deploy, undeploy and logs post to their endpoints, with the name", async () => {
    for (const verb of ["delete", "deploy", "undeploy", "logs"] as const) {
      platform.route("POST", `cli/${verb}/LLMClient/`, { json: { message: verb } });
      expect((await platform.client.manifests[verb]("LLMClient", "calculator")).message).toBe(verb);
      expect(new URL(platform.lastRequest.url).searchParams.get("name")).toBe("calculator");
    }
  });

  it("exampleManifest() and jsonSchema() return the kind's example and schema", async () => {
    platform.route("POST", "cli/example-manifest/Guardrail/", { fixture: "example_guardrail" });
    platform.route("POST", "cli/json-schema/Secret/", { fixture: "schema_secret" });
    expect((await platform.client.manifests.exampleManifest("Guardrail")).kind).toBe("Guardrail");
    expect(await platform.client.manifests.jsonSchema("Secret")).toHaveProperty("properties");
    platform.route("POST", "cli/example-manifest/Guardrail/", { json: { api: "smarter.sh/v1" } });
    await expect(platform.client.manifests.exampleManifest("Guardrail")).rejects.toBeInstanceOf(SmarterValueError);
    platform.route("POST", "cli/json-schema/Secret/", { json: { api: "smarter.sh/v1" } });
    expect(await platform.client.manifests.jsonSchema("Secret")).toEqual({});
  });

  it("a kind must be a single identifier", () => {
    expect(kindSegment(" LLMClient ")).toBe("LLMClient");
    for (const kind of ["", "a/b", "a b"]) expect(() => kindSegment(kind)).toThrow(SmarterValueError);
  });
});

describe("resource helpers", () => {
  it("accept a manifest as a Manifest, a SAM object, an object, YAML text, or a file path or url", () => {
    const example = (loadJson("example_guardrail") as { data: Example }).data;
    const manifest = Manifest.parse(example);
    expect(toManifest(manifest)).toBe(manifest);
    const typed: SAMGuardrail = manifest.toSam("Guardrail");
    expect(toManifest(typed).kind).toBe("Guardrail");
    expect(toManifest(example).kind).toBe("Guardrail");
    expect(toManifest(manifest.toYaml()).kind).toBe("Guardrail");
    const path = join(mkdtempSync(join(tmpdir(), "smarter-")), "guardrail.json");
    writeFileSync(path, JSON.stringify(example), "utf-8");
    expect(toManifest(path).kind).toBe("Guardrail");
    expect(toManifest(pathToFileURL(path)).kind).toBe("Guardrail");
    expect(() => toManifest({ kind: 42 })).toThrow(SmarterValueError);
  });

  it("an id is a single path segment", () => {
    expect(resourceId(5)).toBe("5");
    expect(resourceId(" rMTAwMDAwNQx ")).toBe("rMTAwMDAwNQx");
    for (const value of ["", "a/b"]) expect(() => resourceId(value)).toThrow(SmarterValueError);
  });
});
