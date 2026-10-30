/**
 * The base schemas of the SDK's response models.
 *
 * Every object schema is a `z.looseObject`, which keeps fields that it doesn't declare. The Smarter
 * platform adds fields to its responses in minor releases, and an SDK that rejected them would break
 * whenever the platform is upgraded (ADR-004). A parsed object's fields are the api's own names
 * (ADR-021).
 */

import { z } from "zod";

/**
 * Annotations in the shape that the platform uses since Smarter 0.38: a map of keys to strings.
 *
 * Accepts the map, and the list of one-key maps that older manifests and platforms use, e.g.
 * `[{"acme.com/crm-account-id": "A-10042"}]`, as the platform's apply does. A key that appears more
 * than once keeps its last value. Scalar values become the string that YAML would have written:
 * `true` is `"true"`, `42` is `"42"`, a date is ISO 8601 and `null` is `""`. Lists and objects are
 * left as they are, so that the {@link Annotations} schema rejects them: the platform rejects them
 * too, and structured data belongs in a JSON string. Keys are not checked here; the platform checks
 * them when it applies a manifest.
 *
 * @param value - The annotations, as a map, a list of one-key maps, `null` or `undefined`.
 * @returns A map, or the value itself if it is neither a map nor a list of maps, for the schema to accept (`null`) or reject.
 *
 * @example
 * ```ts
 * normalizeAnnotations([{ "acme.com/active": true }]); // { "acme.com/active": "true" }
 * ```
 */
export function normalizeAnnotations(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== "object") return value;
  const pairs: [string, unknown][] = [];
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    for (const item of items) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return value;
      pairs.push(...Object.entries(item));
    }
  } else {
    pairs.push(...Object.entries(value));
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of pairs) result[key] = annotationValue(item);
  return result;
}

function annotationValue(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

/**
 * A resource's annotations, as in Kubernetes: a map of keys to string values, or `null`.
 *
 * A key is an optional DNS-subdomain prefix that names its owner, then a slash and a name of one or
 * more slash-separated segments, e.g. `acme.com/crm-account-id`. The prefix `smarter.sh` and its
 * subdomains are reserved for the platform. The legacy list of one-key maps is converted to the map
 * (see {@link normalizeAnnotations}), so that manifests written for older platforms still parse.
 *
 * @example
 * ```ts
 * const guardrail = await client.guardrails.retrieve(17);
 * guardrail.annotations?.["acme.com/crm-account-id"];
 * ```
 */
export const Annotations = z.preprocess(normalizeAnnotations, z.record(z.string(), z.string()).nullable());
export type Annotations = z.infer<typeof Annotations>;

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
  /** The resource's annotations: a map of keys to string values, e.g. `{"acme.com/crm-account-id": "A-10042"}`. */
  annotations: Annotations.nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  userProfile: SmarterOwner.nullish(),
  canDelete: z.boolean().nullish(),
  manifestUrl: z.string().nullish(),
  /** The url of the resource's detail in the web console: its manifest, the resources that it uses, and those that use it. */
  detailUrl: z.string().nullish(),
  ready: z.boolean().nullish(),
});
export type SmarterResource = z.infer<typeof SmarterResource>;
