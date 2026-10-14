/**
 * Typed models of every SAM (Smarter Application Manifest) kind, generated from the Smarter platform's JSON Schemas.
 *
 * Each type describes a complete manifest of its kind: `apiVersion`, `kind`, `metadata`, `spec`
 * and the read-only `status`. Use them to build manifests in code, with your editor's completion, or
 * to read a described manifest with typed fields:
 *
 * @example
 * ```ts
 * const manifest = await client.guardrails.describe("pii_redactor");
 * const guardrail = manifest.toSam("Guardrail");     // a SAMGuardrail
 * console.log(guardrail.spec.config.action);
 * ```
 *
 * The types keep fields that they don't declare, so that a manifest of a newer platform still
 * validates. The platform's own models also enforce business rules that a JSON Schema can't express:
 * validate a manifest with `client.manifests.validate()` before you rely on it.
 *
 * Do not edit: run `make sam-models`.
 */

import type { SAMAccount } from "./account.ts";
import type { SAMApiConnection } from "./apiconnection.ts";
import type { SAMApiPlugin } from "./apiplugin.ts";
import type { SAMBudget } from "./budget.ts";
import type { SAMCustomDomain } from "./customdomain.ts";
import type { SAMGuardrail } from "./guardrail.ts";
import type { SAMImageSearchPlugin } from "./imagesearchplugin.ts";
import type { SAMLLMClient } from "./llmclient.ts";
import type { SAMLLMHost } from "./llmhost.ts";
import type { SAMLLMHostCompute } from "./llmhostcompute.ts";
import type { SAMMCPClient } from "./mcpclient.ts";
import type { SAMOrchestrator } from "./orchestrator.ts";
import type { SAMPlugin } from "./plugin.ts";
import type { SAMPrompt } from "./prompt.ts";
import type { SAMProvider } from "./provider.ts";
import type { SAMProxy } from "./proxy.ts";
import type { SAMSecret } from "./secret.ts";
import type { SAMSkillPlugin } from "./skillplugin.ts";
import type { SAMSmarterAuthToken } from "./smarterauthtoken.ts";
import type { SAMSqlConnection } from "./sqlconnection.ts";
import type { SAMSqlPlugin } from "./sqlplugin.ts";
import type { SAMUser } from "./user.ts";
import type { SAMVectorsearch } from "./vectorsearch.ts";
import type { SAMVectorstore } from "./vectorstore.ts";
import type { SAMWebsearchPlugin } from "./websearchplugin.ts";

export type { SAMAccount } from "./account.ts";
export type { SAMApiConnection } from "./apiconnection.ts";
export type { SAMApiPlugin } from "./apiplugin.ts";
export type { SAMBudget } from "./budget.ts";
export type { SAMCustomDomain } from "./customdomain.ts";
export type { SAMGuardrail } from "./guardrail.ts";
export type { SAMImageSearchPlugin } from "./imagesearchplugin.ts";
export type { SAMLLMClient } from "./llmclient.ts";
export type { SAMLLMHost } from "./llmhost.ts";
export type { SAMLLMHostCompute } from "./llmhostcompute.ts";
export type { SAMMCPClient } from "./mcpclient.ts";
export type { SAMOrchestrator } from "./orchestrator.ts";
export type { SAMPlugin } from "./plugin.ts";
export type { SAMPrompt } from "./prompt.ts";
export type { SAMProvider } from "./provider.ts";
export type { SAMProxy } from "./proxy.ts";
export type { SAMSecret } from "./secret.ts";
export type { SAMSkillPlugin } from "./skillplugin.ts";
export type { SAMSmarterAuthToken } from "./smarterauthtoken.ts";
export type { SAMSqlConnection } from "./sqlconnection.ts";
export type { SAMSqlPlugin } from "./sqlplugin.ts";
export type { SAMUser } from "./user.ts";
export type { SAMVectorsearch } from "./vectorsearch.ts";
export type { SAMVectorstore } from "./vectorstore.ts";
export type { SAMWebsearchPlugin } from "./websearchplugin.ts";
export { SAM_SCHEMAS } from "./schemas.ts";

/** The type of each kind, by its manifest `kind`. */
export interface SAMKinds {
  Account: SAMAccount;
  ApiConnection: SAMApiConnection;
  ApiPlugin: SAMApiPlugin;
  Budget: SAMBudget;
  CustomDomain: SAMCustomDomain;
  Guardrail: SAMGuardrail;
  ImageSearchPlugin: SAMImageSearchPlugin;
  LLMClient: SAMLLMClient;
  LLMHost: SAMLLMHost;
  LLMHostCompute: SAMLLMHostCompute;
  MCPClient: SAMMCPClient;
  Orchestrator: SAMOrchestrator;
  Plugin: SAMPlugin;
  Prompt: SAMPrompt;
  Provider: SAMProvider;
  Proxy: SAMProxy;
  Secret: SAMSecret;
  SkillPlugin: SAMSkillPlugin;
  SmarterAuthToken: SAMSmarterAuthToken;
  SqlConnection: SAMSqlConnection;
  SqlPlugin: SAMSqlPlugin;
  User: SAMUser;
  Vectorsearch: SAMVectorsearch;
  Vectorstore: SAMVectorstore;
  WebsearchPlugin: SAMWebsearchPlugin;
}

/** A manifest kind that the SDK has a type of. */
export type SAMKind = keyof SAMKinds;

/** Every kind that the SDK has a type of. */
export const SAM_KINDS: readonly SAMKind[] = [
  "Account",
  "ApiConnection",
  "ApiPlugin",
  "Budget",
  "CustomDomain",
  "Guardrail",
  "ImageSearchPlugin",
  "LLMClient",
  "LLMHost",
  "LLMHostCompute",
  "MCPClient",
  "Orchestrator",
  "Plugin",
  "Prompt",
  "Provider",
  "Proxy",
  "Secret",
  "SkillPlugin",
  "SmarterAuthToken",
  "SqlConnection",
  "SqlPlugin",
  "User",
  "Vectorsearch",
  "Vectorstore",
  "WebsearchPlugin",
];
