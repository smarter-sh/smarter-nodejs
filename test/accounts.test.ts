/** Test src/resources/accounts.ts. */

import { beforeEach, describe, expect, it } from "vitest";

import { BadRequestError, NotFoundError, RateLimitError } from "../src/index.ts";
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

  it("usage() asks for 24 hours by default, and returns the snake_case points", async () => {
    platform.route("GET", "accounts/usage/", { fixture: "token_usage" });
    const usage = await platform.client.accounts.usage({ periodicity: "7_days" });
    expect(new URL(platform.lastRequest.url).searchParams.get("periodicity")).toBe("7_days");
    expect(usage.period).toBe("day");
    expect(usage.points).toHaveLength(7);
    expect(usage.points[0]?.total_tokens).toBe(52394);
    expect(usage.points[0]?.period_start).toBe("2026-11-07T00:00:00Z");
    await platform.client.accounts.usage();
    expect(new URL(platform.lastRequest.url).searchParams.get("periodicity")).toBe("24_hours");
  });

  it("usage() throws BadRequestError for an unknown periodicity", async () => {
    platform.route("GET", "accounts/usage/", { status: 400, json: { detail: "Unknown periodicity: bogus." } });
    await expect(platform.client.accounts.usage()).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("DataExports", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("overview() returns the limits and the latest export", async () => {
    platform.route("GET", "accounts/data-exports/", { fixture: "data_export_overview" });
    const overview = await platform.client.accounts.dataExports.overview();
    expect(overview.exportsPerDay).toBe(5);
    expect(overview.exportsLeftToday).toBe(4);
    expect(overview.latest?.status).toBe("succeeded");
    expect(overview.latest?.sizeBytes).toBe(18311);
  });

  it("start() returns the new export, 202, or the one in progress, 200", async () => {
    platform.route("POST", "accounts/data-exports/", { fixture: "data_export", status: 202 });
    const started = await platform.client.accounts.dataExports.start();
    expect(started.status).toBe("queued");
    expect(started.expiresAt).toBeNull();
    platform.route("POST", "accounts/data-exports/", { fixture: "data_export" });
    expect((await platform.client.accounts.dataExports.start()).id).toBe(started.id);
  });

  it("start() throws a refusal (429) at once, without retrying it into more exports", async () => {
    platform.route("POST", "accounts/data-exports/", {
      status: 429,
      json: { detail: "Your account has no email address to send the download link to." },
      headers: { "retry-after": "0" },
    });
    const client = platform.makeClient({ maxRetries: 3 });
    const error = await client.accounts.dataExports.start().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).message).toContain("no email address");
    expect(platform.requests).toHaveLength(1);
  });

  it("start() still retries a transient failure", async () => {
    const statuses = [502, 202];
    platform.route("POST", "accounts/data-exports/", {
      handler: () => {
        const status = statuses.shift() ?? 500;
        return new Response(JSON.stringify(status === 202 ? loadJson("data_export") : {}), {
          status,
          headers: { "Content-Type": "application/json", "retry-after": "0" },
        });
      },
    });
    expect((await platform.makeClient({ maxRetries: 2 }).accounts.dataExports.start()).step).toBe("queued");
    expect(platform.requests).toHaveLength(2);
  });

  it("retrieve() returns an export's progress, and NotFoundError for another user's", async () => {
    platform.route("GET", "accounts/data-exports/8/", { fixture: "data_export" });
    platform.route("GET", "accounts/data-exports/9/", { status: 404, json: { detail: "You have no data export 9." } });
    expect((await platform.client.accounts.dataExports.retrieve(8)).id).toBe(8);
    await expect(platform.client.accounts.dataExports.retrieve(9)).rejects.toBeInstanceOf(NotFoundError);
  });
});
