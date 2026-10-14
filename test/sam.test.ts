/** Test src/models/sam: the generated SAM types and schemas. */

import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { Manifest, SAM_KINDS, SAM_SCHEMAS } from "../src/index.ts";
import { DATA, loadJson } from "./helpers.ts";

const SAM_DATA = join(DATA, "sam");

describe("SAM types", () => {
  it("there is a type and schema of every kind whose schema was saved, and only of those", () => {
    const kinds = readdirSync(SAM_DATA)
      .filter((name) => name.endsWith(".schema.json"))
      .map((name) => name.split(".")[0])
      .sort();
    expect([...SAM_KINDS].sort()).toEqual(kinds);
    expect(Object.keys(SAM_SCHEMAS).sort()).toEqual(kinds);
    expect(kinds.length).toBeGreaterThanOrEqual(20);
  });

  it("every kind's example manifest validates against its schema, and keeps its kind and name", () => {
    for (const kind of SAM_KINDS) {
      const example = loadJson(`sam/${kind}.example`) as { metadata: { name: string } };
      const typed = Manifest.parse(example).toSam(kind);
      expect(typed.kind).toBe(kind);
      expect(typed.metadata.name).toBe(example.metadata.name);
    }
  });

  it("the schemas are tolerant: an unknown field doesn't fail validation", () => {
    const example = loadJson("sam/Guardrail.example") as { spec: Record<string, unknown> };
    const manifest = Manifest.parse({
      ...example,
      spec: { ...example.spec, fieldOfANewerPlatform: 1 },
      newSection: {},
    });
    expect(manifest.toSam("Guardrail")["newSection"]).toEqual({});
    expect(JSON.stringify(SAM_SCHEMAS)).not.toContain('"additionalProperties":false');
  });
});
