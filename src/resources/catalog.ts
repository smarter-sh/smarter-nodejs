/** Secrets, plugins, orchestrators and vectorsearches: the kinds whose REST api only lists and reads them. */

import { ResourceNotFoundError, SmarterValueError } from "../core/errors.ts";
import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import type { SmarterJournalMessage } from "../models/journal.ts";
import { Manifest, ManifestData, toManifest, type ManifestInput } from "../models/manifest.ts";
import { Orchestrator, Secret, Vectorsearch } from "../models/misc.ts";
import { Plugin } from "../models/plugin.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** The manifest kinds of plugins. */
export const PLUGIN_KINDS: readonly string[] = [
  "Plugin",
  "ApiPlugin",
  "SkillPlugin",
  "SqlPlugin",
  "WebsearchPlugin",
  "ImageSearchPlugin",
];

/**
 * Secrets: `/api/v1/secrets/`, and the manifest api's `Secret` kind.
 *
 * The api never returns a secret's value. Create and rotate secrets with {@link Secrets.apply}.
 */
export class Secrets extends SmarterKindResource<typeof Secret> {
  readonly kind = "Secret";
  readonly path = "secrets/";
  readonly model = Secret;
}

/**
 * Plugins: `/api/v1/plugins/`, and the manifest api's plugin kinds.
 *
 * A plugin's manifest kind is its class, e.g. `ApiPlugin` or `SqlPlugin`. {@link Plugins.apply}
 * accepts any of them, and {@link Plugins.describe} and {@link Plugins.delete} look the kind up by name.
 */
export class Plugins extends SmarterKindResource<typeof Plugin> {
  readonly kind = "Plugin";
  readonly path = "plugins/";
  readonly model = Plugin;

  /**
   * Create or update a plugin from its manifest, of any plugin kind.
   *
   * @param manifest - The manifest.
   * @param options - Per-request options.
   * @returns The platform's response.
   * @throws {@link SmarterValueError} If the manifest is not a plugin's.
   */
  override async apply(manifest: ManifestInput, options?: RequestOptions): Promise<SmarterJournalMessage> {
    const parsed = toManifest(manifest);
    if (!PLUGIN_KINDS.includes(parsed.kind)) {
      throw new SmarterValueError(`Expected a plugin manifest (${PLUGIN_KINDS.join(", ")}), not ${parsed.kind}.`);
    }
    return this.client.manifests.apply(parsed, options);
  }

  /**
   * A plugin's manifest kind.
   *
   * @param name - The plugin's name.
   * @param options - Per-request options.
   * @returns e.g. `SqlPlugin`.
   */
  async kindOf(name: string, options?: RequestOptions): Promise<string> {
    return (await this.find(name, options)).kind || this.kind;
  }

  /**
   * A plugin's manifest, with its read-only `status`.
   *
   * @param name - The plugin's name.
   * @param options - Per-request options.
   * @returns The manifest.
   */
  override async describe(name: string, options?: RequestOptions): Promise<Manifest> {
    return this.client.manifests.describe(await this.kindOf(name, options), name, options);
  }

  /**
   * Permanently delete a plugin.
   *
   * @param name - The plugin's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  override async delete(name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.client.manifests.delete(await this.kindOf(name, options), name, options);
  }

  /**
   * One plugin, by its id, from the list.
   *
   * The platform's `plugins/<id>/` returns a plugin's manifest, not the plugin, so this reads the
   * list. See {@link Plugins.retrieveManifest} for the manifest.
   *
   * @param id - The plugin's integer id.
   * @param options - Per-request options.
   * @returns The plugin.
   * @throws {@link ResourceNotFoundError} If the user may read no plugin of that id.
   */
  override async retrieve(id: SmarterId, options?: RequestOptions): Promise<Plugin> {
    const plugin = (await this.list(options)).find((item) => String(item.id) === String(id));
    if (plugin === undefined) throw new ResourceNotFoundError(`Plugin ${String(id)} not found.`);
    return plugin;
  }

  /**
   * One plugin's manifest, by the plugin's id: what the Python SDK's `plugins.retrieve()` returns.
   *
   * The platform serves this only when its `ALLOW_API_GET` waffle switch is on. Otherwise it answers
   * 405: use {@link Plugins.find} or {@link Plugins.describe} instead.
   *
   * @param id - The plugin's id.
   * @param options - Per-request options.
   * @returns The plugin's manifest, whose `kind` is the plugin's, e.g. `SqlPlugin`.
   */
  async retrieveManifest(id: SmarterId, options?: RequestOptions): Promise<Manifest> {
    return new Manifest(await this.http.request("GET", `${this.path}${resourceId(id)}/`, ManifestData, options));
  }
}

/** Orchestrators: `/api/v1/orchestrators/`, and the manifest api's `Orchestrator` kind. */
export class Orchestrators extends SmarterKindResource<typeof Orchestrator> {
  readonly kind = "Orchestrator";
  readonly path = "orchestrators/";
  readonly model = Orchestrator;
}

/** Vectorsearches: `/api/v1/vectorsearches/`, and the manifest api's `Vectorsearch` kind. */
export class Vectorsearches extends SmarterKindResource<typeof Vectorsearch> {
  readonly kind = "Vectorsearch";
  readonly path = "vectorsearches/";
  readonly model = Vectorsearch;
}
