/** Test src/resources/guardrails.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { BadRequestError } from "../src/index.ts";
import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("Guardrails", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists guardrails with their own fields", async () => {
    platform.route("GET", "guardrails/", { fixture: "guardrails" });
    const guardrail = (await platform.client.guardrails.list())[0];
    expect(guardrail?.stage).toBe("output");
    expect(guardrail?.config).toEqual({ detectors: ["credit_card", "us_ssn", "email", "phone_number", "iban"] });
  });

  it("evaluate() sends the text and stage, and returns the findings", async () => {
    platform.route("POST", "guardrails/17/evaluate/", { fixture: "guardrail_eval" });
    const result = await platform.client.guardrails.evaluate(17, "my email is jane@example.com", { stage: "output" });
    expect(result.triggered).toBe(true);
    expect(result.findings[0]?.matches[0]?.label).toBe("email");
    expect(await platform.requestJson()).toEqual({ text: "my email is jane@example.com", stage: "output" });
    await platform.client.guardrails.evaluate(17, "hi");
    expect(await platform.requestJson()).toEqual({ text: "hi", stage: "input" });
  });

  it("throws the platform's validation error with its message", async () => {
    platform.route("POST", "guardrails/17/evaluate/", { status: 400, json: { error: "text is required." } });
    const error = await platform.client.guardrails.evaluate(17, "").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as BadRequestError).message).toBe("text is required.");
  });

  it("events() passes its filters as query parameters", async () => {
    platform.route("GET", "guardrails/17/events/", { fixture: "guardrail_events" });
    const events = await platform.client.guardrails.events(17, { reviewed: false, disposition: "blocked" });
    expect(events.guardrail).toBe("pii_leak_output");
    expect(Object.fromEntries(new URL(platform.lastRequest.url).searchParams)).toEqual({
      reviewed: "false",
      disposition: "blocked",
    });
    await platform.client.guardrails.events(17);
    expect(new URL(platform.lastRequest.url).search).toBe("");
  });

  it("describe, delete, exampleManifest and jsonSchema use the Guardrail kind", async () => {
    const example = (loadJson("example_guardrail") as { data: unknown }).data;
    platform.route("POST", "cli/describe/Guardrail/", { json: { data: example } });
    platform.route("POST", "cli/delete/Guardrail/", { json: { message: "deleted" } });
    platform.route("POST", "cli/example-manifest/Guardrail/", { fixture: "example_guardrail" });
    platform.route("POST", "cli/json-schema/Guardrail/", { fixture: "schema_secret" });
    platform.route("POST", "cli/apply/", { json: { message: "applied" } });
    expect((await platform.client.guardrails.describe("x")).kind).toBe("Guardrail");
    expect((await platform.client.guardrails.delete("x")).message).toBe("deleted");
    const manifest = await platform.client.guardrails.exampleManifest();
    expect((await platform.client.guardrails.apply(manifest)).message).toBe("applied");
    expect(await platform.client.guardrails.jsonSchema()).toBeTruthy();
  });
});
