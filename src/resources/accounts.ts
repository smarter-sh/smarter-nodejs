/**
 * Accounts, their users, and their contacts: `/api/v1/accounts/`.
 *
 * Only superusers may read them: the platform refuses other users with a 403. Users and accounts are
 * created and changed with manifests (the `User` and `Account` kinds): see {@link Manifests}.
 */

import { z } from "zod";

import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import { Account, AccountContact, User, UserProfile } from "../models/account.ts";
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

  /** @param client - The client. */
  constructor(client: ResourceClient & { readonly manifests: Manifests }) {
    super(client);
    this.users = new Users(client);
    this.contacts = new AccountContacts(client);
    this.userProfiles = new UserProfiles(client);
  }
}
