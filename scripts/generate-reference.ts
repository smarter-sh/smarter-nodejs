/**
 * Generate the SDK's api reference pages for the Smarter platform's Sphinx documentation.
 *
 * Sphinx can't read TypeScript, so `npm run reference` runs TypeDoc, which writes the SDK's exported
 * api and doc comments to `build/typedoc.json`, then this script writes them as Sphinx's built-in
 * JavaScript domain directives (`.. js:class::`, `.. js:method::`, `.. js:function::`), which need
 * no Sphinx extension, into `../smarter/docs/source/smarter-framework/smarter-nodejs/reference/`.
 * See ADR-012 and skills/smarter-sphinx-docs. Never edit the generated pages: fix the doc comment,
 * and regenerate.
 *
 * usage, from the repository root:
 *
 *     npm run reference [-- path of a smarter checkout, default ../smarter]
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SMARTER = resolve(ROOT, process.argv[2] ?? "../smarter");
const OUTPUT = join(SMARTER, "docs", "source", "smarter-framework", "smarter-nodejs", "reference");

// TypeDoc's reflection kinds.
const KIND = {
  function: 64,
  class: 128,
  interface: 256,
  constructor: 512,
  property: 1024,
  method: 2048,
  accessor: 262144,
  variable: 32,
  typeAlias: 2097152,
};

interface CommentPart {
  kind: string;
  text: string;
  tag?: string;
}
interface Comment {
  summary?: CommentPart[];
  blockTags?: { tag: string; name?: string; content: CommentPart[] }[];
}
interface TypeNode {
  type: string;
  name?: string;
  value?: unknown;
  types?: TypeNode[];
  elementType?: TypeNode;
  typeArguments?: TypeNode[];
  declaration?: Reflection;
  target?: unknown;
  queryType?: TypeNode;
  elements?: TypeNode[];
}
interface Reflection {
  id: number;
  name: string;
  kind: number;
  flags?: {
    isOptional?: boolean;
    isStatic?: boolean;
    isProtected?: boolean;
    isPrivate?: boolean;
    isReadonly?: boolean;
  };
  comment?: Comment;
  children?: Reflection[];
  signatures?: Reflection[];
  getSignature?: Reflection;
  parameters?: Reflection[];
  type?: TypeNode;
  sources?: { fileName: string }[];
  inheritedFrom?: unknown;
  extendedTypes?: TypeNode[];
}

const ZOD_NAMES: Record<string, string> = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBoolean: "boolean",
  ZodUnknown: "unknown",
  ZodJSONSchema: "JsonValue",
};

/** A type, as TypeScript text. Zod schemas are written as the types they validate. */
function typeText(node: TypeNode | undefined): string {
  if (node === undefined) return "unknown";
  switch (node.type) {
    case "intrinsic":
      return node.name ?? "unknown";
    case "literal":
      return JSON.stringify(node.value);
    case "array":
      return `${wrap(typeText(node.elementType))}[]`;
    case "tuple":
      return `[${(node.elements ?? []).map(typeText).join(", ")}]`;
    case "union":
      return (node.types ?? []).map(typeText).join(" | ");
    case "reflection":
      return "object";
    case "query":
      return `typeof ${typeText(node.queryType)}`;
    case "reference": {
      const name = node.name ?? "unknown";
      const args = node.typeArguments ?? [];
      if (ZOD_NAMES[name]) return ZOD_NAMES[name];
      if (name === "ZodOptional") return `${typeText(args[0])} | undefined`;
      if (name === "ZodNullable") return `${typeText(args[0])} | null`;
      if (name === "ZodDefault") return typeText(args[0]);
      if (name === "ZodArray") return `${wrap(typeText(args[0]))}[]`;
      if (name === "ZodRecord") return `Record<string, ${typeText(args[1])}>`;
      if (name === "ZodType") return typeText(args[0]);
      if (name === "ZodLiteral") return typeText(args[0]);
      if (name === "ZodObject") return "object";
      if (name === "ZodUnion" || name === "ZodDiscriminatedUnion")
        return typeText(args[0])
          .replace(/^\[|\]$/g, "")
          .replaceAll(", ", " | ");
      if (name === "ZodEnum") return "string";
      if (args.length === 0) return name;
      return `${name}<${args.map(typeText).join(", ")}>`;
    }
    default:
      return node.name ?? "unknown";
  }
}

function wrap(text: string): string {
  return text.includes(" | ") ? `(${text})` : text;
}

/** Inline comment parts as reStructuredText. */
function inline(parts: CommentPart[] | undefined): string {
  return (parts ?? [])
    .map((part) => {
      if (part.kind === "code")
        return part.text.startsWith("```") ? part.text : `\`\`${part.text.replace(/^`|`$/g, "")}\`\``;
      if (part.kind === "inline-tag") return `\`\`${part.text}\`\``;
      return part.text;
    })
    .join("");
}

/** A comment's summary and body as reStructuredText, with its examples as code blocks. */
function body(comment: Comment | undefined, indent: string): string[] {
  const lines: string[] = [];
  const text = inline(comment?.summary).trim();
  if (text) lines.push(...fence(text).split("\n"));
  for (const tag of comment?.blockTags ?? []) {
    if (tag.tag === "@example") {
      lines.push("", "**Example**", "", ...fence(inline(tag.content).trim()).split("\n"));
    } else if (tag.tag === "@deprecated") {
      lines.push("", `.. deprecated:: ${inline(tag.content).trim() || "next"}`);
    }
  }
  return lines.map((line) => (line ? indent + line : line));
}

/** Markdown code fences as reStructuredText code blocks. */
function fence(text: string): string {
  return text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, language: string, code: string) => {
    const lang = language === "ts" || language === "" ? "typescript" : language;
    return `.. code-block:: ${lang}\n\n${code
      .trimEnd()
      .split("\n")
      .map((line) => (line ? `   ${line}` : ""))
      .join("\n")}\n`;
  });
}

/** A signature's parameter, returns and throws fields. */
function fields(signature: Reflection, indent: string): string[] {
  const lines: string[] = [];
  for (const parameter of signature.parameters ?? []) {
    const description = inline(parameter.comment?.summary)
      .trim()
      .replaceAll("\n", " ");
    lines.push(`${indent}:param ${parameter.name}: ${description}`.trimEnd());
    lines.push(
      `${indent}:type ${parameter.name}: ${typeText(parameter.type)}${
        parameter.flags?.isOptional ? " | undefined" : ""
      }`,
    );
  }
  for (const tag of signature.comment?.blockTags ?? []) {
    const text = inline(tag.content).trim().replaceAll("\n", " ");
    if (tag.tag === "@returns") lines.push(`${indent}:returns: ${text}`);
    if (tag.tag === "@throws") {
      const match = /^``(\w+)``\s*(.*)$/.exec(text);
      lines.push(match ? `${indent}:throws ${match[1]}: ${match[2]}` : `${indent}:throws: ${text}`);
    }
  }
  if (signature.type) lines.push(`${indent}:rtype: ${typeText(signature.type)}`);
  return lines;
}

function signatureText(name: string, signature: Reflection): string {
  return `${name}(${(signature.parameters ?? [])
    .map((parameter) => parameter.name + (parameter.flags?.isOptional ? "?" : ""))
    .join(", ")})`;
}

function source(reflection: Reflection): string {
  return reflection.sources?.[0]?.fileName ?? reflection.signatures?.[0]?.sources?.[0]?.fileName ?? "";
}

function documented(reflection: Reflection): boolean {
  return !reflection.flags?.isPrivate && !reflection.flags?.isProtected && !reflection.name.startsWith("#");
}

/** A class or an interface, with its documented members. */
function classBlock(reflection: Reflection, directive = "js:class"): string[] {
  const constructor = reflection.children?.find((child) => child.kind === KIND.constructor)?.signatures?.[0];
  const lines = [
    `.. ${directive}:: ${constructor ? signatureText(reflection.name, constructor) : reflection.name}`,
    "",
  ];
  lines.push(...body(reflection.comment, "   "));
  const parents = (reflection.extendedTypes ?? []).map((type) => typeText(type).replace(/<.*$/, ""));
  if (parents.length > 0) lines.push("", `   Extends \`\`${parents.join("``, ``")}\`\`, and has its methods.`);
  if (constructor && (constructor.parameters ?? []).length > 0)
    lines.push("", ...fields({ ...constructor, type: undefined }, "   "));
  for (const child of reflection.children ?? []) {
    if (!documented(child) || child.kind === KIND.constructor || child.inheritedFrom) continue;
    lines.push("");
    if (child.kind === KIND.method) {
      for (const signature of child.signatures ?? []) {
        lines.push(`   .. js:method:: ${signatureText(child.name, signature)}`, "");
        lines.push(...body(signature.comment, "      "), "", ...fields(signature, "      "));
      }
    } else if (child.kind === KIND.property || child.kind === KIND.accessor) {
      const type = child.kind === KIND.accessor ? child.getSignature?.type : child.type;
      const comment = child.comment ?? child.getSignature?.comment;
      lines.push(`   .. js:attribute:: ${child.name}`, "");
      lines.push(...body(comment, "      "), "", `      :type: ${typeText(type)}`);
    }
  }
  return lines;
}

/** A Zod schema, with the fields that it declares, which are the fields of the type of the same name. */
function schemaBlock(reflection: Reflection): string[] {
  const lines = [`.. js:class:: ${reflection.name}`, ""];
  lines.push(...body(reflection.comment, "   "));
  lines.push("", "   A Zod schema, and the type of the same name that it validates.");
  const shape = reflection.type?.typeArguments?.[0]?.declaration?.children ?? [];
  for (const field of shape) {
    lines.push("", `   .. js:attribute:: ${field.name}`, "");
    lines.push(...body(field.comment, "      "), "", `      :type: ${typeText(field.type)}`);
  }
  return lines;
}

function functionBlock(reflection: Reflection): string[] {
  const lines: string[] = [];
  for (const signature of reflection.signatures ?? []) {
    lines.push(`.. js:function:: ${signatureText(reflection.name, signature)}`, "");
    lines.push(...body(signature.comment, "   "), "", ...fields(signature, "   "), "");
  }
  return lines;
}

function dataBlock(reflection: Reflection): string[] {
  return [
    `.. js:data:: ${reflection.name}`,
    "",
    ...body(reflection.comment, "   "),
    "",
    `   :type: ${typeText(reflection.type)}`,
  ];
}

/** One page: the exported objects of some source files. */
function page(title: string, intro: string, reflections: Reflection[]): string {
  const lines = [
    title,
    "=".repeat(title.length),
    "",
    ".. This page is generated by smarter-nodejs's scripts/generate-reference.ts. Do not edit it.",
    "",
    intro,
    "",
  ];
  const order = [KIND.class, KIND.function, KIND.variable, KIND.interface, KIND.typeAlias];
  const sorted = [...reflections].sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.name.localeCompare(b.name),
  );
  const schemas = new Set(
    sorted.filter((r) => r.kind === KIND.variable && typeText(r.type) === "object").map((r) => r.name),
  );
  const emitted = new Set<string>();
  for (const reflection of sorted) {
    // a name that is a value and a type (a schema, an alias) is documented once, by its value.
    if (emitted.has(reflection.name)) continue;
    emitted.add(reflection.name);
    let block: string[] = [];
    if (reflection.kind === KIND.class) block = classBlock(reflection);
    else if (reflection.kind === KIND.interface) block = classBlock(reflection, "js:class");
    else if (reflection.kind === KIND.function) block = functionBlock(reflection);
    else if (reflection.kind === KIND.variable)
      block = schemas.has(reflection.name) ? schemaBlock(reflection) : dataBlock(reflection);
    else if (reflection.kind === KIND.typeAlias) {
      block = dataBlock(reflection);
    }
    lines.push(...block.map((line) => line.trimEnd()), "");
  }
  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}

function main(): void {
  const project = JSON.parse(readFileSync(join(ROOT, "build", "typedoc.json"), "utf-8")) as Reflection;
  const exported = (project.children ?? []).filter(documented);
  const from = (...prefixes: string[]): Reflection[] =>
    exported.filter((reflection) => prefixes.some((prefix) => source(reflection).startsWith(prefix)));
  const pages: Record<string, [string, string, Reflection[]]> = {
    client: [
      "Client",
      "The client, ``new Smarter({...})``, and its options. See :doc:`../configuration`.",
      from("src/client.ts", "src/version.ts"),
    ],
    resources: [
      "Resources",
      "The client's resource families, e.g. ``client.guardrails``. Every method returns a promise. See :doc:`../resources`.",
      from("src/resources/"),
    ],
    models: [
      "Models",
      "The Zod schemas, and types, of the REST api's responses, and the ``Manifest`` class. See :doc:`../models`.",
      from(
        "src/models/base.ts",
        "src/models/account.ts",
        "src/models/guardrail.ts",
        "src/models/llmclient.ts",
        "src/models/llmhost.ts",
        "src/models/manifest.ts",
        "src/models/mcpclient.ts",
        "src/models/misc.ts",
        "src/models/platform.ts",
        "src/models/plugin.ts",
        "src/models/vectorstore.ts",
      ),
    ],
    contracts: [
      "Contracts",
      "The mirrors of the platform's api contracts: the Smarter Chat api (version 2), the Smarter Journal, and the Django-React integration.",
      from("src/models/chat.ts", "src/models/journal.ts", "src/models/react.ts"),
    ],
    sam: [
      "SAM Types",
      "A TypeScript type of every SAM manifest kind, generated from the platform's JSON Schemas. ``manifest.toSam(kind)`` returns one. See :doc:`../models`.",
      from("src/models/sam/"),
    ],
    core: [
      "Core",
      "Configuration, errors, the http transport, logging, Server-Sent Events, and type aliases.",
      from("src/core/"),
    ],
  };
  rmSync(OUTPUT, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });
  for (const [name, [title, intro, reflections]] of Object.entries(pages)) {
    writeFileSync(join(OUTPUT, `${name}.rst`), page(title, intro, reflections));
    console.log(`generated ${join(OUTPUT, `${name}.rst`)} (${String(reflections.length)} objects)`);
  }
}

main();
