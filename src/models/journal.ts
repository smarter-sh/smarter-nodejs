/**
 * Models of the Smarter Journal api contract: the envelope of every journaled response, its error body, and a journal entry.
 *
 * The Smarter platform journals its api responses. Each one carries `api` (the api version, e.g.
 * `smarter.sh/v1`) and `metadata` (the command and the resource kind, which the platform calls its
 * "thing") beside its own `data`, `message` or `error`.
 *
 * These mirror `smarter.lib.journal.contract.models` in the Smarter platform, whose JSON Schema is
 * `journal-contract.schema.json`, as the Python SDK's `smarter.models.journal` does. The SDK's tests
 * check the platform's schema against them. See `scripts/sync-contracts.sh`.
 */

import { z } from "zod";

import { JsonValue } from "../core/typing.ts";

/** The `metadata` of a journaled response: its command and thing, and the key of its journal entry. */
export const SAMJournalApiMetadata = z.looseObject({
  /** The journal's command, e.g. `apply`. */
  command: z.string(),
  /** The journal's thing, e.g. `Guardrail`. The string `None` when there is none. */
  thing: z.string(),
  /** The key of the response's journal entry, when the journal is enabled. */
  key: z.string().nullish(),
});
export type SAMJournalApiMetadata = z.infer<typeof SAMJournalApiMetadata>;

/** The `error` of a journaled error response. Every error of the cli api has this shape. */
export const SAMJournalApiErrorBody = z.looseObject({
  /** The name of the exception's class, e.g. `SAMBrokerErrorNotFound`. */
  errorClass: z.string(),
  /** The server's stack trace, when the platform includes it. */
  stacktrace: z.string().nullish(),
  /** A human-readable description of the error. */
  description: z.string().nullish(),
  /** The http status. */
  status: z.number().int(),
  /** The exception's arguments, or the request's url. */
  args: JsonValue.nullish(),
  /** The exception's cause. */
  cause: z.string().nullish(),
  /** The exception's context, or the response's thing and command. */
  context: z.string().nullish(),
  /** The journal's thing, e.g. `Guardrail`. */
  thing: z.string().nullish(),
  /** The journal's command, e.g. `describe`. */
  command: z.string().nullish(),
});
export type SAMJournalApiErrorBody = z.infer<typeof SAMJournalApiErrorBody>;

/** The fields that every journaled response adds beside its own data. */
export const SAMJournalApiEnvelope = z.looseObject({
  /** The api version, e.g. `smarter.sh/v1`. */
  api: z.string().default("smarter.sh/v1"),
  metadata: SAMJournalApiMetadata.nullish(),
});
export type SAMJournalApiEnvelope = z.infer<typeof SAMJournalApiEnvelope>;

/** The body of a journaled error response. */
export const SAMJournalApiErrorResponse = SAMJournalApiEnvelope.extend({
  error: SAMJournalApiErrorBody,
});
export type SAMJournalApiErrorResponse = z.infer<typeof SAMJournalApiErrorResponse>;

/** A journaled response that carries only a `message`, e.g. the response of delete or deploy. */
export const SmarterJournalMessage = SAMJournalApiEnvelope.extend({
  /** A human-readable message, e.g. `LLMClient calculator applied`. */
  message: z.string().nullish(),
});
export type SmarterJournalMessage = z.infer<typeof SmarterJournalMessage>;

/**
 * The schema of a successful journaled response: the envelope, the response's `data`, and an optional `message`.
 *
 * @param data - The schema of the endpoint's `data`.
 * @returns The response's schema.
 */
export function SmarterJournaledResponse<T extends z.ZodType>(data: T) {
  return SAMJournalApiEnvelope.extend({
    data: data.nullish(),
    /** A human-readable message, e.g. `LLMClient calculator applied`. */
    message: z.string().nullish(),
  });
}
/** A successful journaled response whose `data` is a `T`. */
export type SmarterJournaledResponse<T> = SAMJournalApiEnvelope & {
  data?: T | null | undefined;
  message?: string | null | undefined;
};

/**
 * A Smarter Journal entry, as `/api/v1/journal/` returns it.
 *
 * The list returns entries without `request` and `response`. Retrieving one entry by its key
 * includes them. Only superusers may read the journal, because the request documents hold the
 * callers' credentials.
 */
export const JournalEntry = z.looseObject({
  key: z.string(),
  createdAt: z.string().nullish(),
  /** The username of the caller, or null for an anonymous request. */
  user: z.string().nullish(),
  thing: z.string(),
  command: z.string(),
  statusCode: z.number().int(),
  request: JsonValue.nullish(),
  response: JsonValue.nullish(),
});
export type JournalEntry = z.infer<typeof JournalEntry>;

/** The description of one page of the journal's entries. */
export const JournalPagination = z.looseObject({
  page: z.number().int(),
  pageSize: z.number().int(),
  numPages: z.number().int(),
  count: z.number().int(),
  search: z.string().default(""),
  ordering: z.string().default(""),
  sortFields: z.array(z.string()).default([]),
  /** The named filter that narrows the list, e.g. `pending`, or an empty string for none. */
  filter: z.string().default(""),
  /** The named filters that the list offers. */
  filters: z.array(z.string()).default([]),
  /** The tags that every resource of the list has, e.g. `production`. */
  tags: z.array(z.string()).default([]),
  /** The annotation selector's requirements that every resource matches, e.g. `acme.com/crm-id=A-1`. */
  annotations: z.array(z.string()).default([]),
  /** Why the annotation selector is invalid, in which case it is not applied, or an empty string. */
  annotationError: z.string().default(""),
});
export type JournalPagination = z.infer<typeof JournalPagination>;

/** One page of the journal's entries. */
export const JournalPage = z.looseObject({
  objects: z.array(JournalEntry).default([]),
  pagination: JournalPagination,
});
export type JournalPage = z.infer<typeof JournalPage>;
