/** Models of accounts, users, user profiles, account contacts, token usage and data exports, as `/api/v1/accounts/` returns them. */

import { z } from "zod";

import { SmarterAccountRef, SmarterResource } from "./base.ts";

/** A Smarter account: the tenant that owns users and resources. */
export const Account = SmarterResource.extend({
  accountNumber: z.string(),
  isDefaultAccount: z.boolean().nullish(),
  companyName: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  address1: z.string().nullish(),
  address2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  language: z.string().nullish(),
  timezone: z.string().nullish(),
  currency: z.string().nullish(),
  isActive: z.boolean().nullish(),
});
export type Account = z.infer<typeof Account>;

/** A user of the platform. */
export const User = z.looseObject({
  id: z.number().int(),
  username: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  isStaff: z.boolean().nullish(),
  isSuperuser: z.boolean().nullish(),
});
export type User = z.infer<typeof User>;

/** A user's membership of an account, which owns the resources that the user creates in it. */
export const UserProfile = SmarterResource.extend({
  user: User,
  account: SmarterAccountRef,
  /** The url of the image that the user uploaded, which takes precedence over `profileImageUrl`. */
  profileImage: z.string().nullish(),
  /** The url of the image that the oauth provider supplied. */
  profileImageUrl: z.string().nullish(),
  isTest: z.boolean().nullish(),
});
export type UserProfile = z.infer<typeof UserProfile>;

/** A contact of an account, who receives its notices. */
export const AccountContact = z.looseObject({
  id: z.number().int(),
  account: SmarterAccountRef.nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  isPrimary: z.boolean().nullish(),
  isTest: z.boolean().nullish(),
  welcomed: z.boolean().nullish(),
});
export type AccountContact = z.infer<typeof AccountContact>;

/**
 * The tokens and cost of the user's LLM requests in one period: an hour, a day or a month.
 *
 * Its fields are snake_case, as the platform sends them.
 */
export const TokenUsagePoint = z.looseObject({
  /** The start of the period, in UTC, in ISO 8601. */
  period_start: z.string(),
  /** How many charges the period has. */
  records: z.number().int(),
  /** The tokens of the prompts. */
  prompt_tokens: z.number().int(),
  /** The tokens of the completions. */
  completion_tokens: z.number().int(),
  /** Every token of the period. */
  total_tokens: z.number().int(),
  /** The period's cost, in US dollars. */
  total_cost: z.number(),
});
export type TokenUsagePoint = z.infer<typeof TokenUsagePoint>;

/** The tokens and cost of the user's LLM requests over a window of time, one point per period, oldest first. */
export const TokenUsageSeries = z.looseObject({
  /** The window, e.g. `24_hours`. */
  periodicity: z.string(),
  /** The period of each point: hour, day or month. */
  period: z.string(),
  points: z.array(TokenUsagePoint).default([]),
});
export type TokenUsageSeries = z.infer<typeof TokenUsageSeries>;

/**
 * A data export: a zip file of the manifest of every resource that the user owns, with Secrets'
 * values redacted, and its progress. A link to it is emailed to the user when it is ready; the api
 * never returns the link.
 */
export const DataExport = z.looseObject({
  id: z.number().int(),
  /** queued, running, succeeded or failed. */
  status: z.string(),
  /** The step that the export is on: queued, inventory, manifests, archive, upload, email or done. */
  step: z.string(),
  /** When the export was started, in ISO 8601. */
  createdAt: z.string(),
  /** The address that the link is emailed to. */
  email: z.string().nullish(),
  /** When the emailed link expires, in ISO 8601. */
  expiresAt: z.string().nullish(),
  /** Why the export failed, or an empty string. */
  error: z.string().nullish(),
  /** How many resources the user owns. */
  resourceCount: z.number().int().nullish(),
  /** How many manifests have been written so far. */
  manifestCount: z.number().int().nullish(),
  /** How many resources had no manifest. */
  failedCount: z.number().int().nullish(),
  /** The size of the zip file, in bytes. */
  sizeBytes: z.number().int().nullish(),
});
export type DataExport = z.infer<typeof DataExport>;

/** What the user may export: where the link is emailed, how long it works, how many exports are left today, and the latest export. */
export const DataExportOverview = z.looseObject({
  /** The address that the link is emailed to, or an empty string if the user has none. */
  email: z.string().nullish(),
  /** How many hours the emailed link works. */
  linkHours: z.number().int(),
  /** The most exports that a user may start in 24 hours. */
  exportsPerDay: z.number().int(),
  /** How many more the user may start now. */
  exportsLeftToday: z.number().int(),
  /** The user's most recent export, or null if they never started one. */
  latest: DataExport.nullish(),
});
export type DataExportOverview = z.infer<typeof DataExportOverview>;
