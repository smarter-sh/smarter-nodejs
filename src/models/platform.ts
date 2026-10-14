/** Models of the platform's own endpoints: `whoami`, `version` and `status`. */

import { z } from "zod";

import { JsonObject } from "../core/typing.ts";
import { Account, User } from "./account.ts";

/** The owner of the api key: the user, their account, and the platform's environment. */
export const WhoAmI = z.looseObject({
  user: User,
  account: Account,
  /** The platform's environment, e.g. `local` or `prod`. */
  environment: z.string().nullish(),
});
export type WhoAmI = z.infer<typeof WhoAmI>;

/** The platform's version, and the versions of its main Python packages. */
export const ApiVersion = z.looseObject({
  /** The Smarter platform's semantic version. */
  version: z.string(),
  /** Python package versions, by package. */
  python: z.record(z.string(), z.string().nullable()).default({}),
});
export type ApiVersion = z.infer<typeof ApiVersion>;

/** The version of the smarter cli that the platform recommends. */
export const CliVersion = z.looseObject({ version: z.string().nullish() });
export type CliVersion = z.infer<typeof CliVersion>;

/** The response of `version`. */
export const PlatformVersion = z.looseObject({
  api: ApiVersion,
  cli: CliVersion.nullish(),
});
export type PlatformVersion = z.infer<typeof PlatformVersion>;

/**
 * The response of `status`: the state of the platform's infrastructure and compute.
 *
 * The sections' contents depend on how the platform is hosted, so they are JSON objects.
 */
export const PlatformStatus = z.looseObject({
  infrastructures: JsonObject.default({}),
  compute: JsonObject.default({}),
});
export type PlatformStatus = z.infer<typeof PlatformStatus>;
