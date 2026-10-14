/** Models of guardrails, their evaluations, and their events. */

import { z } from "zod";

import { JsonObject } from "../core/typing.ts";
import { SmarterResource } from "./base.ts";

/** A guardrail: a check that the platform runs on prompts (`input`) or on the LLM's replies (`output`). */
export const Guardrail = SmarterResource.extend({
  /** input or output. */
  stage: z.string().nullish(),
  category: z.string().nullish(),
  /** e.g. regex, detector, classifier or llm. */
  strategy: z.string().nullish(),
  pattern: z.string().nullish(),
  config: JsonObject.nullish(),
  threshold: z.number().nullish(),
  /** e.g. block, redact or flag. */
  action: z.string().nullish(),
  replacement: z.string().nullish(),
  message: z.string().nullish(),
  severity: z.number().int().nullish(),
  /** enforce or monitor. */
  mode: z.string().nullish(),
  failClosed: z.boolean().nullish(),
  priority: z.number().int().nullish(),
  isActive: z.boolean().nullish(),
});
export type Guardrail = z.infer<typeof Guardrail>;

/** A span of the text that a guardrail matched. */
export const GuardrailMatch = z.looseObject({
  start: z.number().int(),
  end: z.number().int(),
  text: z.string(),
  label: z.string().nullish(),
});
export type GuardrailMatch = z.infer<typeof GuardrailMatch>;

/** One finding of a guardrail evaluation. */
export const GuardrailFinding = z.looseObject({
  confidence: z.number().nullish(),
  rationale: z.string().nullish(),
  matches: z.array(GuardrailMatch).default([]),
});
export type GuardrailFinding = z.infer<typeof GuardrailFinding>;

/** The result of a guardrail's dry run on a text. Nothing is saved: an evaluation does not create an event. */
export const GuardrailEvaluation = z.looseObject({
  guardrail: z.string(),
  stage: z.string(),
  triggered: z.boolean(),
  /** e.g. passed, blocked, redacted or flagged. */
  disposition: z.string().nullish(),
  /** The text after the guardrail's action, e.g. redacted. */
  text: z.string().nullish(),
  message: z.string().nullish(),
  error: z.string().nullish(),
  durationMs: z.number().nullish(),
  findings: z.array(GuardrailFinding).default([]),
});
export type GuardrailEvaluation = z.infer<typeof GuardrailEvaluation>;

/** A guardrail's finding in a real prompt, saved for review. */
export const GuardrailEvent = z.looseObject({
  id: z.number().int(),
  createdAt: z.string().nullish(),
  /** The name of the LLMClient whose prompt triggered it. */
  llmclient: z.string().nullish(),
  stage: z.string().nullish(),
  disposition: z.string().nullish(),
  reviewed: z.boolean().nullish(),
});
export type GuardrailEvent = z.infer<typeof GuardrailEvent>;

/** The latest events of a guardrail. */
export const GuardrailEvents = z.looseObject({
  guardrail: z.string(),
  events: z.array(GuardrailEvent).default([]),
});
export type GuardrailEvents = z.infer<typeof GuardrailEvents>;
