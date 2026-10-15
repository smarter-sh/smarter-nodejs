/** Models of LLMClients and their plugins, MCPClients, guardrails, extensions, api keys and custom domains. */

import { z } from "zod";

import { SmarterResource } from "./base.ts";
import { Plugin } from "./plugin.ts";

/** A plugin of an LLMClient, by its id and name. */
export const LLMClientPluginRef = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
});
export type LLMClientPluginRef = z.infer<typeof LLMClientPluginRef>;

/** An MCPClient of an LLMClient, by the link's id and the MCPClient's name. */
export const LLMClientMCPClientRef = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
});
export type LLMClientMCPClientRef = z.infer<typeof LLMClientMCPClientRef>;

/** A guardrail of an LLMClient, by the link's id and the guardrail's name. */
export const LLMClientGuardrailRef = z.looseObject({
  id: z.number().int(),
  name: z.string().nullish(),
});
export type LLMClientGuardrailRef = z.infer<typeof LLMClientGuardrailRef>;

/** Something that an LLMClient adds to a prompt: an extension, plugin, MCPClient or guardrail. */
export const LLMClientTool = z.looseObject({
  /** The id of the link row: the LLMClient's extension, plugin, MCPClient or guardrail. */
  id: z.number().int(),
  /** The extension's slug, or the linked resource's name. */
  name: z.string(),
  /** `Extension`, or the linked resource's manifest kind: `Plugin`, `MCPClient` or `Guardrail`. */
  kind: z.string(),
});
export type LLMClientTool = z.infer<typeof LLMClientTool>;

/** An extension of an LLMClient, whose tools the LLMClient offers the LLM, e.g. `calculator`. */
export const LLMClientExtension = z.looseObject({
  id: z.number().int(),
  /** The extension's slug, e.g. `weather`. */
  name: z.string().nullish(),
  /** The Extension's id. */
  extension: z.number().int().nullish(),
  llmclient: z.number().int().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export type LLMClientExtension = z.infer<typeof LLMClientExtension>;

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
 * An LLMClient: a deployable AI agent, built from an LLM provider and model, a system prompt, plugins and extensions.
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
  extensions: z.array(LLMClientExtension).default([]),
  plugins: z.array(LLMClientPluginRef).default([]),
  mcpclients: z.array(LLMClientMCPClientRef).default([]),
  guardrails: z.array(LLMClientGuardrailRef).default([]),
  /** Everything that the LLMClient adds to a prompt: its extensions, plugins, MCPClients and guardrails, in that order. */
  tools: z.array(LLMClientTool).default([]),
  apiKeys: z.array(LLMClientApiKey).default([]),
  customDomains: z.array(LLMClientCustomDomain).default([]),
});
export type LLMClient = z.infer<typeof LLMClient>;
