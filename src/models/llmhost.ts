/** Models of LLMHosts: open-weight models that Smarter serves on its own Kubernetes cluster. */

import { z } from "zod";

import { JsonObject, JsonValue } from "../core/typing.ts";
import { SmarterResource } from "./base.ts";

/** An LLMHost: a model, the inference engine that serves it, and the compute it runs on. */
export const LLMHost = SmarterResource.extend({
  spec: JsonObject.nullish(),
  modelSource: z.string().nullish(),
  modelRepository: z.string().nullish(),
  modelRevision: z.string().nullish(),
  /** e.g. chat, completion or embedding. */
  modelTask: z.string().nullish(),
  /** e.g. vllm, tgi, tei, ollama or llama_cpp. */
  inferenceEngine: z.string().nullish(),
  apiFormat: z.string().nullish(),
  /** The id of the LLMHostCompute that the LLMHost runs on. */
  compute: z.number().int().nullish(),
  gpuCount: z.number().int().nullish(),
  gpuType: z.string().nullish(),
  replicas: z.number().int().nullish(),
  readyReplicas: z.number().int().nullish(),
  status: z.string().nullish(),
  statusMessage: z.string().nullish(),
  endpointUrl: z.string().nullish(),
  publicUrl: z.string().nullish(),
  servedModelName: z.string().nullish(),
  isActive: z.boolean().nullish(),
  deployedAt: z.string().nullish(),
  costPerHour: z.string().nullish(),
});
export type LLMHost = z.infer<typeof LLMHost>;

/** An LLMHost's state, read from Kubernetes now. */
export const LLMHostStatus = z.looseObject({
  llmhost: z.string(),
  status: z.string(),
  message: z.string().nullish(),
  replicas: z.number().int().nullish(),
  readyReplicas: z.number().int().nullish(),
  healthy: z.boolean().nullish(),
  endpoint: z.string().nullish(),
  publicUrl: z.string().nullish(),
  pods: z.array(JsonObject).default([]),
  checkedAt: z.string().nullish(),
});
export type LLMHostStatus = z.infer<typeof LLMHostStatus>;

/** The latest log lines of an LLMHost's pods. */
export const LLMHostLogs = z.looseObject({
  llmhost: z.string(),
  logs: JsonValue.nullish(),
});
export type LLMHostLogs = z.infer<typeof LLMHostLogs>;

/** The Kubernetes resources that deploying an LLMHost would create, without creating them. */
export const LLMHostPlan = z.looseObject({
  llmhost: z.string(),
  resources: z.array(JsonObject).default([]),
});
export type LLMHostPlan = z.infer<typeof LLMHostPlan>;

/** A report of every LLMHost that the user may read: counts, and estimated costs. */
export const LLMHostReport = z.looseObject({
  totals: JsonObject.default({}),
  byStatus: z.record(z.string(), z.number().int()).default({}),
  byEngine: z.record(z.string(), z.number().int()).default({}),
  llmhosts: z.array(JsonObject).default([]),
});
export type LLMHostReport = z.infer<typeof LLMHostReport>;

/** A model found in a public catalog, e.g. Hugging Face, with the LLMHost manifest that would serve it. */
export const DiscoveredModel = z.looseObject({
  catalog: z.string().nullish(),
  source: z.string().nullish(),
  repository: z.string(),
  task: z.string().nullish(),
  description: z.string().nullish(),
  license: z.string().nullish(),
  gated: z.boolean().nullish(),
  downloads: z.number().int().nullish(),
  likes: z.number().int().nullish(),
  tags: z.array(z.string()).default([]),
  manifest: JsonObject.nullish(),
});
export type DiscoveredModel = z.infer<typeof DiscoveredModel>;

/** The response of `discover/manifest/`: a drafted LLMHost manifest. */
export const DiscoveredManifest = z.looseObject({ manifest: JsonObject });
export type DiscoveredManifest = z.infer<typeof DiscoveredManifest>;

/** The models that a catalog search found. */
export const DiscoveredModels = z.looseObject({ models: z.array(DiscoveredModel).default([]) });
export type DiscoveredModels = z.infer<typeof DiscoveredModels>;
