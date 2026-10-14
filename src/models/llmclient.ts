/** Models of LLMClients and their plugins, built-in functions, api keys and custom domains. */

import { z } from "zod";

import { SmarterResource } from "./base.ts";
import { Plugin } from "./plugin.ts";

/** A plugin of an LLMClient, by its id and name. */
export const LLMClientPluginRef = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
});
export type LLMClientPluginRef = z.infer<typeof LLMClientPluginRef>;

/** A built-in function of an LLMClient, e.g. `calculator`. */
export const LLMClientFunction = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
  llmclient: z.number().int().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export type LLMClientFunction = z.infer<typeof LLMClientFunction>;

/** The association of a plugin with an LLMClient. */
export const LLMClientPlugin = z.looseObject({
  id: z.number().int(),
  pluginMeta: Plugin,
  llmclient: z.number().int().nullish(),
});
export type LLMClientPlugin = z.infer<typeof LLMClientPlugin>;

/** An api key that may call an LLMClient that requires authentication. */
export const LLMClientApiKey = z.looseObject({
  id: z.number().int(),
  llmclient: z.number().int().nullish(),
  /** The api key's public key_id, a UUID. Never the key itself. */
  apiKey: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export type LLMClientApiKey = z.infer<typeof LLMClientApiKey>;

/** A custom domain on which an LLMClient is deployed: the domain itself, and its verification. */
export const LLMClientCustomDomain = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  version: z.string().nullish(),
  /** The domain, e.g. `example.com`. */
  domainName: z.string().nullish(),
  /** Not Verified, Verifying, Verified or Failed. */
  verificationStatus: z.string().nullish(),
  verifiedAt: z.string().nullish(),
  verificationMessage: z.string().nullish(),
  /** The owner's user profile id. */
  userProfile: z.number().int().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export type LLMClientCustomDomain = z.infer<typeof LLMClientCustomDomain>;

/**
 * An LLMClient: a deployable AI agent, built from an LLM provider and model, a system prompt, plugins and functions.
 *
 * Prompt it with `client.llmClients.prompt()`, or start a chat with `client.llmClients.chat()`.
 */
export const LLMClient = SmarterResource.extend({
  rfc1034CompliantName: z.string().nullish(),
  provider: z.string().nullish(),
  defaultModel: z.string().nullish(),
  /** The system prompt of a new chat session. */
  defaultSystemRole: z.string().nullish(),
  deployed: z.boolean().nullish(),
  defaultHost: z.string().nullish(),
  defaultUrl: z.string().nullish(),
  customHost: z.string().nullish(),
  customUrl: z.string().nullish(),
  sandboxHost: z.string().nullish(),
  sandboxUrl: z.string().nullish(),
  /** Where to send prompts: the chat api's prompt url. */
  urlLlmclient: z.string().nullish(),
  /** The chat api's configuration url. */
  urlChatConfig: z.string().nullish(),
  /** Whether prompting the LLMClient requires an api key. */
  isAuthenticationRequired: z.boolean().nullish(),
  functions: z.array(LLMClientFunction).default([]),
  plugins: z.array(LLMClientPluginRef).default([]),
  apiKeys: z.array(LLMClientApiKey).default([]),
  customDomains: z.array(LLMClientCustomDomain).default([]),
});
export type LLMClient = z.infer<typeof LLMClient>;
