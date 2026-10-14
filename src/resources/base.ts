/**
 * The base classes of the SDK's api resources.
 *
 * Each resource family (LLMClients, Guardrails, ...) is a class whose methods send requests through
 * the client's {@link SmarterHttpClient}. Writes go through the manifest api, exactly as the
 * `smarter` cli sends them, so that the platform validates them and applies its business rules. The
 * REST endpoints are used to read resources, and for actions that the manifest api has no verb for,
 * such as evaluating a Guardrail or calling an MCP tool (ADR-003).
 */

import { z } from "zod";

import { ResourceNotFoundError, SmarterValueError } from "../core/errors.ts";
import type { RequestOptions, SmarterHttpClient } from "../core/http.ts";
import type { JsonObject, SmarterId } from "../core/typing.ts";
import type { SmarterJournalMessage } from "../models/journal.ts";
import { toManifest, type Manifest, type ManifestInput } from "../models/manifest.ts";
import type { Manifests } from "./manifests.ts";

/** What a resource needs of its client: the transport, and the manifest api. */
export interface ResourceClient {
  /** The http transport. */
  readonly http: SmarterHttpClient;
  /** The manifest api. */
  readonly manifests: Manifests;
}

/**
 * A resource id as a url path segment.
 *
 * @param value - The resource's integer id, or its hashed id.
 * @returns The id, as text.
 * @throws {@link SmarterValueError} If the id is empty, or contains a slash.
 */
export function resourceId(value: SmarterId): string {
  const text = String(value).trim();
  if (!text || text.includes("/")) throw new SmarterValueError(`Invalid resource id: ${JSON.stringify(value)}`);
  return encodeURIComponent(text);
}

/** A group of api operations. */
export class SmarterAPIResource {
  protected readonly client: ResourceClient;

  /**
   * @param client - The client whose requests the operations send.
   */
  constructor(client: ResourceClient) {
    this.client = client;
  }

  /** The client's http transport. */
  protected get http(): SmarterHttpClient {
    return this.client.http;
  }
}

/** A resource whose `name` can be found. */
interface Named {
  name: string;
}

/**
 * The operations of one resource kind, e.g. Guardrail.
 *
 * Subclasses set {@link SmarterKindResource.kind}, the manifest kind, {@link SmarterKindResource.path},
 * the REST list endpoint, and {@link SmarterKindResource.model}, the schema of a resource. They get:
 *
 * - `list()`, `retrieve()` and `find()`, from the REST api, and
 * - `apply()`, `describe()`, `delete()`, `exampleManifest()` and `jsonSchema()`, from the manifest api.
 */
export abstract class SmarterKindResource<M extends z.ZodType<Named>> extends SmarterAPIResource {
  /** The manifest kind, e.g. `Guardrail`. */
  abstract readonly kind: string;
  /** The REST list endpoint, relative to the api's base url, e.g. `guardrails/`. */
  abstract readonly path: string;
  /** The schema of one resource. */
  abstract readonly model: M;

  /**
   * Every resource of this kind that the api key's user may read.
   *
   * @param options - Per-request options.
   * @returns The resources.
   */
  async list(options?: RequestOptions): Promise<z.output<M>[]> {
    return this.http.request("GET", this.path, z.array(this.model), options);
  }

  /**
   * One resource, by its id or hashed id.
   *
   * @param id - The resource's integer id, or its hashed id.
   * @param options - Per-request options.
   * @returns The resource.
   * @throws {@link NotFoundError} If it does not exist, or the user may not read it.
   */
  async retrieve(id: SmarterId, options?: RequestOptions): Promise<z.output<M>> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/`, this.model, options);
  }

  /**
   * One resource, by its name.
   *
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The first resource of that name that the user may read.
   * @throws {@link ResourceNotFoundError} If there is none.
   */
  async find(name: string, options?: RequestOptions): Promise<z.output<M>> {
    for (const item of await this.list(options)) {
      if (item.name === name) return item;
    }
    throw new ResourceNotFoundError(`${this.kind} ${JSON.stringify(name)} not found.`);
  }

  /**
   * Create or update a resource of this kind from its manifest.
   *
   * @param manifest - The manifest.
   * @param options - Per-request options.
   * @returns The platform's response, whose `message` says what was applied.
   * @throws {@link SmarterValueError} If the manifest is of another kind.
   */
  async apply(manifest: ManifestInput, options?: RequestOptions): Promise<SmarterJournalMessage> {
    const parsed = toManifest(manifest);
    if (parsed.kind !== this.kind) {
      throw new SmarterValueError(`Expected a ${this.kind} manifest, not ${parsed.kind}.`);
    }
    return this.client.manifests.apply(parsed, options);
  }

  /**
   * A resource's manifest, with its read-only `status`.
   *
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The manifest.
   */
  async describe(name: string, options?: RequestOptions): Promise<Manifest> {
    return this.client.manifests.describe(this.kind, name, options);
  }

  /**
   * Permanently delete a resource.
   *
   * @param name - The resource's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  async delete(name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.client.manifests.delete(this.kind, name, options);
  }

  /**
   * A valid example manifest of this kind, to start from.
   *
   * @param options - Per-request options.
   * @returns The manifest.
   */
  async exampleManifest(options?: RequestOptions): Promise<Manifest> {
    return this.client.manifests.exampleManifest(this.kind, options);
  }

  /**
   * The JSON Schema of this kind's manifest.
   *
   * @param options - Per-request options.
   * @returns The schema.
   */
  async jsonSchema(options?: RequestOptions): Promise<JsonObject> {
    return this.client.manifests.jsonSchema(this.kind, options);
  }
}
