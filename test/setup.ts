/**
 * Runs before every test file: hides the developer's own configuration from the tests.
 *
 * The `SMARTER_*` environment variables and the smarter cli's `~/.smarter/config.yaml` would
 * otherwise change a test's result. The live tests (test/live/) read them again from
 * `SMARTER_LIVE_ENV`, which this file saves.
 */

import { join } from "node:path";

const saved: Record<string, string> = {};
for (const key of Object.keys(process.env)) {
  if (key.startsWith("SMARTER_")) {
    saved[key] = process.env[key] ?? "";
    Reflect.deleteProperty(process.env, key);
  }
}
process.env["SMARTER_LIVE_ENV"] = JSON.stringify(saved);
process.env["SMARTER_CONFIG_FILE"] = join(import.meta.dirname, "data", "no-such-config.yaml");
