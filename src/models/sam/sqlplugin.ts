/**
 * The SAM type of the `SqlPlugin` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * The data type of the parameter (one of: string, number, integer, boolean, object, array, null).
 */
export type ParameterType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";

/**
 * Smarter API Manifest - Sql Connection Model.
 */
export interface SAMSqlPlugin {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMPluginCommonMetadata;
  spec: SAMSqlPluginSpec;
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
   * Annotations, as in Kubernetes: a map of keys to string values that clients and integrations attach to a resource for their own purposes, e.g. to associate it with a resource in another system. A key is an optional DNS-subdomain prefix that names its owner, then a slash and a name of one or more slash-separated segments, e.g. 'acme.com/crm-account-id'. The prefix 'smarter.sh' and its subdomains are reserved for the Smarter platform. Values are strings: unquoted YAML scalars such as true, 42 or dates are converted to strings, and structured data belongs in a JSON string. All annotations together are limited to 256 KiB. The list of one-key maps of older manifests, e.g. [{'acme.com/crm-account-id': 'A-10042'}], is also accepted.
   */
  annotations?: {
    [k: string]: string | undefined;
  } | null;
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
 * SqlPlugin.spec[obj]: Required, the SqlPlugin specification.
 */
export interface SAMSqlPluginSpec {
  /**
   * SqlPlugin.spec.selector[obj]: the name of an existing SqlConnector to use for the SqlPlugin
   */
  connection: string;
  prompt: SAMPluginCommonSpecPrompt;
  selector: SAMPluginCommonSpecSelector;
  sqlData: SqlData;
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
   * Plugin.spec.prompt.systemRole[str]. Required. The system role that the Plugin will use for the LLM text completion prompt. Be verbose and specific. Ensure that systemRole accurately conveys to the LLM how you want it to use the Plugin data that is returned. The maximum length is 32768 characters.
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
 * SqlPlugin.spec.selector[obj]: the SqlData to use for the SqlPlugin
 */
export interface SqlData {
  /**
   * The maximum number of rows to return from the query. Must be a non-negative integer.
   */
  limit?: number | null;
  /**
   * A JSON dict containing parameter names and data types. Example: {'unit': {'type': 'string', 'enum': ['Celsius', 'Fahrenheit'], 'description': 'The temperature unit to use.'}}
   */
  parameters?: Parameter[] | null;
  /**
   * The SQL query that this plugin will execute when invoked by the user prompt.
   */
  sqlQuery: string;
  /**
   * A JSON dict containing test values for each parameter. Example: {'product_id': 1234}.
   */
  testValues?: TestValue[] | null;
  [k: string]: unknown | undefined;
}
/**
 * Parameter class for parameterized Plugins.
 *
 * This structure is
 * intended to match that which is used in the OpenAPI
 * function calling specification.
 * It is used to define the parameters that a plugin can accept,
 * and also for creating the function calling prompt api.
 */
export interface Parameter {
  /**
   * The default value of the parameter, if any.
   */
  default?: {
    [k: string]: unknown | undefined;
  };
  /**
   * A description of the parameter.
   */
  description?: string | null;
  /**
   * A list of allowed values for the parameter. Example: ['Celsius', 'Fahrenheit']
   */
  enum?: string[] | null;
  /**
   * The name of the parameter.
   */
  name: string;
  /**
   * Whether the parameter is required.
   */
  required?: boolean;
  type: ParameterType;
  [k: string]: unknown | undefined;
}
/**
 * TestValue class for SqlPlugin and ApiPlugin test values.
 */
export interface TestValue {
  /**
   * The name of the parameter being tested.
   */
  name: string;
  /**
   * The test value for the parameter.
   */
  value: {
    [k: string]: unknown | undefined;
  };
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
