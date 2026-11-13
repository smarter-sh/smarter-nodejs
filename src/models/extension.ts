/**
 * Models of the platform's extensions and of the extension registry, as `/api/v1/extensions/` returns them.
 *
 * An extension is a Python package that adds tools to the LLMClients that use it, e.g. `weather`. It is
 * installed from the registry or from an uploaded .zip archive, configured and enabled by a superuser,
 * and made available to every account or to some of them. These models are of the platform's
 * extensions. An LLMClient's own list of the extensions that it uses is {@link LLMClientExtension}.
 */

import { z } from "zod";

import { JsonValue } from "../core/typing.ts";

/** The value of an extension's setting that is not a secret. */
export const ExtensionSettingValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type ExtensionSettingValue = z.infer<typeof ExtensionSettingValue>;

/** What every view of an installed extension has: its identity, source, trust badge, state and versions. */
export const ExtensionSummary = z.looseObject({
  id: z.number().int(),
  /** The extension's slug, e.g. `weather`. */
  slug: z.string(),
  displayName: z.string(),
  description: z.string().nullish(),
  /** The publisher's registry id, or an uploaded archive's authors. */
  publisher: z.string().nullish(),
  /** registry or upload. */
  source: z.string().nullish(),
  /** official, verified, community or unverified. */
  trustBadge: z.string().nullish(),
  /** The badge, as people read it, e.g. `Official Smarter Extension`. */
  trustBadgeLabel: z.string().nullish(),
  enabled: z.boolean(),
  installedVersion: z.string().nullish(),
  /** The newest compatible version in the registry. */
  latestVersion: z.string().nullish(),
  updateAvailable: z.boolean().nullish(),
  latestCheckedAt: z.string().nullish(),
  /** The last error from loading the extension or running its lifecycle hooks, or an empty string. */
  error: z.string().nullish(),
  /** The url of the extension's page in the web console. */
  detailUrl: z.string().nullish(),
});
export type ExtensionSummary = z.infer<typeof ExtensionSummary>;

/** A tool that an extension offers the LLM. */
export const ExtensionTool = z.looseObject({
  /** The tool's name in the extension, e.g. `get_weather`. */
  name: z.string(),
  /** The name that the LLM sees, e.g. `ext_weather_get_weather`. */
  functionName: z.string(),
  description: z.string().nullish(),
  /** The JSON Schema of the tool's arguments. */
  parameters: JsonValue.nullish(),
});
export type ExtensionTool = z.infer<typeof ExtensionTool>;

/** One of an extension's settings, and its state. */
export const ExtensionSetting = z.looseObject({
  name: z.string(),
  /** string, integer, float, boolean, url, choice or secret. */
  type: z.string(),
  description: z.string().nullish(),
  required: z.boolean().nullish(),
  default: ExtensionSettingValue.nullish(),
  /** The values of a `choice` setting. */
  choices: z.array(z.string()).nullish(),
  /** The configured value. Always null for a secret setting. */
  value: ExtensionSettingValue.nullish(),
  /** The id of a secret setting's Secret. */
  secretId: z.number().int().nullish(),
  /** The name of a secret setting's Secret. */
  secretName: z.string().nullish(),
  /** Whether the setting has a configured value, or a Secret. */
  isSet: z.boolean().nullish(),
});
export type ExtensionSetting = z.infer<typeof ExtensionSetting>;

/** An installed version of an extension. */
export const ExtensionVersion = z.looseObject({
  id: z.number().int(),
  version: z.string(),
  sha256: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  /** The username of the superuser who installed it. Null for a user who is not a superuser. */
  installedBy: z.string().nullish(),
  createdAt: z.string().nullish(),
  /** Whether it is the version that runs. */
  isInstalled: z.boolean().nullish(),
});
export type ExtensionVersion = z.infer<typeof ExtensionVersion>;

/** A resource that an extension created from its manifests, e.g. a Plugin. */
export const ExtensionResource = z.looseObject({
  kind: z.string(),
  name: z.string(),
  /** The username of the resource's owner. */
  owner: z.string().nullish(),
  /** The extension version that created or last applied it. */
  version: z.string().nullish(),
  /** Whether it came from the package's `manifests/` directory. */
  managed: z.boolean().nullish(),
});
export type ExtensionResource = z.infer<typeof ExtensionResource>;

/** A waffle switch that an extension declares. */
export const ExtensionSwitch = z.looseObject({
  /** The switch's full name, e.g. `ext_weather_verbose`. */
  name: z.string(),
  description: z.string().nullish(),
  active: z.boolean().nullish(),
});
export type ExtensionSwitch = z.infer<typeof ExtensionSwitch>;

/** An account that may use an extension. */
export const ExtensionAccount = z.looseObject({
  id: z.number().int(),
  accountNumber: z.string(),
  companyName: z.string().nullish(),
});
export type ExtensionAccount = z.infer<typeof ExtensionAccount>;

/** One of the platform admin's Secrets, which a secret setting may use. */
export const ExtensionSecretRef = z.looseObject({
  id: z.number().int(),
  name: z.string(),
});
export type ExtensionSecretRef = z.infer<typeof ExtensionSecretRef>;

/**
 * Everything about an installed extension: its documentation, tools, settings, versions, resources,
 * switches and availability.
 *
 * A user who is not a superuser gets `settings`, `accounts` and `availableSecrets` as empty lists,
 * and each version's `installedBy` as null.
 */
export const ExtensionDetail = ExtensionSummary.extend({
  homepage: z.string().nullish(),
  license: z.string().nullish(),
  /** The extension's documentation, as HTML rendered safely. */
  docsHtml: z.string().nullish(),
  /** Why the extension's code does not load, if it does not. */
  loadError: z.string().nullish(),
  tools: z.array(ExtensionTool).default([]),
  settings: z.array(ExtensionSetting).default([]),
  /** Required settings that block enabling the extension. */
  missingSettings: z.array(z.string()).default([]),
  versions: z.array(ExtensionVersion).default([]),
  resources: z.array(ExtensionResource).default([]),
  switches: z.array(ExtensionSwitch).default([]),
  /** Whether every account may use it. */
  allAccounts: z.boolean().nullish(),
  /** The accounts that may use it, when not every account may. */
  accounts: z.array(ExtensionAccount).default([]),
  /** The platform admin's Secrets, for secret settings. */
  availableSecrets: z.array(ExtensionSecretRef).default([]),
});
export type ExtensionDetail = z.infer<typeof ExtensionDetail>;

/** The installed extensions that the user may see, and the state of the registry. */
export const ExtensionList = z.looseObject({
  objects: z.array(ExtensionSummary).default([]),
  /** Whether the registry's public key is configured. */
  registryEnabled: z.boolean().nullish(),
  /** How many installed extensions have an update in the registry. */
  updatesAvailable: z.number().int().nullish(),
});
export type ExtensionList = z.infer<typeof ExtensionList>;

/** The response of `GET extensions/<slug>/`, which {@link Extensions.retrieve} unwraps. */
export const ExtensionDetailResponse = z.looseObject({ extension: ExtensionDetail });
export type ExtensionDetailResponse = z.infer<typeof ExtensionDetailResponse>;

/** A released version of an extension in the registry. */
export const ExtensionRegistryVersion = z.looseObject({
  version: z.string(),
  /** The Smarter versions that it supports, e.g. `>=0.27`. */
  requiresSmarter: z.string().nullish(),
  releasedAt: z.string().nullish(),
  /** Whether it works with this platform's Smarter version. */
  compatible: z.boolean(),
});
export type ExtensionRegistryVersion = z.infer<typeof ExtensionRegistryVersion>;

/** An extension of the registry, and what it offers on this platform. */
export const ExtensionRegistryItem = z.looseObject({
  slug: z.string(),
  displayName: z.string(),
  description: z.string().nullish(),
  /** The publisher's name. */
  publisher: z.string().nullish(),
  publisherUrl: z.string().nullish(),
  /** official, verified, community or unverified. */
  trustBadge: z.string().nullish(),
  trustBadgeLabel: z.string().nullish(),
  homepage: z.string().nullish(),
  license: z.string().nullish(),
  /** The extension's documentation, as HTML rendered safely. */
  docsHtml: z.string().nullish(),
  /** The newest version compatible with this platform. */
  latestVersion: z.string().nullish(),
  /** Every released version, newest first. */
  versions: z.array(ExtensionRegistryVersion).default([]),
  installedVersion: z.string().nullish(),
  /** What the platform offers: install, update, installed, uploaded or incompatible. */
  action: z.string(),
  /** The installed extension's page in the web console, if it is installed. */
  detailUrl: z.string().nullish(),
});
export type ExtensionRegistryItem = z.infer<typeof ExtensionRegistryItem>;

/** The registry's extensions. */
export const ExtensionRegistry = z.looseObject({
  /** Whether the registry's public key is configured. */
  enabled: z.boolean(),
  /** Why the registry cannot be read, if it cannot. */
  error: z.string().nullish(),
  objects: z.array(ExtensionRegistryItem).default([]),
});
export type ExtensionRegistry = z.infer<typeof ExtensionRegistry>;

/** The result of an action on extensions: its message, and the extension as it now is. */
export const ExtensionActionResult = z.looseObject({
  /** What the action did, e.g. `Installed Weather 0.2.1. Configure its settings, then enable it.` */
  message: z.string(),
  /** The extension, or null after an uninstall, or for an action on no one extension (check updates). */
  extension: ExtensionDetail.nullish(),
});
export type ExtensionActionResult = z.infer<typeof ExtensionActionResult>;
