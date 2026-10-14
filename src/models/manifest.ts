/**
 * Models of Smarter Application Manifests (SAM): the YAML documents that declare every Smarter resource.
 *
 * A manifest has the same four sections as a Kubernetes manifest: `apiVersion`, `kind`, `metadata`
 * and `spec`. `describe` adds a read-only `status`. The shape of `spec` depends on the kind and the
 * platform's version, so it is a JSON object here; {@link Manifest.toSam} validates a manifest against
 * its kind's JSON Schema and returns it as its kind's generated type.
 */

import { existsSync, readFileSync, statSync } from "node:fs";

import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";

import { SmarterValueError } from "../core/errors.ts";
import { JsonObject } from "../core/typing.ts";
import { SAM_SCHEMAS, type SAMKind, type SAMKinds } from "./sam/index.ts";

/** The `apiVersion` of every Smarter manifest. */
export const SMARTER_API_VERSION = "smarter.sh/v1";

/** A manifest's `metadata`: the resource's name, and descriptive information about it. */
export const ManifestMetadata = z.looseObject({
  /** The resource's name, unique per account and kind, in snake_case. */
  name: z.string(),
  description: z.string().nullish(),
  /** The resource's semantic version, e.g. `1.0.0`. */
  version: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  /** Key-value pairs, as a list of single-key objects. */
  annotations: z.array(JsonObject).nullish(),
});
export type ManifestMetadata = z.infer<typeof ManifestMetadata>;

/** The schema of a manifest's JSON, which {@link Manifest} wraps. */
export const ManifestData = z.looseObject({
  apiVersion: z.string().default(SMARTER_API_VERSION),
  /** The resource kind, e.g. `LLMClient`. See `client.kinds()`. */
  kind: z.string(),
  metadata: ManifestMetadata,
  /** The resource's specification. */
  spec: JsonObject.default({}),
  /** Read-only state, returned by describe. */
  status: JsonObject.nullish(),
});
export type ManifestData = z.infer<typeof ManifestData>;

const validators = new Map<string, ValidateFunction>();
let ajv: Ajv2020 | undefined;

function validator(kind: string): ValidateFunction | undefined {
  const schema = SAM_SCHEMAS[kind];
  if (schema === undefined) return undefined;
  let validate = validators.get(kind);
  if (validate === undefined) {
    ajv ??= new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
    validate = ajv.compile(schema);
    validators.set(kind, validate);
  }
  return validate;
}

function withoutNulls(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined));
}

/**
 * A Smarter Application Manifest.
 *
 * Its fields are the manifest's own sections. Fields that the SDK doesn't know are kept, and written
 * back by {@link Manifest.toJSON} and {@link Manifest.toYaml}.
 *
 * @example
 * ```ts
 * const manifest = Manifest.fromFile("llmclient.yaml");
 * manifest.metadata.name;
 * manifest.spec["config"];
 * ```
 */
export class Manifest {
  /** The api version, `smarter.sh/v1`. */
  apiVersion: string;
  /** The resource kind, e.g. `LLMClient`. */
  kind: string;
  /** The resource's name and descriptive information. */
  metadata: ManifestMetadata;
  /** The resource's specification. Its fields depend on the kind. */
  spec: JsonObject;
  /** Read-only state, returned by describe. */
  status: JsonObject | null | undefined;
  readonly #extra: Record<string, unknown>;

  /**
   * @param data - The manifest's sections, validated.
   */
  constructor(data: ManifestData) {
    const { apiVersion, kind, metadata, spec, status, ...extra } = data;
    this.apiVersion = apiVersion;
    this.kind = kind;
    this.metadata = metadata;
    this.spec = spec;
    this.status = status;
    this.#extra = extra;
  }

  /**
   * Validate a manifest's JSON.
   *
   * @param data - The manifest, e.g. parsed YAML or a typed SAM object.
   * @returns The manifest.
   * @throws {@link SmarterValueError} If it is not a manifest.
   */
  static parse(data: unknown): Manifest {
    const parsed = ManifestData.safeParse(data);
    if (!parsed.success) throw new SmarterValueError(`Not a Smarter manifest: ${z.prettifyError(parsed.error)}`);
    return new Manifest(parsed.data);
  }

  /**
   * Parse a manifest from YAML (or JSON) text.
   *
   * @param text - The manifest's text.
   * @returns The manifest.
   * @throws {@link SmarterValueError} If the text is not a YAML object with a kind and metadata.
   */
  static fromYaml(text: string): Manifest {
    let document: unknown;
    try {
      document = parseYaml(text);
    } catch (err) {
      throw new SmarterValueError(`The manifest is not valid YAML: ${String(err)}`, { cause: err });
    }
    if (typeof document !== "object" || document === null || Array.isArray(document)) {
      throw new SmarterValueError("A manifest must be a YAML object with apiVersion, kind, metadata and spec.");
    }
    return Manifest.parse(document);
  }

  /**
   * Read a manifest from a YAML or JSON file.
   *
   * @param path - The file's path.
   * @returns The manifest.
   */
  static fromFile(path: string | URL): Manifest {
    return Manifest.fromYaml(readFileSync(path, "utf-8"));
  }

  /**
   * The manifest as its kind's typed SAM model, after validating it against the kind's JSON Schema.
   *
   * Pass the kind to get its type, e.g. `manifest.toSam("Guardrail")` is a `SAMGuardrail`.
   *
   * @param kind - The kind that the manifest must be. By default, its own kind.
   * @returns The manifest, typed.
   * @throws {@link SmarterValueError} If the SDK has no model of the kind, the manifest is of another
   *   kind, or it doesn't match its kind's schema.
   */
  toSam<K extends SAMKind>(kind?: K): SAMKinds[K] {
    if (kind !== undefined && kind !== this.kind) {
      throw new SmarterValueError(`Expected a ${kind} manifest, not ${this.kind}.`);
    }
    const validate = validator(this.kind);
    if (validate === undefined) throw new SmarterValueError(`The SDK has no SAM model of the ${this.kind} kind.`);
    const document = this.toJSON();
    if (this.status === undefined || this.status === null) delete document["status"];
    if (!validate(document)) {
      const errors = (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`);
      throw new SmarterValueError(`The manifest does not match the ${this.kind} schema: ${errors.join("; ")}`);
    }
    return document as unknown as SAMKinds[K];
  }

  /**
   * The manifest as JSON, with its read-only `status` and the fields that the SDK doesn't know.
   *
   * @returns The manifest's JSON.
   */
  toJSON(): Record<string, unknown> {
    return {
      apiVersion: this.apiVersion,
      kind: this.kind,
      metadata: this.metadata,
      spec: this.spec,
      ...(this.status === undefined ? {} : { status: this.status }),
      ...this.#extra,
    };
  }

  /**
   * The manifest as the api's apply and validate commands take it: without `status`, and without null sections or metadata.
   *
   * The `spec` is sent as it is, nulls included, as the Python SDK sends it.
   *
   * @returns The manifest's JSON.
   */
  toApply(): Record<string, unknown> {
    const document = this.toJSON();
    delete document["status"];
    return withoutNulls({ ...document, metadata: withoutNulls(this.metadata) });
  }

  /**
   * The manifest as YAML text, without its read-only `status`, ready to apply.
   *
   * @returns The YAML text.
   */
  toYaml(): string {
    return stringifyYaml(this.toApply());
  }
}

/** A manifest, in any form that the SDK accepts: a {@link Manifest}, an object (e.g. a typed SAM object), YAML or JSON text, or the path of a YAML or JSON file. */
export type ManifestInput = Manifest | Record<string, unknown> | string | URL;

/**
 * A manifest from any of the forms that the SDK accepts.
 *
 * A string that names an existing file is read as a file. Any other string is parsed as YAML.
 *
 * @param manifest - The manifest.
 * @returns The parsed manifest.
 * @throws {@link SmarterValueError} If it cannot be parsed.
 */
export function toManifest(manifest: ManifestInput): Manifest {
  if (manifest instanceof Manifest) return manifest;
  if (manifest instanceof URL) return Manifest.fromFile(manifest);
  if (typeof manifest === "string") {
    if (!manifest.includes("\n") && manifest.length < 1024 && existsSync(manifest) && statSync(manifest).isFile()) {
      return Manifest.fromFile(manifest);
    }
    return Manifest.fromYaml(manifest);
  }
  return Manifest.parse(manifest);
}

/** A column of a `get` result: the field's name, and its Django field type. */
export const ManifestListTitle = z.looseObject({ name: z.string(), type: z.string() });
export type ManifestListTitle = z.infer<typeof ManifestListTitle>;

/** The table of a `get` result. */
export const ManifestListData = z.looseObject({
  titles: z.array(ManifestListTitle).default([]),
  items: z.array(JsonObject).default([]),
});
export type ManifestListData = z.infer<typeof ManifestListData>;

/** The `metadata` of a `get` result. */
export const ManifestListMetadata = z.looseObject({ count: z.number().int().default(0) });
export type ManifestListMetadata = z.infer<typeof ManifestListMetadata>;

/**
 * The result of `get`: the resources of one kind, as a table.
 *
 * `data.items` are the rows, and `data.titles` their columns. The columns depend on the kind. The SDK
 * adds a non-enumerable `names` getter to the results that it returns: see {@link manifestNames}.
 */
export const ManifestList = z.looseObject({
  apiVersion: z.string().default(SMARTER_API_VERSION),
  kind: z.string(),
  name: z.string().nullish(),
  metadata: ManifestListMetadata.default({ count: 0 }),
  data: ManifestListData.default({ titles: [], items: [] }),
});
export type ManifestList = z.infer<typeof ManifestList>;

/** A `get` result, with the names of its resources. */
export type ManifestTable = ManifestList & {
  /** The names of the resources. See {@link manifestNames}. */
  readonly names: string[];
};

/**
 * The names of the resources of a `get` result: each row's `name`, or its `username` for the User kind.
 *
 * @param list - The result.
 * @returns The names.
 */
export function manifestNames(list: ManifestList): string[] {
  const names: string[] = [];
  for (const item of list.data.items) {
    const name = item["name"] ?? item["username"];
    if (typeof name === "string" || typeof name === "number") names.push(String(name));
  }
  return names;
}

/**
 * Add the non-enumerable `names` getter to a `get` result.
 *
 * @param list - The result.
 * @returns The same object, as a {@link ManifestTable}.
 */
export function withNames(list: ManifestList): ManifestTable {
  if (!Object.prototype.hasOwnProperty.call(list, "names")) {
    Object.defineProperty(list, "names", { get: () => manifestNames(list), enumerable: false, configurable: true });
  }
  return list as ManifestTable;
}

/** The result of validating a manifest, without applying it. */
export const ManifestValidation = z.looseObject({
  valid: z.boolean(),
  errors: z.array(z.json()).default([]),
});
export type ManifestValidation = z.infer<typeof ManifestValidation>;

/** A resource kind that the platform supports, as `/api/v1/cli/resources/` describes it. */
export const KindInfo = z.looseObject({
  Singular: z.string(),
  Plural: z.string(),
  /** The kind, as it appears in a manifest. */
  APIKind: z.string(),
  Display: z.string().nullish(),
  DisplayPlural: z.string().nullish(),
  /** True if the kind can be deployed. */
  Deployable: z.boolean().default(false),
});
export type KindInfo = z.infer<typeof KindInfo>;
