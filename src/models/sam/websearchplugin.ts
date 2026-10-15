/**
 * The SAM type of the `WebsearchPlugin` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - WebsearchPlugin Model.
 */
export interface SAMWebsearchPlugin {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMPluginCommonMetadata;
  spec: SAMWebsearchPluginSpec;
  /**
   * Plugin.status[obj]: Optional, Read-only. Stateful status information about the Plugin.
   */
  status?: SAMPluginCommonStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Plugin.metadata[obj]: Required, the Plugin metadata.
 */
export interface SAMPluginCommonMetadata {
  /**
   * The manifest annotations. Used for storing arbitrary metadata as
   *             key-value pairs. Example: [{'smarter.sh/test-manifest/project-name': 'Scooby dooby do'}]. The
   *             key should be a valid url-friendly string. The value accepts
   *             multi-line string values (YAML block scalars) and various scalar types including
   *             str, int, float, bool, datetime.date, datetime.datetime, decimal.Decimal, uuid.UUID, bytes, list, dict.
   *
   */
  annotations?:
    | {
        [k: string]:
          | string
          | number
          | boolean
          | unknown[]
          | {
              [k: string]: unknown | undefined;
            }
          | undefined;
      }[]
    | null;
  /**
   * The description for this resource. Be brief. Keep it under 255 characters.
   */
  description: string | null;
  /**
   * The camelCase name of the manifest resource
   */
  name: string;
  /**
   * The class of the plugin. one of: ['api', 'imagesearch', 'skill', 'sql', 'static', 'websearch']
   */
  pluginClass: string;
  /**
   * The tags of the manifest. Used for generic resource categorization and search. Example: ['tag1', 'tag2']
   */
  tags?: string[] | null;
  /**
   * The semantic version of the manifest. Example: 0.1.0
   */
  version: string | null;
  [k: string]: unknown | undefined;
}
/**
 * WebsearchPlugin.spec[obj]: Required, the WebsearchPlugin specification.
 */
export interface SAMWebsearchPluginSpec {
  prompt: SAMPluginCommonSpecPrompt;
  selector: SAMPluginCommonSpecSelector;
  websearchData: WebsearchData;
  [k: string]: unknown | undefined;
}
/**
 * Plugin.spec.prompt[obj]: the LLM prompt engineering to apply to the Plugin
 */
export interface SAMPluginCommonSpecPrompt {
  /**
   * Plugin.spec.prompt.maxTokens[int]. Optional. The maxTokens of the Plugin. Defaults to 2048. The maximum number of tokens the LLM should generate in the prompt response.
   */
  maxTokens?: number;
  /**
   * Plugin.spec.prompt.model[str] Optional. The model of the Plugin. Defaults to gpt-6-luna. Must be one of: ['chat-latest', 'gpt-4.1', 'gpt-4.1-2025-04-14', 'gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-4o', 'gpt-4o-2024-08-06', 'gpt-4o-2024-11-20', 'gpt-4o-mini', 'gpt-4o-mini-2024-07-18', 'gpt-5-search-api', 'gpt-5-search-api-2025-10-14', 'gpt-5.2', 'gpt-5.2-2025-12-11', 'gpt-5.4', 'gpt-5.4-2026-03-05', 'gpt-5.4-mini', 'gpt-5.4-mini-2026-03-17', 'gpt-5.5', 'gpt-5.5-2026-04-23', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-6-astra', 'gpt-6-luna', 'gpt-6-sol', 'gpt-6.1-sol']
   */
  model?: string;
  /**
   * Plugin.spec.prompt.provider[str]. Optional. The provider of the LLM. Defaults to openai. The provider is the vendor name for the LLM service that will be used to generate the prompt response.
   */
  provider?: string;
  /**
   * Plugin.spec.prompt.systemRole[str]. Required. The system role that the Plugin will use for the LLM text completion prompt. Be verbose and specific. Ensure that systemRole accurately conveys to the LLM how you want it to use the Plugin data that is returned.
   */
  systemRole: string;
  /**
   * Plugin.spec.prompt.temperature[float] Optional. The temperature of the Plugin. Defaults to 1.0. Should be between 0 and 1.0. The higher the temperature, the more creative the response. The lower the temperature, the more predictable the response.
   */
  temperature?: number;
  [k: string]: unknown | undefined;
}
/**
 * Plugin.spec.selector[obj]: the selector logic to use for the Plugin
 */
export interface SAMPluginCommonSpecSelector {
  /**
   * Plugin.spec.selector.directive[str]: Required. the kind of selector directive to use for the Plugin. Must be one of: ['search_terms', 'always', 'llm']
   */
  directive: string;
  /**
   * Plugin.spec.selector.searchTerms[list]. Optional. The keyword search terms to use when the Plugin directive is 'search_terms'. Keywords are most effective when constrained to 1 or 2 words each and lists are limited to a few dozen items.
   */
  searchTerms?: string[] | null;
  [k: string]: unknown | undefined;
}
/**
 * WebsearchPlugin.spec.websearchData[obj]: the web search and web fetch configuration of the WebsearchPlugin.
 */
export interface WebsearchData {
  /**
   * WebsearchPlugin.spec.allowedDomains[list]: if not empty, only these domains, and their subdomains, may be searched and read.
   */
  allowedDomains?: string[] | null;
  /**
   * WebsearchPlugin.spec.blockedDomains[list]: these domains, and their subdomains, are never searched nor read.
   */
  blockedDomains?: string[] | null;
  /**
   * WebsearchPlugin.spec.cacheTtl[int]: seconds to cache search results and web pages. 0 disables caching.
   */
  cacheTtl?: number;
  /**
   * WebsearchPlugin.spec.fetch[obj]: enables reading web pages by URL.
   */
  fetch?: WebsearchFetch | null;
  /**
   * WebsearchPlugin.spec.search[obj]: enables web search. Requires a web search API key.
   */
  search?: WebsearchSearch | null;
  /**
   * WebsearchPlugin.spec.timeout[int]: seconds to wait for each web request, 1 to 60.
   */
  timeout?: number;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API - WebsearchPlugin.spec.websearchData.fetch: reading web pages by URL.
 */
export interface WebsearchFetch {
  /**
   * WebsearchPlugin.spec.fetch.maxCharacters[int]: the maximum number of characters of a web page to return, 1000 to 100000. Longer pages are truncated.
   */
  maxCharacters?: number;
  /**
   * WebsearchPlugin.spec.fetch.respectRobotsTxt[bool]: whether to obey websites' robots.txt files.
   */
  respectRobotsTxt?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API - WebsearchPlugin.spec.websearchData.search: web search, via a web search API.
 */
export interface WebsearchSearch {
  /**
   * WebsearchPlugin.spec.search.apiKey[str]: the name of the Smarter Secret that contains the web search API's api key. The api key itself is never included in the manifest.
   */
  apiKey: string;
  /**
   * WebsearchPlugin.spec.search.country[str]: an ISO 3166-1 alpha-2 country code, e.g. us, to localize results.
   */
  country?: string | null;
  /**
   * WebsearchPlugin.spec.search.freshness[str]: by default, restrict results to those published within the last ['day', 'week', 'month', 'year']. The LLM can override this per search.
   */
  freshness?: ("day" | "week" | "month" | "year") | null;
  /**
   * WebsearchPlugin.spec.search.language[str]: an ISO 639-1 language code, e.g. en, to localize results.
   */
  language?: string | null;
  /**
   * WebsearchPlugin.spec.search.maxResults[int]: the maximum number of results per search, 1 to 20.
   */
  maxResults?: number;
  /**
   * WebsearchPlugin.spec.search.provider[str]: the web search API. One of: ['brave', 'tavily']
   */
  provider: "brave" | "tavily";
  /**
   * WebsearchPlugin.spec.search.safeSearch[str]: adult content filtering. One of: ['off', 'moderate', 'strict']
   */
  safeSearch?: "off" | "moderate" | "strict";
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Plugin Manifest - Status class.
 */
export interface SAMPluginCommonStatus {
  /**
   * Plugin.status.account_number: The account owner of this Plugin. Read only.
   */
  accountNumber: string;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Plugin.status.account_number: The Smarter user who created this Plugin. Read only.
   */
  username: string;
  [k: string]: unknown | undefined;
}
/**
 * A resource that depends on the resource that a manifest describes.
 */
export interface SAMDependency {
  /**
   * kind[String]: The SAM kind of the resource that depends on this resource, e.g. LLMClient. Read only.
   */
  kind: string;
  /**
   * name[String]: The name of the resource that depends on this resource. Read only.
   */
  name: string;
  [k: string]: unknown | undefined;
}
