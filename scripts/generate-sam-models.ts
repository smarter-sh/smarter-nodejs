/**
 * Generate the SDK's SAM types from the Smarter platform's committed JSON Schemas.
 *
 * The platform's SAM (Smarter Application Manifest) models are Pydantic models that depend on
 * Django, so the SDK cannot import them. The platform commits each kind's JSON Schema, generated from
 * those models, and an example manifest of each kind, in `smarter/smarter/apps/api/v1/contract/sam/`.
 * `scripts/sync-contracts.sh` copies them into `test/data/sam/`. This script:
 *
 * 1. makes each schema tolerant: it drops `additionalProperties: false`, so that a manifest of a
 *    newer platform, with fields this SDK doesn't know, still validates (ADR-004),
 * 2. generates `src/models/sam/<kind>.ts`, an interface `SAM<kind>` and the interfaces of its parts,
 *    with json-schema-to-typescript,
 * 3. writes `src/models/sam/schemas.ts`, the tolerant schemas, which `Manifest.toSam()` validates
 *    with Ajv, and `src/models/sam/index.ts`, which exports every kind's type.
 *
 * The tests check that every kind's example manifest validates against its schema.
 *
 * usage, from the repository root (`make sam-models` runs both):
 *
 *     scripts/sync-contracts.sh ../smarter
 *     node scripts/generate-sam-models.ts
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { compile } from "json-schema-to-typescript";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = join(ROOT, "test", "data", "sam");
const PACKAGE = join(ROOT, "src", "models", "sam");

const HEADER = (kind: string): string => `/**
 * The SAM type of the \`${kind}\` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run \`make sam-models\`. See \`src/models/sam/index.ts\`.
 */
`;

/**
 * A copy of a schema that accepts fields it doesn't declare, and names only its definitions.
 *
 * Pydantic gives every property a `title`, from which json-schema-to-typescript would make a type
 * alias per property (`Apiversion`, `Kind`, ...). Only the titles of the root and of `$defs` are kept.
 *
 * @param node - A schema, or any part of one.
 * @param named - True for the root and for the schemas directly in `$defs`, whose titles are kept.
 * @returns The tolerant copy.
 */
function tolerant(node: unknown, named = true): unknown {
  if (Array.isArray(node)) return node.map((item) => tolerant(item, false));
  if (typeof node !== "object" || node === null) return node;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "additionalProperties" && value === false) continue;
    if (key === "title" && !named && typeof value === "string") continue;
    if (key === "$defs" && typeof value === "object" && value !== null) {
      result[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([name, definition]) => [
          name,
          tolerant(definition, true),
        ]),
      );
      continue;
    }
    // the values of "properties" are schemas; the property names themselves are kept.
    if (key === "properties" && typeof value === "object" && value !== null) {
      result[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([name, property]) => [name, tolerant(property, false)]),
      );
      continue;
    }
    result[key] = tolerant(value, false);
  }
  return result;
}

/**
 * The module of a kind's type.
 *
 * @param kind - The kind, e.g. `LLMClient`.
 * @returns e.g. `llmclient`.
 */
function moduleName(kind: string): string {
  return kind.toLowerCase();
}

async function main(): Promise<void> {
  const kinds = readdirSync(DATA)
    .filter((name) => name.endsWith(".schema.json"))
    .map((name) => name.split(".")[0] ?? "")
    .sort();
  if (kinds.length === 0) throw new Error(`No schemas in ${DATA}. Run scripts/sync-contracts.sh first.`);

  rmSync(PACKAGE, { recursive: true, force: true });
  mkdirSync(PACKAGE, { recursive: true });

  const schemas: Record<string, unknown> = {};
  for (const kind of kinds) {
    const schema = tolerant(JSON.parse(readFileSync(join(DATA, `${kind}.schema.json`), "utf-8"))) as Record<
      string,
      unknown
    >;
    // the kind's own type is SAM<kind>, whatever the platform's model is called (e.g. SAMStaticPlugin for Plugin).
    schema["title"] = `SAM${kind}`;
    schemas[kind] = schema;
    const code = await compile(schema, `SAM${kind}`, {
      bannerComment: HEADER(kind),
      additionalProperties: true,
      unreachableDefinitions: false,
      strictIndexSignatures: true,
      format: false,
    });
    writeFileSync(join(PACKAGE, `${moduleName(kind)}.ts`), code);
    console.log(`generated src/models/sam/${moduleName(kind)}.ts`);
  }

  writeFileSync(
    join(PACKAGE, "schemas.ts"),
    `/**
 * The tolerant JSON Schema of every SAM kind: the platform's schema without \`additionalProperties: false\`.
 *
 * Do not edit: run \`make sam-models\`.
 */

/** The JSON Schema of each kind, by its manifest \`kind\`. */
export const SAM_SCHEMAS: Readonly<Record<string, object>> = ${JSON.stringify(schemas)};
`,
  );

  const imports = kinds.map((kind) => `import type { SAM${kind} } from "./${moduleName(kind)}.ts";`).join("\n");
  const exports = kinds.map((kind) => `export type { SAM${kind} } from "./${moduleName(kind)}.ts";`).join("\n");
  const map = kinds.map((kind) => `  ${kind}: SAM${kind};`).join("\n");
  writeFileSync(
    join(PACKAGE, "index.ts"),
    `/**
 * Typed models of every SAM (Smarter Application Manifest) kind, generated from the Smarter platform's JSON Schemas.
 *
 * Each type describes a complete manifest of its kind: \`apiVersion\`, \`kind\`, \`metadata\`, \`spec\`
 * and the read-only \`status\`. Use them to build manifests in code, with your editor's completion, or
 * to read a described manifest with typed fields:
 *
 * @example
 * \`\`\`ts
 * const manifest = await client.guardrails.describe("pii_redactor");
 * const guardrail = manifest.toSam("Guardrail");     // a SAMGuardrail
 * console.log(guardrail.spec.config.action);
 * \`\`\`
 *
 * The types keep fields that they don't declare, so that a manifest of a newer platform still
 * validates. The platform's own models also enforce business rules that a JSON Schema can't express:
 * validate a manifest with \`client.manifests.validate()\` before you rely on it.
 *
 * Do not edit: run \`make sam-models\`.
 */

${imports}

${exports}
export { SAM_SCHEMAS } from "./schemas.ts";

/** The type of each kind, by its manifest \`kind\`. */
export interface SAMKinds {
${map}
}

/** A manifest kind that the SDK has a type of. */
export type SAMKind = keyof SAMKinds;

/** Every kind that the SDK has a type of. */
export const SAM_KINDS: readonly SAMKind[] = ${JSON.stringify(kinds)};
`,
  );
}

await main();
