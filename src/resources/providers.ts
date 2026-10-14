/** LLM providers and their models: `/api/v1/providers/`. */

import { z } from "zod";

import type { RequestOptions } from "../core/http.ts";
import { Provider, ProviderModel } from "../models/misc.ts";
import { resourceId, SmarterAPIResource } from "./base.ts";

/** The LLM providers that the platform is configured for, e.g. openai or anthropic. */
export class Providers extends SmarterAPIResource {
  /** The providers' endpoint. */
  readonly path = "providers/";

  /**
   * The providers.
   *
   * @param options - Per-request options.
   * @returns The providers.
   */
  async list(options?: RequestOptions): Promise<Provider[]> {
    return this.http.request("GET", this.path, z.array(Provider), options);
  }

  /**
   * A provider, by name.
   *
   * @param name - The provider's name, e.g. `openai`.
   * @param options - Per-request options.
   * @returns The provider.
   */
  async retrieve(name: string, options?: RequestOptions): Promise<Provider> {
    return this.http.request("GET", `${this.path}${resourceId(name)}/`, Provider, options);
  }

  /**
   * A provider's models.
   *
   * @param name - The provider's name.
   * @param options - Per-request options.
   * @returns The models.
   */
  async models(name: string, options?: RequestOptions): Promise<ProviderModel[]> {
    return this.http.request("GET", `${this.path}${resourceId(name)}/models/`, z.array(ProviderModel), options);
  }
}
