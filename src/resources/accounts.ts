/**
 * Accounts, their users, and their contacts: `/api/v1/accounts/`, and every user's own token usage and data exports.
 *
 * Only superusers may read accounts, users and contacts: the platform refuses other users with a 403.
 * Users and accounts are created and changed with manifests (the `User` and `Account` kinds): see
 * {@link Manifests}. Every user may read their own token usage ({@link Accounts.usage}) and export their
 * own data ({@link DataExports}).
 *
 * @example
 * ```ts
 * const usage = await client.accounts.usage({ periodicity: "7_days" });
 * for (const point of usage.points) console.log(point.period_start, point.total_tokens, point.total_cost);
 *
 * const overview = await client.accounts.dataExports.overview();
 * if (overview.exportsLeftToday > 0) await client.accounts.dataExports.start();
 * ```
 */

import { z } from "zod";

import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import {
  Account,
  AccountContact,
  DataExport,
  DataExportOverview,
  TokenUsageSeries,
  User,
  UserProfile,
} from "../models/account.ts";
import { resourceId, SmarterAPIResource, SmarterKindResource, type ResourceClient } from "./base.ts";
import type { Manifests } from "./manifests.ts";

/** A read-only REST list, and its rows by id. */
class ReadOnlyResource<M extends z.ZodType> extends SmarterAPIResource {
  readonly #path: string;
  readonly #model: M;

  /**
   * @param client - The client.
   * @param path - The list endpoint.
   * @param model - The schema of a row.
   */
  constructor(client: ResourceClient, path: string, model: M) {
    super(client);
    this.#path = path;
    this.#model = model;
  }

  /**
   * The rows that the api key's user may read.
   *
   * @param options - Per-request options.
   * @returns The rows.
   */
  async list(options?: RequestOptions): Promise<z.output<M>[]> {
    return this.http.request("GET", this.#path, z.array(this.#model), options);
  }

  /**
   * A row, by id.
   *
   * @param id - The row's id.
   * @param options - Per-request options.
   * @returns The row.
   */
  async retrieve(id: SmarterId, options?: RequestOptions): Promise<z.output<M>> {
    return this.http.request("GET", `${this.#path}${resourceId(id)}/`, this.#model, options);
  }
}

/** The users of the api key's account: `/api/v1/accounts/users/`. */
export class Users extends ReadOnlyResource<typeof User> {
  /** @param client - The client. */
  constructor(client: ResourceClient) {
    super(client, "accounts/users/", User);
  }
}

/** Each user's membership of an account: `/api/v1/accounts/user-profiles/`. */
export class UserProfiles extends ReadOnlyResource<typeof UserProfile> {
  /** @param client - The client. */
  constructor(client: ResourceClient) {
    super(client, "accounts/user-profiles/", UserProfile);
  }
}

/** The contacts of the api key's account: `/api/v1/accounts/contacts/`. */
export class AccountContacts extends ReadOnlyResource<typeof AccountContact> {
  /** @param client - The client. */
  constructor(client: ResourceClient) {
    super(client, "accounts/contacts/", AccountContact);
  }
}

/** The window of a token usage series, e.g. `24_hours`: the current hour and the 23 before it. */
export type TokenUsagePeriodicity = "12_hours" | "24_hours" | "7_days" | "1_month" | "1_year";

/**
 * The api key's user's data exports: `/api/v1/accounts/data-exports/`.
 *
 * An export is a zip file of the manifest of every resource that the user owns, in every account they
 * belong to, with Secrets' values redacted. The platform builds it in the background, stores it, and
 * emails the user a link to it when it is ready: the api never returns the link or the file. A user
 * may start a few exports a day, and only one at a time.
 */
export class DataExports extends SmarterAPIResource {
  /** The data exports' endpoint. */
  readonly path = "accounts/data-exports/";

  /**
   * What the user may export: the address that the link is emailed to, how long the link works, how
   * many exports are left today, and the latest export.
   *
   * @param options - Per-request options.
   * @returns The overview.
   */
  async overview(options?: RequestOptions): Promise<DataExportOverview> {
    return this.http.request("GET", this.path, DataExportOverview, options);
  }

  /**
   * Start a data export. A link to the zip file is emailed to the user when it is ready.
   *
   * If an export is already in progress, the platform returns that one instead of starting another.
   * A refusal (429) is not retried: it means that the user has no email address, or has started too
   * many exports today, which a retry won't change.
   *
   * @param options - Per-request options.
   * @returns The new export, queued, or the one in progress.
   * @throws {@link RateLimitError} If the user has no email address, or has started too many exports today.
   */
  async start(options?: RequestOptions): Promise<DataExport> {
    return this.http.request("POST", this.path, DataExport, { ...options, retryRateLimited: false });
  }

  /**
   * A data export's progress.
   *
   * @param exportId - The export's id.
   * @param options - Per-request options.
   * @returns The export.
   * @throws {@link NotFoundError} If the user has no export of that id.
   */
  async retrieve(exportId: number, options?: RequestOptions): Promise<DataExport> {
    return this.http.request("GET", `${this.path}${resourceId(exportId)}/`, DataExport, options);
  }
}

/** Accounts: `/api/v1/accounts/`, and the manifest api's `Account` kind. */
export class Accounts extends SmarterKindResource<typeof Account> {
  readonly kind = "Account";
  readonly path = "accounts/";
  readonly model = Account;
  /** The account's users. */
  readonly users: Users;
  /** The account's contacts. */
  readonly contacts: AccountContacts;
  /** The users' memberships of accounts. */
  readonly userProfiles: UserProfiles;
  /** The api key's user's data exports. */
  readonly dataExports: DataExports;

  /** @param client - The client. */
  constructor(client: ResourceClient & { readonly manifests: Manifests }) {
    super(client);
    this.users = new Users(client);
    this.contacts = new AccountContacts(client);
    this.userProfiles = new UserProfiles(client);
    this.dataExports = new DataExports(client);
  }

  /**
   * The tokens and cost of the api key's user's LLM requests over a window of time, one point per hour,
   * day or month, oldest first, counting the current hour's charges. Every user may read their own.
   *
   * The platform caches the series for five minutes. The points' fields are snake_case, as the platform
   * sends them, e.g. `total_tokens`.
   *
   * @param options - `periodicity`: the window, `24_hours` (the current hour and the 23 before it) by default.
   * @returns The series.
   * @throws {@link BadRequestError} If the periodicity is unknown.
   */
  async usage(options?: RequestOptions & { periodicity?: TokenUsagePeriodicity }): Promise<TokenUsageSeries> {
    return this.http.request("GET", `${this.path}usage/`, TokenUsageSeries, {
      ...options,
      params: { periodicity: options?.periodicity ?? "24_hours" },
    });
  }
}
