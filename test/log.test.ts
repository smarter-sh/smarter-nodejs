/** Test src/core/log.ts. */

import { describe, expect, it } from "vitest";

import { Logger, makeLogger, maskSecret } from "../src/core/log.ts";

describe("log", () => {
  it("masks a secret to its last four characters, and a short one to nothing", () => {
    expect(maskSecret("a".repeat(60) + "beef")).toBe("****beef");
    expect(maskSecret("short")).toBe("****");
    expect(maskSecret(null)).toBe("None");
    expect(maskSecret(undefined)).toBe("None");
  });

  it("logs at and above its level, with the source as a prefix", () => {
    const lines: string[] = [];
    const sink = (level: string) => (message: string) => lines.push(`${level} ${message}`);
    const logger = new Logger("info", {
      debug: sink("debug"),
      info: sink("info"),
      warn: sink("warn"),
      error: sink("error"),
    });
    logger.log("debug", "http", "hidden");
    logger.log("info", "http", "shown");
    logger.log("error", "config", "bad");
    expect(lines).toEqual(["info smarter:http shown", "error smarter:config bad"]);
    expect(logger.enabled("debug")).toBe(false);
  });

  it("is off when no level is given", () => {
    expect(makeLogger(undefined, undefined).level).toBe("off");
    expect(makeLogger(undefined, undefined).enabled("error")).toBe(false);
    expect(makeLogger("debug", undefined).enabled("debug")).toBe(true);
  });
});
