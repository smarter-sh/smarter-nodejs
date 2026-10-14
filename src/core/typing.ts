/**
 * Type aliases of the Smarter SDK.
 *
 * These mirror `smarter.core.typing` in the Python SDK, and `smarter.lib.typing` in the Smarter
 * platform. This module imports only `zod`, so that any module of the SDK can import it without an
 * import cycle. Each alias that describes JSON is also a Zod schema of the same name.
 */

import { z } from "zod";

/** A value that is arbitrary JSON: a string, number, boolean, null, or an array or object of them. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** The Zod schema of {@link JsonValue}. */
export const JsonValue: z.ZodType<JsonValue> = z.json();

/** A JSON object whose shape is not fixed, e.g. a manifest's `spec`, whose fields depend on its kind. */
export interface JsonObject {
  [key: string]: JsonValue;
}

/** The Zod schema of {@link JsonObject}. */
export const JsonObject: z.ZodType<JsonObject> = z.record(z.string(), JsonValue);

/** A resource's id: its integer primary key, or its hashed id, e.g. `rMTAwMDAwNQx`. */
export type SmarterId = number | string;
