/** Models of secrets, prompt history, proxies, providers, orchestrators and their runs, and vectorsearches. */

import { z } from "zod";

import { JsonObject, JsonValue } from "../core/typing.ts";
import { SmarterOwner, SmarterResource } from "./base.ts";
import { Plugin } from "./plugin.ts";
import { VectorstoreSearchResult } from "./vectorstore.ts";

/** A secret's metadata. The api never returns a secret's value. */
export const Secret = SmarterResource.extend({
  expiresAt: z.string().nullish(),
  lastAccessed: z.string().nullish(),
});
export type Secret = z.infer<typeof Secret>;

/** An orchestrator: a multi-agent workflow that composes LLMClients. */
export const Orchestrator = SmarterResource.extend({
  /** How its LLMClients collaborate: sequential, parallel, supervisor, router, voting or debate. */
  strategy: z.string().nullish(),
  maxIterations: z.number().int().nullish(),
  isActive: z.boolean().nullish(),
  /** The ids of its LLMClients. */
  llmclients: z.array(z.number().int()).default([]),
});
export type Orchestrator = z.infer<typeof Orchestrator>;

/**
 * One step of a run of an Orchestrator: one call of a harness LLMClient, as its owner.
 *
 * Its messages, tokens and charges are those of its prompt session, which the LLMClient's owner may read.
 */
export const OrchestrationStep = z.looseObject({
  /** The step's position in the run, from 1. */
  sequence: z.number().int(),
  /** The harness LLMClient's name. */
  llmclient: z.string(),
  /** The account that the LLMClient belongs to. */
  accountNumber: z.string(),
  /** The harness's role: planner, executor, critic, router, summarizer or tool_caller. */
  role: z.string(),
  /** succeeded, failed or skipped. */
  status: z.string(),
  /** Why the step failed, if it did. */
  errorMessage: z.string().nullish(),
  /** When the step ended, in ISO 8601. */
  createdAt: z.string().nullish(),
});
export type OrchestrationStep = z.infer<typeof OrchestrationStep>;

/**
 * A run of an Orchestrator: an attempt at an objective, its status, its steps and its result.
 *
 * A run starts `pending`, and the platform executes it in the background, one step at a time. Poll it
 * until {@link isRunDone} is true: its status is `succeeded`, `failed`, `cancelled` or
 * `max_iterations_exceeded`.
 */
export const OrchestrationRun = z.looseObject({
  id: z.number().int(),
  /** The Orchestrator's id. */
  orchestrator: z.number().int(),
  /** What the run is to achieve. */
  objective: z.string(),
  /** pending, running, succeeded, failed, cancelled or max_iterations_exceeded. */
  status: z.string(),
  /** How many steps the run has taken. */
  iterationCount: z.number().int(),
  /** The run's result: its last step's text, once it succeeded. */
  result: z.string().nullish(),
  /** Why the run failed, or stopped, if it did. */
  errorMessage: z.string().nullish(),
  /** Who started the run. */
  startedBy: SmarterOwner.nullish(),
  /** Its steps, in order. */
  steps: z.array(OrchestrationStep).default([]),
  /** When the run was requested, in ISO 8601. */
  createdAt: z.string().nullish(),
  /** When its execution began, in ISO 8601. */
  startedAt: z.string().nullish(),
  /** When it ended, in ISO 8601. */
  completedAt: z.string().nullish(),
});
export type OrchestrationRun = z.infer<typeof OrchestrationRun>;

/** The statuses of a run that has ended. */
export const ORCHESTRATION_RUN_FINAL_STATUSES: readonly string[] = [
  "succeeded",
  "failed",
  "cancelled",
  "max_iterations_exceeded",
];

/**
 * Whether a run has ended, and its status will not change again.
 *
 * @param run - The run.
 * @returns True once its status is `succeeded`, `failed`, `cancelled` or `max_iterations_exceeded`.
 */
export function isRunDone(run: Pick<OrchestrationRun, "status">): boolean {
  return ORCHESTRATION_RUN_FINAL_STATUSES.includes(run.status);
}

/** A vectorsearch: a retrieval pipeline over a vectorstore. */
export const Vectorsearch = SmarterResource.extend({
  /** similarity, similarity_score_threshold or mmr. */
  searchType: z.string().nullish(),
  /** The number of chunks to return. */
  k: z.number().int().nullish(),
  scoreThreshold: z.number().nullish(),
  /** The candidates of an mmr search. */
  fetchK: z.number().int().nullish(),
  /** An mmr search's diversity. */
  lambdaMult: z.number().nullish(),
  metadataFilter: JsonValue.nullish(),
  isEnabled: z.boolean().nullish(),
  /** The id of its vectorstore. */
  vectorstore: z.number().int().nullish(),
  /** The id of its Secret, if any. */
  authSecret: z.number().int().nullish(),
});
export type Vectorsearch = z.infer<typeof Vectorsearch>;

/** The chunks that a Vectorsearch's run found in its vectorstore, best first. */
export const VectorsearchResults = z.looseObject({
  /** The Vectorsearch's name. */
  vectorsearch: z.string(),
  /** The name of the vectorstore that it searched. */
  vectorstore: z.string(),
  results: z.array(VectorstoreSearchResult).default([]),
});
export type VectorsearchResults = z.infer<typeof VectorsearchResults>;

/** A chat session: one conversation with an LLMClient, by its session key. */
export const PromptSession = z.looseObject({
  id: z.number().int(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  session_key: z.string().nullish(),
  ip_address: z.string().nullish(),
  user_agent: z.string().nullish(),
  url: z.string().nullish(),
  user_profile: z.number().int().nullish(),
  llmclient: z.number().int().nullish(),
});
export type PromptSession = z.infer<typeof PromptSession>;

/** A tool call that the LLM made in a chat session. */
export const PromptToolCall = z.looseObject({
  id: z.number().int(),
  prompt: z.union([PromptSession, z.number().int()]).nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  /** The id of the plugin that the tool belongs to, if any. */
  plugin: z.number().int().nullish(),
  function_name: z.string().nullish(),
  function_args: z.string().nullish(),
  request: JsonValue.nullish(),
  response: JsonValue.nullish(),
});
export type PromptToolCall = z.infer<typeof PromptToolCall>;

/** A use of a plugin in a chat session. */
export const PromptPluginUsage = z.looseObject({
  id: z.number().int(),
  prompt: z.union([PromptSession, z.number().int()]).nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  plugin: Plugin.nullish(),
  input_text: z.string().nullish(),
});
export type PromptPluginUsage = z.infer<typeof PromptPluginUsage>;

/**
 * A proxy: authenticated passthrough access to an LLM provider's own api.
 *
 * The platform holds the provider's api key. Callers use their Smarter api key instead, and may
 * reach only the proxy's `allowedPaths`.
 */
export const Proxy = z.looseObject({
  name: z.string(),
  description: z.string().nullish(),
  provider: z.string().nullish(),
  /** The proxy's base url on the Smarter installation. */
  url: z.string().nullish(),
  upstreamUrl: z.string().nullish(),
  allowedPaths: z.array(z.string()).default([]),
  isActive: z.boolean().nullish(),
});
export type Proxy = z.infer<typeof Proxy>;

/** The proxies that the user may call. */
export const ProxyList = z.looseObject({ proxies: z.array(Proxy).default([]) });
export type ProxyList = z.infer<typeof ProxyList>;

/** An LLM provider that the platform is configured for, e.g. openai. */
export const Provider = z.looseObject({
  name: z.string(),
  description: z.string().nullish(),
  baseUrl: z.string().nullish(),
  isActive: z.boolean().nullish(),
  /** The url of the provider's detail in the web console: its manifest, the resources that it uses, and those that use it. */
  detailUrl: z.string().nullish(),
});
export type Provider = z.infer<typeof Provider>;

/** A model of an LLM provider. */
export const ProviderModel = z.looseObject({
  name: z.string(),
  description: z.string().nullish(),
  maxTokens: z.number().int().nullish(),
  supportsStreaming: z.boolean().nullish(),
  supportsTools: z.boolean().nullish(),
  metadata: JsonObject.nullish(),
});
export type ProviderModel = z.infer<typeof ProviderModel>;
