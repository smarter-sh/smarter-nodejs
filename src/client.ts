/**
 * The Smarter client.
 *
 * @example
 * ```ts
 * import { Smarter } from "@smarter.sh/api";
 *
 * const client = new Smarter(); // SMARTER_API_KEY, or ~/.smarter/config.yaml
 * console.log((await client.whoami()).user.username);
 *
 * const response = await client.llmClients.prompt(5, "What is 17 times 23?");
 * console.log(response.text);
 * ```
 */

import { inspect } from "node:util";

import { z } from "zod";

import { readSettings, resolveClientConfig, type ClientConfig, type ConfigOptions } from "./core/config.ts";
import { SmarterHttpClient, type Fetch, type RequestOptions } from "./core/http.ts";
import { makeLogger, maskSecret, type SmarterLogger, type SmarterLogLevel } from "./core/log.ts";
import { SAMJournalApiEnvelope } from "./models/journal.ts";
import { KindInfo } from "./models/manifest.ts";
import { PlatformStatus, PlatformVersion, WhoAmI } from "./models/platform.ts";
import { Accounts } from "./resources/accounts.ts";
import { Orchestrators, Plugins, Secrets, Vectorsearches } from "./resources/catalog.ts";
import { Guardrails } from "./resources/guardrails.ts";
import { Journal, PromptHistory } from "./resources/history.ts";
import { LLMClients } from "./resources/llmclients.ts";
import { LLMHosts } from "./resources/llmhosts.ts";
import { Manifests } from "./resources/manifests.ts";
import { MCPClients } from "./resources/mcpclients.ts";
import { Providers } from "./resources/providers.ts";
import { Proxies } from "./resources/proxies.ts";
import { Vectorstores } from "./resources/vectorstores.ts";

/** The options of a {@link Smarter} client. Every option is optional: see `src/core/config.ts` for where each is looked up. */
export interface SmarterOptions extends ConfigOptions {
  /** Headers to add to every request. */
  defaultHeaders?: Record<string, string> | undefined;
  /** The `fetch` to send requests with, e.g. one with a proxy agent. The global `fetch` by default. */
  fetch?: Fetch | undefined;
  /** Where to log: `console`, or any logger with `debug`, `info`, `warn` and `error` methods. */
  logger?: SmarterLogger | undefined;
  /** How much to log, instead of `SMARTER_LOG`. Nothing is logged by default. */
  logLevel?: SmarterLogLevel | undefined;
}

/**
 * A client of a Smarter platform's api.
 *
 * The client's properties group the api's operations:
 *
 * - {@link Smarter.manifests}: apply, validate, get, describe, delete, deploy, undeploy and logs, for any kind
 * - {@link Smarter.llmClients}: LLMClients, and prompting and chatting with them
 * - {@link Smarter.guardrails}, {@link Smarter.mcpClients}, {@link Smarter.vectorstores},
 *   {@link Smarter.llmHosts}, {@link Smarter.secrets}, {@link Smarter.plugins},
 *   {@link Smarter.orchestrators}, {@link Smarter.vectorsearches}
 * - {@link Smarter.accounts} (and `accounts.users`, `accounts.contacts` and `accounts.userProfiles`)
 * - {@link Smarter.history}, {@link Smarter.journal}, {@link Smarter.providers}, {@link Smarter.proxies}
 * - {@link Smarter.whoami}, {@link Smarter.version}, {@link Smarter.status} and {@link Smarter.kinds}
 *
 * A client holds no open connections of its own: there is nothing to close.
 */
export class Smarter {
  /** The client's resolved configuration, without its api key. */
  readonly config: Omit<ClientConfig, "apiKey">;
  /** The http transport, for endpoints that the SDK does not wrap. */
  readonly http: SmarterHttpClient;
  readonly #apiKey: string;

  /** The manifest api, for any resource kind. */
  readonly manifests: Manifests;
  /** LLMClients. */
  readonly llmClients: LLMClients;
  /** Guardrails. */
  readonly guardrails: Guardrails;
  /** MCPClients. */
  readonly mcpClients: MCPClients;
  /** Vectorstores. */
  readonly vectorstores: Vectorstores;
  /** LLMHosts. */
  readonly llmHosts: LLMHosts;
  /** Secrets. */
  readonly secrets: Secrets;
  /** Plugins. */
  readonly plugins: Plugins;
  /** Orchestrators. */
  readonly orchestrators: Orchestrators;
  /** Vectorsearches. */
  readonly vectorsearches: Vectorsearches;
  /** Accounts, and their users and contacts. */
  readonly accounts: Accounts;
  /** The history of chat sessions, tool calls and plugin uses. */
  readonly history: PromptHistory;
  /** The Smarter Journal. Superusers only. */
  readonly journal: Journal;
  /** LLM providers and their models. */
  readonly providers: Providers;
  /** Proxies to LLM providers' own apis. */
  readonly proxies: Proxies;

  /**
   * @param options - The api key, base url, environment, timeout (seconds), retries, headers, `fetch` and logging.
   * @throws {@link SmarterConfigurationError} If no api key is found, or an option or environment variable is invalid.
   */
  constructor(options: SmarterOptions = {}) {
    const settings = readSettings();
    const logger = makeLogger(options.logLevel ?? settings.log, options.logger);
    const { apiKey, ...config } = resolveClientConfig(options, settings, logger);
    this.#apiKey = apiKey;
    this.config = config;
    this.http = new SmarterHttpClient(
      { apiKey, ...config },
      { defaultHeaders: options.defaultHeaders, fetch: options.fetch, logger },
    );
    this.manifests = new Manifests(this);
    this.llmClients = new LLMClients(this);
    this.guardrails = new Guardrails(this);
    this.mcpClients = new MCPClients(this);
    this.vectorstores = new Vectorstores(this);
    this.llmHosts = new LLMHosts(this);
    this.secrets = new Secrets(this);
    this.plugins = new Plugins(this);
    this.orchestrators = new Orchestrators(this);
    this.vectorsearches = new Vectorsearches(this);
    this.accounts = new Accounts(this);
    this.history = new PromptHistory(this);
    this.journal = new Journal(this);
    this.providers = new Providers(this);
    this.proxies = new Proxies(this);
  }

  /** The api key, e.g. to use a proxy with a provider's own SDK. */
  get apiKey(): string {
    return this.#apiKey;
  }

  /** The api's base url, e.g. `https://platform.smarter.sh/api/v1/`. */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * The owner of the api key: the user, their account, and the platform's environment.
   *
   * @param options - Per-request options.
   * @returns The owner.
   */
  async whoami(options?: RequestOptions): Promise<WhoAmI> {
    return this.#cliData("whoami/", WhoAmI, options);
  }

  /**
   * The platform's version, and the versions of its main Python packages.
   *
   * @param options - Per-request options.
   * @returns The versions.
   */
  async version(options?: RequestOptions): Promise<PlatformVersion> {
    return this.#cliData("version/", PlatformVersion, options);
  }

  /**
   * The state of the platform's infrastructure and compute.
   *
   * @param options - Per-request options.
   * @returns The status.
   */
  async status(options?: RequestOptions): Promise<PlatformStatus> {
    return this.#cliData("status/", PlatformStatus, options);
  }

  /**
   * The resource kinds that the platform supports, and which of them can be deployed.
   *
   * @param options - Per-request options.
   * @returns The kinds.
   */
  async kinds(options?: RequestOptions): Promise<KindInfo[]> {
    return this.#cliData("resources/", z.array(KindInfo), options);
  }

  async #cliData<S extends z.ZodType>(path: string, schema: S, options?: RequestOptions): Promise<z.output<S>> {
    const response = await this.http.request(
      "POST",
      `cli/${path}`,
      SAMJournalApiEnvelope.extend({ data: schema }),
      options,
    );
    return (response as { data: z.output<S> }).data;
  }

  /**
   * The client as JSON, with its api key masked.
   *
   * @returns The base url and the masked api key.
   */
  toJSON(): { baseUrl: string; apiKey: string } {
    return { baseUrl: this.baseUrl, apiKey: maskSecret(this.#apiKey) };
  }

  /** @returns e.g. `Smarter(baseUrl="https://platform.smarter.sh/api/v1/", apiKey="****5150")`. */
  toString(): string {
    return `Smarter(baseUrl=${JSON.stringify(this.baseUrl)}, apiKey=${JSON.stringify(maskSecret(this.#apiKey))})`;
  }

  /** How `console.log` and `util.inspect` show the client: without its api key. */
  [inspect.custom](): string {
    return this.toString();
  }
}
