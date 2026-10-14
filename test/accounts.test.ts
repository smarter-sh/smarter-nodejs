/** Test src/resources/accounts.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

const first = (name: string): unknown => (loadJson(name) as unknown[])[0];

describe("Accounts", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("lists and retrieves accounts", async () => {
    platform.route("GET", "accounts/", { fixture: "accounts" });
    platform.route("GET", "accounts/1/", { json: first("accounts") });
    expect((await platform.client.accounts.list())[0]?.accountNumber).toBe("1234-5678-9012");
    expect((await platform.client.accounts.retrieve(1)).companyName).toBe("Example Company");
  });

  it("lists and retrieves the account's users and contacts", async () => {
    platform.route("GET", "accounts/users/", { fixture: "users" });
    platform.route("GET", "accounts/users/1/", { json: first("users") });
    platform.route("GET", "accounts/contacts/", { fixture: "contacts" });
    platform.route("GET", "accounts/contacts/1/", { json: first("contacts") });
    expect((await platform.client.accounts.users.list())[0]?.isSuperuser).toBe(true);
    expect((await platform.client.accounts.users.retrieve(1)).username).toBe("admin");
    expect((await platform.client.accounts.contacts.list())[0]?.isPrimary).toBe(true);
    expect((await platform.client.accounts.contacts.retrieve(1)).account?.accountNumber).toBe("1234-5678-9012");
  });

  it("lists and retrieves the user profiles, with their users and accounts", async () => {
    platform.route("GET", "accounts/user-profiles/", { fixture: "user_profiles" });
    platform.route("GET", "accounts/user-profiles/1/", { json: first("user_profiles") });
    expect((await platform.client.accounts.userProfiles.list())[0]?.user.username).toBe("admin");
    const profile = await platform.client.accounts.userProfiles.retrieve(1);
    expect(profile.account.accountNumber).toBe("1234-5678-9012");
    expect(profile.isTest).toBe(false);
  });
});
