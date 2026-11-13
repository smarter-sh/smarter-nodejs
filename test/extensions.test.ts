/** Test src/resources/extensions.ts. */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { BadRequestError, NotFoundError, PermissionDeniedError } from "../src/index.ts";
import { loadJson, mockPlatform, type MockPlatform } from "./helpers.ts";

describe("Extensions", () => {
  let platform: MockPlatform;
  beforeEach(() => {
    platform = mockPlatform();
  });

  it("list() returns the installed extensions and the registry's state", async () => {
    platform.route("GET", "extensions/", { fixture: "extensions" });
    const installed = await platform.client.extensions.list();
    expect(installed.registryEnabled).toBe(true);
    expect(installed.updatesAvailable).toBe(0);
    expect(installed.objects.map((extension) => extension.slug)).toEqual(["date-calculator", "weather"]);
    expect(installed.objects[1]?.trustBadge).toBe("official");
  });

  it("registry() reads the cache, and refresh asks for the index again", async () => {
    platform.route("GET", "extensions/registry/", { fixture: "extension_registry" });
    const registry = await platform.client.extensions.registry();
    expect(registry.enabled).toBe(true);
    expect(registry.objects[0]?.action).toBe("installed");
    expect(registry.objects[0]?.versions[0]?.compatible).toBe(true);
    expect(new URL(platform.lastRequest.url).search).toBe("");
    await platform.client.extensions.registry({ refresh: true });
    expect(new URL(platform.lastRequest.url).searchParams.get("refresh")).toBe("true");
  });

  it("retrieve() unwraps the extension's detail", async () => {
    platform.route("GET", "extensions/weather/", { fixture: "extension" });
    const weather = await platform.client.extensions.retrieve("weather");
    expect(weather.tools[0]?.functionName).toBe("ext_weather_get_weather");
    const secret = weather.settings.find((setting) => setting.type === "secret");
    expect(secret?.isSet).toBe(true);
    expect(secret?.value).toBeNull();
    expect(weather.versions[0]?.isInstalled).toBe(true);
    expect(weather.allAccounts).toBe(true);
  });

  it("retrieve() of a user who is not a superuser has no settings, accounts or Secrets", async () => {
    const detail = (loadJson("extension") as { extension: Record<string, unknown> }).extension;
    platform.route("GET", "extensions/weather/", {
      json: { extension: { ...detail, settings: [], accounts: [], availableSecrets: [] } },
    });
    const weather = await platform.client.extensions.retrieve("weather");
    expect(weather.settings).toEqual([]);
    expect(weather.availableSecrets).toEqual([]);
  });

  it("retrieve() throws NotFoundError with the platform's message", async () => {
    platform.route("GET", "extensions/nope/", { status: 404, json: { detail: "No extension nope is installed." } });
    const error = await platform.client.extensions.retrieve("nope").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).message).toBe("No extension nope is installed.");
  });

  it("the actions without a body post to the extension's action", async () => {
    for (const action of ["enable", "disable", "update", "uninstall"] as const) {
      platform.route("POST", `extensions/weather/${action}/`, { fixture: "extension_action" });
      const result = await platform.client.extensions[action]("weather");
      expect(result.message).toBe("Disabled Weather.");
      expect(result.extension?.enabled).toBe(false);
      expect(platform.lastRequest.headers.get("content-type")).toBeNull();
    }
  });

  it("checkUpdates() returns a message and no extension", async () => {
    platform.route("POST", "extensions/check-updates/", {
      json: { message: "Every extension is up to date.", extension: null },
    });
    const result = await platform.client.extensions.checkUpdates();
    expect(result.message).toBe("Every extension is up to date.");
    expect(result.extension).toBeNull();
  });

  it("install() sends the slug, and the version only when given", async () => {
    platform.route("POST", "extensions/install/", { fixture: "extension_action" });
    await platform.client.extensions.install("weather");
    expect(await platform.requestJson()).toEqual({ slug: "weather" });
    await platform.client.extensions.install("weather", { version: "0.2.1" });
    expect(await platform.requestJson()).toEqual({ slug: "weather", version: "0.2.1" });
  });

  it("upload() sends the archive as multipart/form-data", async () => {
    platform.route("POST", "extensions/upload/", { fixture: "extension_action" });
    const path = join(mkdtempSync(join(tmpdir(), "smarter-")), "weather-0.2.1.zip");
    writeFileSync(path, "PK", "utf-8");
    await platform.client.extensions.upload(path);
    let form = await platform.lastRequest.formData();
    expect((form.get("archive") as File).name).toBe("weather-0.2.1.zip");
    await platform.client.extensions.upload(new File(["PK"], "mine.zip"));
    form = await platform.lastRequest.formData();
    expect((form.get("archive") as File).name).toBe("mine.zip");
  });

  it("rollback(), configure() and setAvailability() send their bodies", async () => {
    for (const action of ["rollback", "configure", "availability"]) {
      platform.route("POST", `extensions/weather/${action}/`, { fixture: "extension_action" });
    }
    const extensions = platform.client.extensions;
    await extensions.rollback("weather", 3);
    expect(await platform.requestJson()).toEqual({ versionId: 3 });
    await extensions.configure("weather", {
      values: { weather_api_url: null },
      secrets: { google_maps_api_key: { secretId: 6 }, other_key: { value: "s3cret" }, cleared: {} },
    });
    expect(await platform.requestJson()).toEqual({
      values: { weather_api_url: null },
      secrets: {
        google_maps_api_key: { secretId: 6, value: null },
        other_key: { secretId: null, value: "s3cret" },
        cleared: { secretId: null, value: null },
      },
    });
    await extensions.configure("weather", {});
    expect(await platform.requestJson()).toEqual({ values: {}, secrets: {} });
    await extensions.setAvailability("weather", false, { accountIds: [1, 2] });
    expect(await platform.requestJson()).toEqual({ allAccounts: false, accountIds: [1, 2] });
    await extensions.setAvailability("weather", true);
    expect(await platform.requestJson()).toEqual({ allAccounts: true, accountIds: [] });
  });

  it("an action of a user who is not a superuser throws PermissionDeniedError", async () => {
    platform.route("POST", "extensions/weather/enable/", {
      status: 403,
      json: { detail: "Only superusers may manage extensions." },
    });
    await expect(platform.client.extensions.enable("weather")).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("an action that fails throws BadRequestError with the platform's message", async () => {
    platform.route("POST", "extensions/weather/enable/", {
      status: 400,
      json: { detail: "Weather is missing required settings: google_maps_api_key." },
    });
    const error = await platform.client.extensions.enable("weather").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as BadRequestError).message).toContain("google_maps_api_key");
  });
});
