/**
 * The Smarter Node.js SDK: the official Node.js client of the Smarter platform's api.
 *
 * @example
 * ```ts
 * import { Smarter } from "@smarter.sh/api";
 *
 * const client = new Smarter();
 * console.log((await client.llmClients.prompt(5, "Hello")).text);
 * ```
 *
 * See https://docs.smarter.sh/en/latest/smarter-framework/smarter-nodejs.html
 *
 * @packageDocumentation
 */

export { Smarter, type SmarterOptions } from "./client.ts";
export { VERSION } from "./version.ts";

export {
  API_PATH,
  DEFAULT_ENVIRONMENT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_ROOT_DOMAIN,
  DEFAULT_TIMEOUT,
  ENVIRONMENTS,
  LOCAL_URL,
  apiBaseUrl,
  environmentUrl,
  resolveClientConfig,
  type ClientConfig,
  type SmarterEnvironment,
} from "./core/config.ts";
export {
  APIConnectionError,
  APIError,
  APIResponseValidationError,
  APIStatusError,
  APITimeoutError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  ResourceNotFoundError,
  SmarterConfigurationError,
  SmarterError,
  SmarterPromptError,
  SmarterValueError,
  UnprocessableEntityError,
  type FailedRequest,
} from "./core/errors.ts";
export { SmarterHttpClient, type Fetch, type QueryParamValue, type RequestOptions } from "./core/http.ts";
export { maskSecret, type SmarterLogger, type SmarterLogLevel } from "./core/log.ts";
export { iterSse, type ServerSentEvent } from "./core/sse.ts";
export { JsonObject, JsonValue, type SmarterId } from "./core/typing.ts";

export * from "./models/account.ts";
export * from "./models/base.ts";
export * from "./models/chat.ts";
export * from "./models/guardrail.ts";
export * from "./models/journal.ts";
export * from "./models/llmclient.ts";
export * from "./models/llmhost.ts";
export * from "./models/manifest.ts";
export * from "./models/mcpclient.ts";
export * from "./models/misc.ts";
export * from "./models/platform.ts";
export * from "./models/plugin.ts";
export * from "./models/react.ts";
export * from "./models/sam/index.ts";
export * from "./models/vectorstore.ts";

export { AccountContacts, Accounts, UserProfiles, Users } from "./resources/accounts.ts";
export { SmarterAPIResource, SmarterKindResource, resourceId } from "./resources/base.ts";
export { Orchestrators, PLUGIN_KINDS, Plugins, Secrets, Vectorsearches } from "./resources/catalog.ts";
export { Guardrails, type GuardrailStage } from "./resources/guardrails.ts";
export { Journal, PromptHistory, type JournalListOptions } from "./resources/history.ts";
export {
  ChatSession,
  ChatStream,
  LLMClients,
  PromptStream,
  requestMessages,
  toMessages,
  type MessageInput,
  type PromptInput,
  type PromptOptions,
} from "./resources/llmclients.ts";
export { LLMHosts } from "./resources/llmhosts.ts";
export { CLI_PATH, Manifests, kindSegment } from "./resources/manifests.ts";
export { MCPClients } from "./resources/mcpclients.ts";
export { Providers } from "./resources/providers.ts";
export { Proxies, type ProxyRequestOptions } from "./resources/proxies.ts";
export {
  Vectorstores,
  type UploadInput,
  type VectorstoreSearchOptions,
  type VectorstoreSearchType,
} from "./resources/vectorstores.ts";
