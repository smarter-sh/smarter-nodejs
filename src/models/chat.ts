/**
 * Models of the Smarter Chat api contract, version 2: an LLMClient's configuration, its prompt api's request and response, and the prompt's progress events.
 *
 * These mirror `smarter.apps.prompt.contract.models` in the Smarter platform, whose JSON Schema is
 * `chat-contract.schema.json`, as the Python SDK's `smarter.models.chat` does. The SDK always asks for
 * version 2 of the contract (with the `X-Smarter-Capabilities: chat-contract-v2` request header), so
 * the deprecated version 1 models are not mirrored.
 *
 * Two deliberate differences from the platform's models, both so that an SDK keeps working when the
 * platform is upgraded:
 *
 * - every schema keeps extra fields, including the models of Django rows, whose platform models
 *   forbid them, and
 * - values that the platform may add to, such as a plugin's class or a progress event's type, are
 *   strings rather than enums. Their known values are listed in the fields' comments.
 *
 * The SDK's tests validate the platform's published example of every contract model against these
 * schemas. See `scripts/sync-contracts.sh`.
 */

import { z } from "zod";

import { JsonObject, JsonValue } from "../core/typing.ts";

/** The version of the Smarter Chat api contract that the SDK reads. */
export const CHAT_CONTRACT_V2 = 2;

/** The `X-Smarter-Capabilities` value with which the SDK asks for version 2 of the contract. */
export const CHAT_CONTRACT_V2_CAPABILITY = "chat-contract-v2";

/** The message roles that the LLM providers accept. Smarter's own roles, `smarter` and `smarter_error`, are informational. */
export const LLM_MESSAGE_ROLES: readonly string[] = ["system", "assistant", "user", "tool"];

// ------------------------------------------------------------------------------
// messages
// ------------------------------------------------------------------------------

/** A text part of a message's content. */
export const PromptChatApiTextPart = z.looseObject({ type: z.literal("text"), text: z.string() });
export type PromptChatApiTextPart = z.infer<typeof PromptChatApiTextPart>;

/** An image, by its url or as a data url. */
export const PromptChatApiImageUrl = z.looseObject({
  url: z.string(),
  detail: z.enum(["auto", "low", "high"]).nullish(),
});
export type PromptChatApiImageUrl = z.infer<typeof PromptChatApiImageUrl>;

/** An image part of a message's content. */
export const PromptChatApiImagePart = z.looseObject({ type: z.literal("image_url"), image_url: PromptChatApiImageUrl });
export type PromptChatApiImagePart = z.infer<typeof PromptChatApiImagePart>;

/** Audio, base64 encoded. */
export const PromptChatApiInputAudio = z.looseObject({ data: z.string(), format: z.enum(["wav", "mp3"]) });
export type PromptChatApiInputAudio = z.infer<typeof PromptChatApiInputAudio>;

/** An audio part of a message's content. */
export const PromptChatApiAudioPart = z.looseObject({
  type: z.literal("input_audio"),
  input_audio: PromptChatApiInputAudio,
});
export type PromptChatApiAudioPart = z.infer<typeof PromptChatApiAudioPart>;

/** A file, base64 encoded, or by the provider's file id. */
export const PromptChatApiFileRef = z.looseObject({
  file_data: z.string().nullish(),
  file_id: z.string().nullish(),
  filename: z.string().nullish(),
});
export type PromptChatApiFileRef = z.infer<typeof PromptChatApiFileRef>;

/** A file part of a message's content. */
export const PromptChatApiFilePart = z.looseObject({ type: z.literal("file"), file: PromptChatApiFileRef });
export type PromptChatApiFilePart = z.infer<typeof PromptChatApiFilePart>;

/** The LLM's refusal, as a part of a message's content. */
export const PromptChatApiRefusalPart = z.looseObject({ type: z.literal("refusal"), refusal: z.string() });
export type PromptChatApiRefusalPart = z.infer<typeof PromptChatApiRefusalPart>;

/** A part of a message whose content is a list of parts, by its `type`. */
export const PromptChatApiContentPart = z.discriminatedUnion("type", [
  PromptChatApiTextPart,
  PromptChatApiImagePart,
  PromptChatApiAudioPart,
  PromptChatApiFilePart,
  PromptChatApiRefusalPart,
]);
export type PromptChatApiContentPart = z.infer<typeof PromptChatApiContentPart>;

/** The function that a tool call calls. */
export const PromptChatApiFunctionCall = z.looseObject({
  name: z.string(),
  /** The function's arguments, as a JSON string. */
  arguments: z.string(),
});
export type PromptChatApiFunctionCall = z.infer<typeof PromptChatApiFunctionCall>;

/** A tool call of an assistant message. */
export const PromptChatApiToolCall = z.looseObject({
  id: z.string(),
  type: z.string().default("function"),
  function: PromptChatApiFunctionCall,
});
export type PromptChatApiToolCall = z.infer<typeof PromptChatApiToolCall>;

/**
 * A message of a chat thread, in the format of the OpenAI api.
 *
 * Smarter adds its own roles: `smarter` for informational messages (e.g. the prompt's
 * configuration, the tools presented to the LLM, and its token charges), and `smarter_error`. These
 * are saved in the session's history, and are never sent to the LLM.
 */
export const PromptChatApiMessage = z.looseObject({
  /** system, assistant, user, tool, smarter or smarter_error. */
  role: z.string(),
  /** The message's text, or a list of content parts. */
  content: z.union([z.string(), z.array(PromptChatApiContentPart)]).nullish(),
  /** An assistant message's tool calls. */
  tool_calls: z.array(PromptChatApiToolCall).nullish(),
  /** The tool call that a tool message answers. */
  tool_call_id: z.string().nullish(),
  /** The name of a tool message's function. */
  name: z.string().nullish(),
});
export type PromptChatApiMessage = z.infer<typeof PromptChatApiMessage>;

/**
 * A message's text: its content, or the text of its text parts, joined by blank lines.
 *
 * @param message - The message.
 * @returns The text, or an empty string.
 */
export function messageText(message: PromptChatApiMessage): string {
  if (typeof message.content === "string") return message.content;
  if (!message.content) return "";
  return message.content
    .filter((part): part is PromptChatApiTextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

/** The `metadata` of a chat response. */
export const PromptChatApiJournalMetadata = z.looseObject({
  /** The journal's command, e.g. `prompt`. */
  command: z.string().nullish(),
  /** The journal's thing, e.g. `LLMClient`. */
  thing: z.string().nullish(),
  key: z.string().nullish(),
});
export type PromptChatApiJournalMetadata = z.infer<typeof PromptChatApiJournalMetadata>;

/** The `error` of a chat error response. */
export const PromptChatApiErrorBody = z.looseObject({
  /** The name of the error's class, e.g. `NotFound` or `LLMProviderError`. */
  errorClass: z.string(),
  /** A human-readable description. */
  description: z.string(),
  /** The http status. */
  status: z.number().int(),
});
export type PromptChatApiErrorBody = z.infer<typeof PromptChatApiErrorBody>;

/** A chat error response. */
export const PromptChatApiErrorResponse = z.looseObject({
  error: PromptChatApiErrorBody,
  api: z.string().nullish(),
  metadata: PromptChatApiJournalMetadata.nullish(),
});
export type PromptChatApiErrorResponse = z.infer<typeof PromptChatApiErrorResponse>;

/** The fields that every chat response adds beside `data`. */
export const PromptChatApiEnvelope = z.looseObject({
  /** The api version, e.g. `smarter.sh/v1`. */
  api: z.string(),
  metadata: PromptChatApiJournalMetadata.default({}),
});
export type PromptChatApiEnvelope = z.infer<typeof PromptChatApiEnvelope>;

// ------------------------------------------------------------------------------
// the configuration api
// ------------------------------------------------------------------------------

/** The colors of one section of the chat ui. */
export const PromptChatApiStyleSection = z.looseObject({
  background_color: z.string().nullish(),
  color: z.string().nullish(),
  border_color: z.string().nullish(),
  info_color: z.string().nullish(),
  link_color: z.string().nullish(),
  editor_background_color: z.string().nullish(),
  placeholder_color: z.string().nullish(),
});
export type PromptChatApiStyleSection = z.infer<typeof PromptChatApiStyleSection>;

/** The LLMClient's chat ui styles. */
export const PromptChatApiStyles = z.looseObject({
  app_logo_url: z.string().nullish(),
  app_background_image_url: z.string().nullish(),
  app_background_image_size: z.string().nullish(),
  assistant_avatar_url: z.string().nullish(),
  user_avatar_url: z.string().nullish(),
  font_family: z.string().nullish(),
  google_font: z.string().nullish(),
  font_size: z.string().nullish(),
  border_radius: z.string().nullish(),
  main_container: PromptChatApiStyleSection.nullish(),
  conversation_header: PromptChatApiStyleSection.nullish(),
  message_list: PromptChatApiStyleSection.nullish(),
  incoming_message: PromptChatApiStyleSection.nullish(),
  outgoing_message: PromptChatApiStyleSection.nullish(),
  message_input: PromptChatApiStyleSection.nullish(),
  buttons: PromptChatApiStyleSection.nullish(),
  typing_indicator: PromptChatApiStyleSection.nullish(),
});
export type PromptChatApiStyles = z.infer<typeof PromptChatApiStyles>;

/** The LLMClient, as its configuration describes it. */
export const PromptChatApiLLMClient = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  /** The url of the LLMClient's prompt api. */
  url_llmclient: z.string().nullish(),
  version: z.string().nullish(),
  deployed: z.boolean().nullish(),
  provider: z.string().nullish(),
  default_model: z.string().nullish(),
  /** The system prompt of a new chat session. */
  default_system_role: z.string().nullish(),
  app_name: z.string().nullish(),
  app_assistant: z.string().nullish(),
  app_welcome_message: z.string().nullish(),
  app_example_prompts: z.array(z.string()).nullish(),
  app_placeholder: z.string().nullish(),
  app_info_url: z.string().nullish(),
  app_file_attachment: z.boolean().nullish(),
  styles: PromptChatApiStyles.nullish(),
  /** The number of the LLMClient's extensions, plugins and MCPClients. */
  total_tools: z.number().int().nullish(),
});
export type PromptChatApiLLMClient = z.infer<typeof PromptChatApiLLMClient>;

/** The fields of a Django row that the contract returns. */
export const PromptChatApiOrmModel = z.looseObject({
  id: z.number().int(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});
export type PromptChatApiOrmModel = z.infer<typeof PromptChatApiOrmModel>;

/** A plugin's metadata. */
export const PromptChatApiPluginMeta = PromptChatApiOrmModel.extend({
  name: z.string(),
  description: z.string().nullish(),
  version: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  annotations: z.union([z.array(JsonObject), JsonObject]).nullish(),
  /** api, skill, sql, static, websearch or imagesearch. */
  plugin_class: z.string(),
});
export type PromptChatApiPluginMeta = z.infer<typeof PromptChatApiPluginMeta>;

/** A plugin of the LLMClient. */
export const PromptChatApiLLMClientPlugin = PromptChatApiOrmModel.extend({
  llmclient: z.number().int(),
  plugin_meta: PromptChatApiPluginMeta,
});
export type PromptChatApiLLMClientPlugin = z.infer<typeof PromptChatApiLLMClientPlugin>;

/** An extension of the LLMClient, whose tools it offers the LLM. */
export const PromptChatApiLLMClientExtension = PromptChatApiOrmModel.extend({
  llmclient: z.number().int(),
  /** The Extension's id. */
  extension: z.number().int(),
  /** The Extension's slug, e.g. `weather`. */
  name: z.string(),
  /** The Extension's installed version, e.g. `1.0.0`. */
  version: z.string().nullish(),
  /** Whether the Extension is enabled, so that its tools are offered. */
  enabled: z.boolean(),
});
export type PromptChatApiLLMClientExtension = z.infer<typeof PromptChatApiLLMClientExtension>;

/** The prompt api's request body. */
export const PromptChatApiPromptRequest = z.looseObject({
  session_key: z.string().nullish(),
  messages: z.array(PromptChatApiMessage),
});
export type PromptChatApiPromptRequest = z.infer<typeof PromptChatApiPromptRequest>;

/** A request that Smarter sent to the LLM. */
export const PromptChatApiLLMClientRequest = PromptChatApiOrmModel.extend({
  llmclient: z.number().int(),
  request: PromptChatApiPromptRequest.nullish(),
  session_key: z.string().nullish(),
  is_aggregation: z.boolean().nullish(),
});
export type PromptChatApiLLMClientRequest = z.infer<typeof PromptChatApiLLMClientRequest>;

/** A tool call of the chat session. */
export const PromptChatApiPromptToolCall = PromptChatApiOrmModel.extend({
  prompt: z.number().int(),
  plugin: z.number().int().nullish(),
  function_name: z.string().nullish(),
  function_args: z.string().nullish(),
  request: JsonValue.nullish(),
  response: JsonValue.nullish(),
});
export type PromptChatApiPromptToolCall = z.infer<typeof PromptChatApiPromptToolCall>;

/** A use of a plugin in the chat session. */
export const PromptChatApiPromptPluginUsage = PromptChatApiOrmModel.extend({
  prompt: z.number().int(),
  plugin: z.number().int(),
  input_text: z.string().nullish(),
});
export type PromptChatApiPromptPluginUsage = z.infer<typeof PromptChatApiPromptPluginUsage>;

/** A plugin selector's decision in the chat session. */
export const PromptChatApiPluginSelection = PromptChatApiOrmModel.extend({
  plugin_selector: z.number().int(),
  search_term: z.string().nullish(),
  messages: z.array(PromptChatApiMessage).nullish(),
  session_key: z.string().nullish(),
});
export type PromptChatApiPluginSelection = z.infer<typeof PromptChatApiPluginSelection>;

/**
 * The chat session's history.
 *
 * `prompt_tool_call_history` is in the complete configuration, with `verbose`. The other histories
 * are returned only to the cli.
 */
export const PromptChatApiHistory = z.looseObject({
  /** The session's messages, which restore the chat thread. */
  chat_history: z.array(PromptChatApiMessage).default([]),
  /** The session's tool calls, with `verbose`. */
  prompt_tool_call_history: z.array(PromptChatApiPromptToolCall).nullish(),
  prompt_plugin_usage_history: z.array(PromptChatApiPromptPluginUsage).nullish(),
  plugin_selector_history: z.array(PromptChatApiPluginSelection).nullish(),
  llmclient_request_history: z.array(PromptChatApiLLMClientRequest).nullish(),
});
export type PromptChatApiHistory = z.infer<typeof PromptChatApiHistory>;

/**
 * The LLMClient's state.
 *
 * The complete configuration, with `verbose`, adds the rest of the platform's description of the LLMClient.
 */
export const PromptChatApiMetaData = z.looseObject({
  ready: z.boolean().nullish(),
  is_valid: z.boolean().nullish(),
  is_deployed: z.boolean().nullish(),
  /** True if the request's host is a custom domain. */
  is_custom_domain: z.boolean().nullish(),
  /** True if the LLMClient requires a Smarter api key, or a logged-in user. */
  is_authentication_required: z.boolean().nullish(),
});
export type PromptChatApiMetaData = z.infer<typeof PromptChatApiMetaData>;

/** The counts of a list of the LLMClient's plugins or extensions. */
export const PromptChatApiListMetaData = z.looseObject({
  total_plugins: z.number().int().nullish(),
  plugins_returned: z.number().int().nullish(),
  total_extensions: z.number().int().nullish(),
  extensions_returned: z.number().int().nullish(),
});
export type PromptChatApiListMetaData = z.infer<typeof PromptChatApiListMetaData>;

/** The LLMClient's plugins. The list itself is returned only in the complete configuration, with `verbose`. */
export const PromptChatApiPluginList = z.looseObject({
  meta_data: PromptChatApiListMetaData,
  plugins: z.array(PromptChatApiLLMClientPlugin).default([]),
});
export type PromptChatApiPluginList = z.infer<typeof PromptChatApiPluginList>;

/** The LLMClient's extensions. The list itself is returned only in the complete configuration, with `verbose`. */
export const PromptChatApiExtensionList = z.looseObject({
  meta_data: PromptChatApiListMetaData,
  extensions: z.array(PromptChatApiLLMClientExtension).default([]),
});
export type PromptChatApiExtensionList = z.infer<typeof PromptChatApiExtensionList>;

/**
 * An LLMClient's chat configuration: the LLMClient, the chat session's key and history, and its plugins and extensions.
 *
 * A new session's configuration has an empty history. Pass its `session_key` to the prompt api to
 * continue the session.
 */
export const PromptChatApiConfig = z.looseObject({
  contract: z.number().int().default(CHAT_CONTRACT_V2),
  /** The chat session's key. */
  session_key: z.string(),
  /** True for a workbench url. */
  sandbox_mode: z.boolean(),
  /** The platform's `ENABLE_REACTAPP_DEBUG_MODE` waffle switch. */
  debug_mode: z.boolean(),
  meta_data: PromptChatApiMetaData,
  llmclient: PromptChatApiLLMClient,
  history: PromptChatApiHistory,
  plugins: PromptChatApiPluginList,
  extensions: PromptChatApiExtensionList.nullish(),
});
export type PromptChatApiConfig = z.infer<typeof PromptChatApiConfig>;

/** The configuration api's request body. */
export const PromptChatApiConfigRequest = z.looseObject({
  /** The chat session's key, or null for a new session. */
  session_key: z.string().nullish(),
});
export type PromptChatApiConfigRequest = z.infer<typeof PromptChatApiConfigRequest>;

/** The configuration api's response. */
export const PromptChatApiConfigResponse = PromptChatApiEnvelope.extend({ data: PromptChatApiConfig });
export type PromptChatApiConfigResponse = z.infer<typeof PromptChatApiConfigResponse>;

// ------------------------------------------------------------------------------
// the prompt api
// ------------------------------------------------------------------------------

/** A choice of a chat completion. */
export const PromptChatApiChoice = z.looseObject({
  index: z.number().int().default(0),
  /** e.g. stop, length or tool_calls. */
  finish_reason: z.string().nullish(),
  message: PromptChatApiMessage.nullish(),
});
export type PromptChatApiChoice = z.infer<typeof PromptChatApiChoice>;

/** The breakdown of a completion's tokens. */
export const PromptChatApiTokenDetails = z.looseObject({
  reasoning_tokens: z.number().int().nullish(),
  cached_tokens: z.number().int().nullish(),
  audio_tokens: z.number().int().nullish(),
});
export type PromptChatApiTokenDetails = z.infer<typeof PromptChatApiTokenDetails>;

/** A chat completion's token usage. */
export const PromptChatApiUsage = z.looseObject({
  prompt_tokens: z.number().int().nullish(),
  completion_tokens: z.number().int().nullish(),
  total_tokens: z.number().int().nullish(),
  prompt_tokens_details: PromptChatApiTokenDetails.nullish(),
  completion_tokens_details: PromptChatApiTokenDetails.nullish(),
});
export type PromptChatApiUsage = z.infer<typeof PromptChatApiUsage>;

/** The LLM's chat completion, in the format of the OpenAI api. */
export const PromptChatApiCompletion = z.looseObject({
  id: z.string().nullish(),
  object: z.string().nullish(),
  created: z.number().int().nullish(),
  model: z.string().nullish(),
  choices: z.array(PromptChatApiChoice).default([]),
  usage: PromptChatApiUsage.nullish(),
  system_fingerprint: z.string().nullish(),
  service_tier: z.string().nullish(),
});
export type PromptChatApiCompletion = z.infer<typeof PromptChatApiCompletion>;

/** The result of a prompt. */
export const PromptChatApiPromptResult = z.looseObject({
  contract: z.number().int().default(CHAT_CONTRACT_V2),
  /** The prompt's http status: 200, or the LLM provider's error status. */
  status: z.number().int(),
  /** The messages that the prompt added to the chat thread, in order. */
  messages: z.array(PromptChatApiMessage).default([]),
  /** The LLM's chat completion. */
  completion: PromptChatApiCompletion.nullish(),
  /** The plugins that Smarter selected. */
  plugins: z.array(z.string()).default([]),
  /** The functions that the LLM could call. */
  tools: z.array(z.string()).default([]),
});
export type PromptChatApiPromptResult = z.infer<typeof PromptChatApiPromptResult>;

/**
 * The text of the LLM's final reply: the last assistant message that has content, or an empty string.
 *
 * @param result - A prompt's result, e.g. a prompt response's `data`.
 * @returns The text.
 */
export function promptText(result: PromptChatApiPromptResult): string {
  const assistant = result.messages.filter((message) => message.role === "assistant");
  for (let i = assistant.length - 1; i >= 0; i--) {
    const message = assistant[i];
    const text = message === undefined ? "" : messageText(message);
    if (text) return text;
  }
  return "";
}

/**
 * The prompt api's response.
 *
 * A failed prompt has `error` too, and its `data.messages` include a `smarter_error` message. The SDK
 * adds a non-enumerable `text` getter to the responses that it returns: see {@link promptText}.
 */
export const PromptChatApiPromptResponse = PromptChatApiEnvelope.extend({
  data: PromptChatApiPromptResult,
  error: PromptChatApiErrorBody.nullish(),
});
export type PromptChatApiPromptResponse = z.infer<typeof PromptChatApiPromptResponse>;

/** A prompt response, with the text of the LLM's final reply. */
export type PromptResponse = PromptChatApiPromptResponse & {
  /** The text of the LLM's final reply. See {@link promptText}. */
  readonly text: string;
};

/**
 * Add the non-enumerable `text` getter to a prompt response.
 *
 * @param response - The response.
 * @returns The same object, as a {@link PromptResponse}.
 */
export function withPromptText(response: PromptChatApiPromptResponse): PromptResponse {
  if (!Object.prototype.hasOwnProperty.call(response, "text")) {
    Object.defineProperty(response, "text", {
      get: () => promptText(response.data),
      enumerable: false,
      configurable: true,
    });
  }
  return response as PromptResponse;
}

// ------------------------------------------------------------------------------
// the prompt's Server-Sent Events
// ------------------------------------------------------------------------------

/**
 * The data of a `progress` event: a step of a running prompt.
 *
 * Events may carry more fields, depending on their type, e.g. `tool` and `arguments`.
 */
export const PromptChatApiProgressEvent = z.looseObject({
  /** llm_request, tool_requested, tool_responded, plugin_called, mcp_tool_called, mcp_tool_responded or mcp_tool_failed. */
  type: z.string(),
  /** A short sentence, which a chat ui can display as is. */
  message: z.string(),
});
export type PromptChatApiProgressEvent = z.infer<typeof PromptChatApiProgressEvent>;

/** The data of the final `result` event. */
export const PromptChatApiProgressResult = z.looseObject({
  /** The prompt's http status. */
  status: z.number().int(),
  /** Exactly the JSON of a non-streaming response. */
  response: z.union([PromptChatApiPromptResponse, PromptChatApiErrorResponse]),
});
export type PromptChatApiProgressResult = z.infer<typeof PromptChatApiProgressResult>;
