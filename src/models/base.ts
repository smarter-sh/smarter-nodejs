/**
 * The base schemas of the SDK's response models.
 *
 * Every object schema is a `z.looseObject`, which keeps fields that it doesn't declare. The Smarter
 * platform adds fields to its responses in minor releases, and an SDK that rejected them would break
 * whenever the platform is upgraded (ADR-004). A parsed object's fields are the api's own names
 * (ADR-021).
 */

import { z } from "zod";

import { JsonObject } from "../core/typing.ts";

/** The user of a resource's owner. */
export const SmarterUserRef = z.looseObject({
  username: z.string(),
  email: z.string().nullish(),
});
export type SmarterUserRef = z.infer<typeof SmarterUserRef>;

/** The account of a resource's owner. */
export const SmarterAccountRef = z.looseObject({
  accountNumber: z.string(),
});
export type SmarterAccountRef = z.infer<typeof SmarterAccountRef>;

/** The owner of a resource: its user profile, as the user and the account. */
export const SmarterOwner = z.looseObject({
  user: SmarterUserRef.nullish(),
  account: SmarterAccountRef.nullish(),
});
export type SmarterOwner = z.infer<typeof SmarterOwner>;

/**
 * The fields that every Smarter resource shares, as the REST api returns them.
 *
 * The api's resources are Django rows with the same metadata as a manifest's `metadata`: a name,
 * description, version, tags and annotations. Each resource's schema adds its own fields.
 */
export const SmarterResource = z.looseObject({
  id: z.number().int(),
  hashedId: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  version: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  annotations: z.array(JsonObject).default([]),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  userProfile: SmarterOwner.nullish(),
  canDelete: z.boolean().nullish(),
  manifestUrl: z.string().nullish(),
  ready: z.boolean().nullish(),
});
export type SmarterResource = z.infer<typeof SmarterResource>;
