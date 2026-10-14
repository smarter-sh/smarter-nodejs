/**
 * LLMHosts: open-weight models that the platform serves on its own Kubernetes cluster.
 *
 * @example
 * ```ts
 * const models = await client.llmHosts.discover({ query: "qwen", task: "chat" });
 * const plan = await client.llmHosts.plan(3);       // what deploying would create, without creating it
 * const status = await client.llmHosts.status(3);
 * ```
 */

import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import {
  DiscoveredManifest,
  DiscoveredModels,
  LLMHost,
  LLMHostLogs,
  LLMHostPlan,
  LLMHostReport,
  LLMHostStatus,
  type DiscoveredModel,
} from "../models/llmhost.ts";
import { Manifest } from "../models/manifest.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** LLMHosts: `/api/v1/llmhosts/`, and the manifest api's `LLMHost` kind. */
export class LLMHosts extends SmarterKindResource<typeof LLMHost> {
  readonly kind = "LLMHost";
  readonly path = "llmhosts/";
  readonly model = LLMHost;

  /**
   * An LLMHost's state, read from Kubernetes now.
   *
   * @param id - The LLMHost's id or hashed id.
   * @param options - Per-request options.
   * @returns Its status, replicas and pods.
   */
  async status(id: SmarterId, options?: RequestOptions): Promise<LLMHostStatus> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/status/`, LLMHostStatus, options);
  }

  /**
   * The latest log lines of an LLMHost's pods.
   *
   * @param id - The LLMHost's id or hashed id.
   * @param options - `tail`: how many lines, 200 by default.
   * @returns The logs.
   */
  async logs(id: SmarterId, options?: RequestOptions & { tail?: number }): Promise<LLMHostLogs> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/logs/`, LLMHostLogs, {
      ...options,
      params: { tail: options?.tail ?? 200 },
    });
  }

  /**
   * The Kubernetes resources that deploying an LLMHost would create, without creating them.
   *
   * @param id - The LLMHost's id or hashed id.
   * @param options - Per-request options.
   * @returns The resources.
   */
  async plan(id: SmarterId, options?: RequestOptions): Promise<LLMHostPlan> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/plan/`, LLMHostPlan, options);
  }

  /**
   * Deploy an LLMHost on the platform's cluster.
   *
   * This creates real, billable infrastructure, e.g. GPU nodes. Check {@link LLMHosts.plan} first.
   *
   * @param id - The LLMHost's id or hashed id.
   * @param options - Per-request options.
   * @returns Its state.
   */
  async deploy(id: SmarterId, options?: RequestOptions): Promise<LLMHostStatus> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/deploy/`, LLMHostStatus, options);
  }

  /**
   * Undeploy an LLMHost.
   *
   * @param id - The LLMHost's id or hashed id.
   * @param options - `purge`: true to delete its model storage too.
   * @returns Its state.
   */
  async undeploy(id: SmarterId, options?: RequestOptions & { purge?: boolean }): Promise<LLMHostStatus> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/undeploy/`, LLMHostStatus, {
      ...options,
      params: { purge: options?.purge ? true : undefined },
    });
  }

  /**
   * A report of every LLMHost that the user may read: counts by status and engine, and estimated costs.
   *
   * @param options - Per-request options.
   * @returns The report.
   */
  async report(options?: RequestOptions): Promise<LLMHostReport> {
    return this.http.request("GET", `${this.path}report/`, LLMHostReport, options);
  }

  /**
   * Search a public model catalog for models that an LLMHost can serve.
   *
   * @param options - `query`: the search text, e.g. `qwen`. `task`: only models of this task, e.g.
   *   `chat` or `embedding`. `catalog`: `huggingface` by default. `limit`: at most this many, 20 by default.
   * @returns The models, each with the LLMHost manifest that would serve it.
   */
  async discover(
    options?: RequestOptions & { query?: string | null; task?: string | null; catalog?: string; limit?: number },
  ): Promise<DiscoveredModel[]> {
    const response = await this.http.request("GET", `${this.path}discover/`, DiscoveredModels, {
      ...options,
      params: {
        q: options?.query,
        task: options?.task,
        catalog: options?.catalog ?? "huggingface",
        limit: options?.limit ?? 20,
      },
    });
    return response.models;
  }

  /**
   * An LLMHost manifest for a model in a public catalog, ready to apply.
   *
   * @param repository - The model's repository, e.g. `Qwen/Qwen2.5-7B-Instruct`.
   * @param options - `catalog`, `huggingface` by default. `engine`: the inference engine, or none for the
   *   platform's choice. `name`: the LLMHost's name, or none for one derived from the repository.
   *   `tokenSecret`: the name of a Secret that holds the catalog's access token, for gated models.
   * @returns The manifest, which {@link LLMHosts.apply} accepts.
   */
  async discoverManifest(
    repository: string,
    options?: RequestOptions & {
      catalog?: string;
      engine?: string | null;
      name?: string | null;
      tokenSecret?: string | null;
    },
  ): Promise<Manifest> {
    const response = await this.http.request("GET", `${this.path}discover/manifest/`, DiscoveredManifest, {
      ...options,
      params: {
        repository,
        catalog: options?.catalog ?? "huggingface",
        engine: options?.engine,
        name: options?.name,
        tokenSecret: options?.tokenSecret,
      },
    });
    return Manifest.parse(response.manifest);
  }
}
