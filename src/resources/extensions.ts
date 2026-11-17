/**
 * Extensions: Python packages, installed on the platform, that add tools to the LLMClients that use them.
 *
 * Every user may read the extensions that their account may use. Installing, configuring, enabling and
 * the other actions are for superusers only: the platform refuses other users with a 403.
 *
 * @example
 * ```ts
 * const installed = await client.extensions.list();
 * for (const extension of installed.objects) console.log(extension.slug, extension.installedVersion);
 *
 * // a superuser installs one from the registry, configures it, then enables it
 * await client.extensions.install("weather");
 * await client.extensions.configure("weather", { secrets: { google_maps_api_key: { secretId: 6 } } });
 * await client.extensions.enable("weather");
 * ```
 */

import type { RequestOptions } from "../core/http.ts";
import type { JsonValue } from "../core/typing.ts";
import {
  ExtensionActionResult,
  ExtensionDetailResponse,
  ExtensionList,
  ExtensionRegistry,
  type ExtensionDetail,
  type ExtensionSettingValue,
} from "../models/extension.ts";
import { appendUpload, resourceId, SmarterAPIResource, type UploadInput } from "./base.ts";

/** A secret setting's new value: one of the platform admin's Secrets, a value to save in a new Secret, or neither, which clears it. */
export interface ExtensionSecretInput {
  /** The id of one of the platform admin's Secrets. */
  secretId?: number | null;
  /** A value, which the platform saves encrypted in the Secret `extension_<slug>_<setting>`. */
  value?: string | null;
}

/** New values of some of an extension's settings, by name. Settings that are left out don't change. */
export interface ExtensionSettings {
  /** Settings that are not secrets. `null` resets one to its default. */
  values?: Record<string, ExtensionSettingValue>;
  /** Secret settings. */
  secrets?: Record<string, ExtensionSecretInput>;
}

/** The platform's extensions: `/api/v1/extensions/`. */
export class Extensions extends SmarterAPIResource {
  /** The extensions' endpoint. */
  readonly path = "extensions/";

  /**
   * The installed extensions that the user may see, by display name, and the state of the registry.
   *
   * A user who is not a superuser sees only the extensions that their account may use.
   *
   * @param options - Per-request options.
   * @returns The extensions, whether the registry is enabled, and how many updates it has.
   */
  async list(options?: RequestOptions): Promise<ExtensionList> {
    return this.http.request("GET", this.path, ExtensionList, options);
  }

  /**
   * The registry's extensions, with what each offers on this platform: install, update, or nothing, and why.
   *
   * @param options - `refresh`: download the registry's index again rather than read the platform's cache. Superusers only.
   * @returns The registry's extensions, and why it cannot be read, if it cannot.
   */
  async registry(options?: RequestOptions & { refresh?: boolean }): Promise<ExtensionRegistry> {
    return this.http.request("GET", `${this.path}registry/`, ExtensionRegistry, {
      ...options,
      params: { refresh: options?.refresh ? true : undefined },
    });
  }

  /**
   * An installed extension: its documentation, tools, settings, versions, resources, switches and availability.
   *
   * A user who is not a superuser gets its `settings`, `accounts` and `availableSecrets` as empty lists.
   *
   * @param slug - The extension's slug, e.g. `weather`.
   * @param options - Per-request options.
   * @returns The extension.
   * @throws {@link NotFoundError} If it is not installed, or the user's account may not use it.
   */
  async retrieve(slug: string, options?: RequestOptions): Promise<ExtensionDetail> {
    const response = await this.http.request(
      "GET",
      `${this.path}${resourceId(slug)}/`,
      ExtensionDetailResponse,
      options,
    );
    return response.extension;
  }

  /**
   * Download the registry's index, and record each installed extension's newest compatible version. Superusers only.
   *
   * @param options - Per-request options.
   * @returns A message that names the available updates.
   * @throws {@link PermissionDeniedError} If the user is not a superuser.
   */
  async checkUpdates(options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.http.request("POST", `${this.path}check-updates/`, ExtensionActionResult, options);
  }

  /**
   * Install, or update, an extension from the registry. Superusers only.
   *
   * It is installed disabled: configure its settings with {@link Extensions.configure}, then
   * {@link Extensions.enable} it.
   *
   * @param slug - The extension's slug in the registry.
   * @param options - `version`: the version to install, the newest compatible one by default.
   * @returns A message, and the installed extension.
   * @throws {@link BadRequestError} If the registry has no such extension or version, or it is incompatible.
   * @throws {@link PermissionDeniedError} If the user is not a superuser.
   */
  async install(slug: string, options?: RequestOptions & { version?: string | null }): Promise<ExtensionActionResult> {
    const body: Record<string, JsonValue> = { slug };
    if (options?.version) body["version"] = options.version;
    return this.http.request("POST", `${this.path}install/`, ExtensionActionResult, { ...options, json: body });
  }

  /**
   * Install, or update, an extension from its .zip archive, of at most 10 MiB. Superusers only.
   *
   * It is installed disabled. Its trust badge is `unverified`.
   *
   * @param archive - The archive: its path, its `file:` url, or a `File`.
   * @param options - Per-request options.
   * @returns A message, and the installed extension.
   * @throws {@link BadRequestError} If the archive is not a valid extension.
   * @throws {@link PermissionDeniedError} If the user is not a superuser.
   */
  async upload(archive: UploadInput, options?: RequestOptions): Promise<ExtensionActionResult> {
    const form = new FormData();
    await appendUpload(form, "archive", archive);
    return this.http.request("POST", `${this.path}upload/`, ExtensionActionResult, { ...options, body: form });
  }

  /**
   * Enable an extension, after checking that it is compatible, that it loads, and that its required
   * settings are set. Its tools are then offered to the LLMClients that use it. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param options - Per-request options.
   * @returns A message, and the extension.
   * @throws {@link BadRequestError} If it can't be enabled, e.g. a required setting is missing.
   */
  async enable(slug: string, options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.#act(slug, "enable/", options);
  }

  /**
   * Disable an extension. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param options - Per-request options.
   * @returns A message, and the extension.
   */
  async disable(slug: string, options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.#act(slug, "disable/", options);
  }

  /**
   * Install the registry's newest compatible version of an extension. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param options - Per-request options.
   * @returns A message, and the extension.
   */
  async update(slug: string, options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.#act(slug, "update/", options);
  }

  /**
   * Make one of an extension's earlier installed versions the one that runs. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param versionId - The version's id, from the extension's `versions`.
   * @param options - Per-request options.
   * @returns A message, and the extension.
   */
  async rollback(slug: string, versionId: number, options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.#act(slug, "rollback/", { ...options, json: { versionId } });
  }

  /**
   * Change some of an extension's settings. Superusers only.
   *
   * A secret setting is given a value, which the platform saves encrypted in a Secret of the platform
   * admin, or one of the platform admin's Secrets, or neither, which clears it.
   *
   * @param slug - The extension's slug.
   * @param settings - `values`: the new values of settings that are not secrets. `secrets`: of secret settings.
   * @param options - Per-request options.
   * @returns A message, and the extension.
   * @throws {@link BadRequestError} If a setting is unknown, or a value is invalid.
   */
  async configure(slug: string, settings: ExtensionSettings, options?: RequestOptions): Promise<ExtensionActionResult> {
    const secrets: Record<string, JsonValue> = {};
    for (const [name, secret] of Object.entries(settings.secrets ?? {})) {
      secrets[name] = { secretId: secret.secretId ?? null, value: secret.value ?? null };
    }
    return this.#act(slug, "configure/", { ...options, json: { values: settings.values ?? {}, secrets } });
  }

  /**
   * Make an extension available to every account, or to the given accounts only. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param allAccounts - True for every account.
   * @param options - `accountIds`: the ids of the accounts that may use it, when not every account may.
   * @returns A message, and the extension.
   * @throws {@link BadRequestError} If some of the accounts do not exist.
   */
  async setAvailability(
    slug: string,
    allAccounts: boolean,
    options?: RequestOptions & { accountIds?: readonly number[] },
  ): Promise<ExtensionActionResult> {
    return this.#act(slug, "availability/", {
      ...options,
      json: { allAccounts, accountIds: [...(options?.accountIds ?? [])] },
    });
  }

  /**
   * Uninstall an extension, and delete its versions and settings. Superusers only.
   *
   * @param slug - The extension's slug.
   * @param options - Per-request options.
   * @returns A message. Its `extension` is null.
   */
  async uninstall(slug: string, options?: RequestOptions): Promise<ExtensionActionResult> {
    return this.#act(slug, "uninstall/", options);
  }

  async #act(
    slug: string,
    action: string,
    input?: RequestOptions & { json?: JsonValue },
  ): Promise<ExtensionActionResult> {
    return this.http.request("POST", `${this.path}${resourceId(slug)}/${action}`, ExtensionActionResult, input);
  }
}
