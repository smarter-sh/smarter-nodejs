/**
 * The manifest api: the brokered, journaled `/api/v1/cli/` endpoints that the `smarter` cli uses.
 *
 * Every resource kind is managed through the same verbs: `apply`, `validate`, `get`, `describe`,
 * `delete`, `deploy`, `undeploy` and `logs`. The kind's broker on the platform validates the manifest
 * with its Pydantic models and applies its business rules, so this is the only way that the SDK
 * writes resources.
 *
 * @example
 * ```ts
 * import { Smarter } from "@smarter.sh/api";
 *
 * const client = new Smarter();
 * await client.manifests.apply("guardrail.yaml");
 * const manifest = await client.manifests.describe("Guardrail", "pii_redactor");
 * await client.manifests.delete("Guardrail", "pii_redactor");
 * ```
 */

import { SmarterValueError } from "../core/errors.ts";
import type { RequestOptions } from "../core/http.ts";
import { JsonObject } from "../core/typing.ts";
import { SmarterJournaledResponse, SmarterJournalMessage } from "../models/journal.ts";
import {
  Manifest,
  ManifestData,
  ManifestList,
  ManifestValidation,
  toManifest,
  withNames,
  type ManifestInput,
  type ManifestTable,
} from "../models/manifest.ts";
import { SmarterAPIResource } from "./base.ts";

/** The path of the manifest api, relative to the api's base url. */
export const CLI_PATH = "cli/";

/**
 * A kind as a url path segment.
 *
 * @param kind - The manifest kind, e.g. `LLMClient`.
 * @returns The kind.
 * @throws {@link SmarterValueError} If it is empty or not a single identifier.
 */
export function kindSegment(kind: string): string {
  const text = kind.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text))
    throw new SmarterValueError(`Invalid manifest kind: ${JSON.stringify(kind)}`);
  return text;
}

/** The options of {@link Manifests.get}, beside the per-request options. */
export interface ManifestGetOptions extends RequestOptions {
  /**
   * An annotation selector: only the resources whose annotations match every requirement. A
   * requirement has the syntax of a Kubernetes label selector: `key` (has the annotation), `!key`
   * (doesn't have it), `key=value` or `key!=value` (which also matches resources without the key),
   * e.g. `acme.com/crm-account-id=A-10042`. Pass an array for several requirements. An invalid
   * requirement is a {@link BadRequestError}.
   */
  annotation?: string | readonly string[] | null;
}

/** The manifest api: apply, validate, get, describe, delete, deploy, undeploy and logs, for any kind. */
export class Manifests extends SmarterAPIResource {
  /**
   * Create or update a resource from its manifest.
   *
   * The platform compares the manifest with the resource's current state and makes the changes that
   * the difference requires.
   *
   * @param manifest - The manifest: a {@link Manifest}, an object, YAML text, or the path of a YAML file.
   * @param options - Per-request options.
   * @returns The platform's response, whose `message` says what was applied.
   * @throws {@link BadRequestError} If the platform rejects the manifest.
   */
  async apply(manifest: ManifestInput, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.http.request("POST", `${CLI_PATH}apply/`, SmarterJournalMessage, {
      ...options,
      json: toManifest(manifest).toApply(),
    });
  }

  /**
   * Validate a manifest without applying it.
   *
   * @param manifest - The manifest, in any form that {@link Manifests.apply} accepts.
   * @param options - Per-request options.
   * @returns Whether it is valid, and its errors.
   */
  async validate(manifest: ManifestInput, options?: RequestOptions): Promise<ManifestValidation> {
    const response = await this.http.request(
      "POST",
      `${CLI_PATH}validate/`,
      SmarterJournaledResponse(ManifestValidation),
      {
        ...options,
        json: toManifest(manifest).toApply(),
      },
    );
    return response.data ?? { valid: false, errors: [] };
  }

  /**
   * The resources of one kind, as a table.
   *
   * @param kind - The manifest kind, e.g. `LLMClient`.
   * @param name - Only the resource of this name.
   * @param options - `annotation`: an annotation selector, e.g. `acme.com/crm-account-id=A-10042`, or an array of its requirements. And the per-request options.
   * @returns The table: `data.items` are its rows, and `names` the resources' names.
   * @throws {@link BadRequestError} If the annotation selector is invalid.
   *
   * @example
   * ```ts
   * const table = await client.manifests.get("LLMClient", null, {
   *   annotation: ["acme.com/crm-account-id=A-10042", "!acme.com/archived"],
   * });
   * console.log(table.names);
   * ```
   */
  async get(kind: string, name?: string | null, options?: ManifestGetOptions): Promise<ManifestTable> {
    const { annotation, ...requestOptions } = options ?? {};
    const response = await this.http.request(
      "POST",
      `${CLI_PATH}get/${kindSegment(kind)}/`,
      SmarterJournaledResponse(ManifestList),
      {
        ...requestOptions,
        params: { name, annotation },
      },
    );
    const result = response.data ?? ManifestList.parse({ kind });
    if (name !== undefined && name !== null) {
      // the platform's get ignores the name filter for some kinds, so it is applied here too.
      result.data.items = result.data.items.filter((item) => item["name"] === name);
      result.metadata.count = result.data.items.length;
    }
    return withNames(result);
  }

  /**
   * A resource's manifest, with its read-only `status`.
   *
   * @param kind - The manifest kind.
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The manifest, which {@link Manifests.apply} accepts as is.
   * @throws {@link NotFoundError} If the resource does not exist.
   */
  async describe(kind: string, name: string, options?: RequestOptions): Promise<Manifest> {
    const response = await this.http.request(
      "POST",
      `${CLI_PATH}describe/${kindSegment(kind)}/`,
      SmarterJournaledResponse(ManifestData),
      {
        ...options,
        params: { name },
      },
    );
    if (!response.data)
      throw new SmarterValueError(`The platform returned no manifest for ${kind} ${JSON.stringify(name)}.`);
    return new Manifest(response.data);
  }

  /**
   * Permanently delete a resource.
   *
   * @param kind - The manifest kind.
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   * @throws {@link NotFoundError} If the resource does not exist.
   */
  async delete(kind: string, name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.#command("delete", kind, name, options);
  }

  /**
   * Deploy a resource, e.g. an LLMClient on its own host name.
   *
   * This creates real infrastructure on the platform's cloud, e.g. DNS records, TLS certificates and
   * Kubernetes ingresses, which may be billable.
   *
   * @param kind - The manifest kind of a deployable resource. See `client.kinds()`.
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  async deploy(kind: string, name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.#command("deploy", kind, name, options);
  }

  /**
   * Undo a resource's deployment.
   *
   * @param kind - The manifest kind.
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  async undeploy(kind: string, name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.#command("undeploy", kind, name, options);
  }

  /**
   * A resource's logs.
   *
   * @param kind - The manifest kind.
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The platform's response: its `message`, and its `data` for the kinds that have logs.
   */
  async logs(kind: string, name: string, options?: RequestOptions): Promise<SmarterJournaledResponse<JsonObject>> {
    return this.http.request("POST", `${CLI_PATH}logs/${kindSegment(kind)}/`, SmarterJournaledResponse(JsonObject), {
      ...options,
      params: { name },
    });
  }

  /**
   * A valid example manifest of a kind, to start from.
   *
   * @param kind - The manifest kind.
   * @param options - Per-request options.
   * @returns The manifest.
   */
  async exampleManifest(kind: string, options?: RequestOptions): Promise<Manifest> {
    const response = await this.http.request(
      "POST",
      `${CLI_PATH}example-manifest/${kindSegment(kind)}/`,
      SmarterJournaledResponse(ManifestData),
      options,
    );
    if (!response.data) throw new SmarterValueError(`The platform returned no example manifest for ${kind}.`);
    return new Manifest(response.data);
  }

  /**
   * The JSON Schema of a kind's manifest, e.g. to validate manifests locally or to generate a form.
   *
   * @param kind - The manifest kind.
   * @param options - Per-request options.
   * @returns The schema (draft 2020-12).
   */
  async jsonSchema(kind: string, options?: RequestOptions): Promise<JsonObject> {
    const response = await this.http.request(
      "POST",
      `${CLI_PATH}json-schema/${kindSegment(kind)}/`,
      SmarterJournaledResponse(JsonObject),
      options,
    );
    return response.data ?? {};
  }

  #command(command: string, kind: string, name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.http.request("POST", `${CLI_PATH}${command}/${kindSegment(kind)}/`, SmarterJournalMessage, {
      ...options,
      params: { name },
    });
  }
}
