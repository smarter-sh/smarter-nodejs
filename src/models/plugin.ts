/** Models of plugins: the tools that an LLMClient's LLM can call. */

import { z } from "zod";

import { SmarterResource } from "./base.ts";

/**
 * A plugin's metadata.
 *
 * Its `kind` is the manifest kind, e.g. `ApiPlugin` or `SqlPlugin`, and its `pluginClass` the
 * implementation: api, skill, sql, static, websearch or imagesearch.
 */
export const Plugin = SmarterResource.extend({
  /** api, skill, sql, static, websearch or imagesearch. */
  pluginClass: z.string().nullish(),
  /** The manifest kind, e.g. `ApiPlugin`. */
  kind: z.string().nullish(),
});
export type Plugin = z.infer<typeof Plugin>;
