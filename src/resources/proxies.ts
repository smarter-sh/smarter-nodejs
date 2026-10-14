/**
 * Proxies: authenticated passthrough access to LLM providers' own apis.
 *
 * The platform holds the provider's api key, and callers use their Smarter api key instead. The
 * easiest way to call a proxy is with the provider's own SDK:
 *
 * @example
 * ```ts
 * import OpenAI from "openai";
 * import { Smarter } from "@smarter.sh/api";
 *
 * const smarter = new Smarter();
 * const openai = new OpenAI({ baseURL: smarter.proxies.baseUrl("openai"), apiKey: smarter.apiKey });
 * ```
 */

import type { QueryParamValue, RequestOptions } from "../core/http.ts";
import { JsonValue } from "../core/typing.ts";
import { ProxyList, type Proxy } from "../models/misc.ts";
import { resourceId, SmarterAPIResource } from "./base.ts";

/** The options of a proxied request, beside the per-request options. */
export interface ProxyRequestOptions extends RequestOptions {
  /** The http method, `POST` by default. */
  method?: string;
  /** The JSON body, as the provider's api expects it. */
  json?: JsonValue;
  /** Query parameters. */
  params?: Record<string, QueryParamValue>;
}

/**
 * Proxies: `/api/v1/proxy/`.
 *
 * The platform serves these endpoints only when `SMARTER_ENABLE_PROXY` is true.
 */
export class Proxies extends SmarterAPIResource {
  /** The proxies' endpoint. */
  readonly path = "proxy/";

  /**
   * The proxies that the user may call.
   *
   * @param options - Per-request options.
   * @returns The proxies.
   */
  async list(options?: RequestOptions): Promise<Proxy[]> {
    return (await this.http.request("GET", this.path, ProxyList, options)).proxies;
  }

  /**
   * A proxy's base url, for the provider's own SDK.
   *
   * @param name - The proxy's name, e.g. `openai`.
   * @returns e.g. `https://platform.smarter.sh/api/v1/proxy/openai/`.
   */
  baseUrl(name: string): string {
    return this.http.url(`${this.path}${resourceId(name)}/`);
  }

  /**
   * Send a request to a provider's api, through its proxy.
   *
   * @param name - The proxy's name, e.g. `openai`.
   * @param path - The provider api's path, e.g. `v1/chat/completions`. It must be one of the proxy's `allowedPaths`.
   * @param options - `method`, `json` and `params`.
   * @returns The provider's JSON response, or undefined for an empty response.
   */
  async request(name: string, path: string, options?: ProxyRequestOptions): Promise<JsonValue | undefined> {
    return this.http.request(
      (options?.method ?? "POST").toUpperCase(),
      `${this.path}${resourceId(name)}/${path.replace(/^\/+/, "")}`,
      JsonValue.optional(),
      options,
    );
  }
}
