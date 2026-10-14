/**
 * LLMClients: read them, prompt them, stream a prompt's progress, and hold a multi-turn chat.
 *
 * @example
 * ```ts
 * import { Smarter } from "@smarter.sh/api";
 *
 * const client = new Smarter();
 * const llmclient = await client.llmClients.find("calculator");
 *
 * // one prompt
 * const response = await client.llmClients.prompt(llmclient.id, "What is 17 times 23?");
 * console.log(response.text);
 *
 * // a conversation, which keeps its session and thread
 * const chat = await client.llmClients.chat(llmclient.id);
 * console.log((await chat.send("What is 2 to the 10th power?")).text);
 * console.log((await chat.send("And divided by 4?")).text);
 *
 * // the prompt's progress, e.g. its tool calls, while it runs
 * const stream = client.llmClients.stream(llmclient.id, "What is sin(pi / 2)?");
 * for await (const event of stream) console.log(event.message);
 * console.log(stream.response.text);
 * ```
 */

import { z } from "zod";

import { SmarterError, SmarterPromptError } from "../core/errors.ts";
import type { RequestOptions } from "../core/http.ts";
import type { ServerSentEvent } from "../core/sse.ts";
import type { JsonValue, SmarterId } from "../core/typing.ts";
import {
  LLM_MESSAGE_ROLES,
  PromptChatApiConfigResponse,
  PromptChatApiMessage,
  PromptChatApiProgressEvent,
  PromptChatApiProgressResult,
  PromptChatApiPromptResponse,
  withPromptText,
  type PromptChatApiConfig,
  type PromptResponse,
} from "../models/chat.ts";
import type { SmarterJournalMessage } from "../models/journal.ts";
import {
  LLMClient,
  LLMClientApiKey,
  LLMClientCustomDomain,
  LLMClientFunction,
  LLMClientPlugin,
} from "../models/llmclient.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** A message: a {@link PromptChatApiMessage}, e.g. `{ role: "user", content: "Hi" }`. */
export type MessageInput = PromptChatApiMessage;

/** A prompt: the text of one user message, or a list of messages. */
export type PromptInput = string | readonly MessageInput[];

/** The options of a prompt, beside the per-request options. */
export interface PromptOptions extends RequestOptions {
  /** The chat session's key, from {@link LLMClients.config}, to keep the prompt's history in that session. */
  sessionKey?: string | null | undefined;
}

/**
 * A prompt as a list of messages.
 *
 * @param prompt - A user message's text, or a list of messages.
 * @returns The messages.
 */
export function toMessages(prompt: PromptInput): PromptChatApiMessage[] {
  if (typeof prompt === "string") return [{ role: "user", content: prompt }];
  return prompt.map((message) => PromptChatApiMessage.parse(message));
}

/**
 * Messages as the prompt api's request sends them: only those that the LLM accepts.
 *
 * Smarter's own `smarter` and `smarter_error` messages are left out, as Smarter Chat leaves them out.
 * Every message keeps its `content`, even when it is null, e.g. an assistant's tool calls: the
 * platform requires the key.
 *
 * @param messages - A chat thread.
 * @returns The messages, as JSON.
 */
export function requestMessages(messages: readonly PromptChatApiMessage[]): JsonValue[] {
  const result: JsonValue[] = [];
  for (const message of messages) {
    if (!LLM_MESSAGE_ROLES.includes(message.role)) continue;
    const data: Record<string, JsonValue> = {};
    for (const [key, value] of Object.entries(message)) {
      if (value !== null && value !== undefined) data[key] = value as JsonValue;
    }
    data["content"] ??= null;
    result.push(data);
  }
  return result;
}

/**
 * A prompt whose progress is streamed as Server-Sent Events.
 *
 * Iterate it with `for await` for the {@link PromptChatApiProgressEvent} events, e.g. "Calling tool
 * calculator". The request is sent when the iteration starts, and its connection is closed when the
 * iteration ends, also when the loop exits early. When the stream has been read to its end,
 * {@link PromptStream.response} is the prompt's response, exactly as a non-streaming prompt returns it.
 */
export class PromptStream implements AsyncIterable<PromptChatApiProgressEvent> {
  readonly #events: () => AsyncGenerator<ServerSentEvent>;
  readonly #onResult: ((result: PromptChatApiProgressResult) => void) | undefined;
  #result: PromptChatApiProgressResult | undefined;
  #started = false;

  /**
   * @param events - Starts the request, and iterates its Server-Sent Events.
   * @param onResult - Called with the final `result` event, before the iteration ends.
   */
  constructor(events: () => AsyncGenerator<ServerSentEvent>, onResult?: (result: PromptChatApiProgressResult) => void) {
    this.#events = events;
    this.#onResult = onResult;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<PromptChatApiProgressEvent> {
    if (this.#started) throw new SmarterError("A prompt stream can be read only once.");
    this.#started = true;
    for await (const event of this.#events()) {
      if (event.event === "progress") {
        yield PromptChatApiProgressEvent.parse(JSON.parse(event.data));
      } else if (event.event === "result") {
        this.#result = PromptChatApiProgressResult.parse(JSON.parse(event.data));
        this.#onResult?.(this.#result);
      }
    }
  }

  /**
   * Read the stream to its end, discarding the progress events.
   *
   * @returns The prompt's response.
   */
  async untilDone(): Promise<PromptResponse> {
    const events = this[Symbol.asyncIterator]();
    while (!(await events.next()).done) {
      // the progress events are discarded.
    }
    return this.response;
  }

  /** The final `result` event, once the stream has been read: the prompt's status and response. */
  get result(): PromptChatApiProgressResult | undefined {
    return this.#result;
  }

  /**
   * The prompt's response, once the stream has been read.
   *
   * @throws {@link SmarterPromptError} If the prompt failed.
   * @throws {@link SmarterError} If the stream has not been read, or ended without a result.
   */
  get response(): PromptResponse {
    if (this.#result === undefined) {
      throw new SmarterError("The stream has not been read to its end, or it ended without a result event.");
    }
    const response = this.#result.response;
    if (response.error) throw new SmarterPromptError(response.error.description, response);
    return withPromptText(response as PromptChatApiPromptResponse);
  }
}

/**
 * A multi-turn conversation with an LLMClient.
 *
 * It keeps the chat session's key, so that the platform keeps the session's history, and the
 * thread, which it sends with each prompt as Smarter Chat does. Create one with {@link LLMClients.chat}.
 */
export class ChatSession {
  /** The LLMClient's id or hashed id. */
  readonly llmclientId: SmarterId;
  /** The chat session's configuration. */
  readonly config: PromptChatApiConfig;
  /** The chat thread. */
  messages: PromptChatApiMessage[];
  readonly #llmclients: LLMClients;

  /**
   * @param llmclients - The LLMClients resource.
   * @param llmclientId - The LLMClient's id or hashed id.
   * @param config - The chat session's configuration.
   */
  constructor(llmclients: LLMClients, llmclientId: SmarterId, config: PromptChatApiConfig) {
    this.#llmclients = llmclients;
    this.llmclientId = llmclientId;
    this.config = config;
    this.messages =
      config.history.chat_history.length > 0 ? [...config.history.chat_history] : ChatSession.#introduction(config);
  }

  /** A new thread: the LLMClient's system prompt and welcome message, as Smarter Chat starts one. */
  static #introduction(config: PromptChatApiConfig): PromptChatApiMessage[] {
    const messages: PromptChatApiMessage[] = [];
    if (config.llmclient.default_system_role)
      messages.push({ role: "system", content: config.llmclient.default_system_role });
    if (config.llmclient.app_welcome_message)
      messages.push({ role: "assistant", content: config.llmclient.app_welcome_message });
    return messages;
  }

  /** The chat session's key, with which the session can be resumed: see {@link LLMClients.chat}. */
  get sessionKey(): string {
    return this.config.session_key;
  }

  /**
   * Send a message, and add it and the prompt's messages to the thread.
   *
   * @param content - A user message's text, or a message.
   * @param options - Per-request options.
   * @returns The prompt's response. `text` is the LLM's reply.
   */
  async send(content: string | MessageInput, options?: RequestOptions): Promise<PromptResponse> {
    const thread = [...this.messages, ...toMessages(typeof content === "string" ? content : [content])];
    const response = await this.#llmclients.prompt(this.llmclientId, thread, {
      ...options,
      sessionKey: this.sessionKey,
    });
    this.messages = [...thread, ...response.data.messages];
    return response;
  }

  /**
   * Send a message, and stream the prompt's progress. The thread is updated when the stream has been read to its end.
   *
   * @param content - A user message's text, or a message.
   * @param options - Per-request options.
   * @returns The stream.
   */
  stream(content: string | MessageInput, options?: RequestOptions): ChatStream {
    const thread = [...this.messages, ...toMessages(typeof content === "string" ? content : [content])];
    const events = this.#llmclients.events(this.llmclientId, thread, { ...options, sessionKey: this.sessionKey });
    return new ChatStream(events, (messages) => {
      this.messages = [...thread, ...messages];
    });
  }
}

/** A {@link PromptStream} of a {@link ChatSession}, which adds the prompt's messages to the session's thread. */
export class ChatStream extends PromptStream {
  /**
   * @param events - Starts the request, and iterates its Server-Sent Events.
   * @param onMessages - Called with a successful prompt's messages.
   */
  constructor(events: () => AsyncGenerator<ServerSentEvent>, onMessages: (messages: PromptChatApiMessage[]) => void) {
    super(events, (result) => {
      const parsed = PromptChatApiPromptResponse.safeParse(result.response);
      if (parsed.success && !parsed.data.error) onMessages(parsed.data.data.messages);
    });
  }
}

/** LLMClients: `/api/v1/llm-clients/`, and the manifest api's `LLMClient` kind. */
export class LLMClients extends SmarterKindResource<typeof LLMClient> {
  readonly kind = "LLMClient";
  readonly path = "llm-clients/";
  readonly model = LLMClient;

  /**
   * An LLMClient's chat configuration, and a chat session.
   *
   * @param id - The LLMClient's id or hashed id.
   * @param options - `sessionKey`: an existing session's key, to resume it with its history, or none for a new session.
   * @returns The configuration, whose `session_key` identifies the session.
   */
  async config(id: SmarterId, options?: PromptOptions): Promise<PromptChatApiConfig> {
    const response = await this.http.request(
      "POST",
      `${this.path}${resourceId(id)}/config/`,
      PromptChatApiConfigResponse,
      {
        ...options,
        json: { session_key: options?.sessionKey ?? null },
      },
    );
    return response.data;
  }

  /**
   * Prompt an LLMClient.
   *
   * The platform runs the LLMClient's whole prompt: it selects plugins, calls the LLM, runs the tools
   * that the LLM calls, and applies the Guardrails. Prompts are billed by the LLM provider.
   *
   * @param id - The LLMClient's id or hashed id.
   * @param prompt - The text of one user message, or the chat thread as a list of messages.
   * @param options - `sessionKey`, the chat session's key, and per-request options.
   * @returns The response. `text` is the LLM's final reply, and `data.messages` every message that
   *   the prompt added, including Smarter's own.
   * @throws {@link APIStatusError} If the prompt failed, e.g. the LLM provider returned an error. The
   *   error's `body` is the error response.
   */
  async prompt(id: SmarterId, prompt: PromptInput, options?: PromptOptions): Promise<PromptResponse> {
    const response = await this.http.request(
      "POST",
      `${this.path}${resourceId(id)}/prompt/`,
      PromptChatApiPromptResponse,
      {
        ...options,
        json: { session_key: options?.sessionKey ?? null, messages: requestMessages(toMessages(prompt)) },
      },
    );
    return withPromptText(response);
  }

  /**
   * Prompt an LLMClient, and stream its progress: the LLM requests, tool calls and plugin calls.
   *
   * @param id - The LLMClient's id or hashed id.
   * @param prompt - The text of one user message, or the chat thread as a list of messages.
   * @param options - `sessionKey`, and per-request options. The timeout applies to each event.
   * @returns The stream. Iterate it with `for await` for the progress events.
   */
  stream(id: SmarterId, prompt: PromptInput, options?: PromptOptions): PromptStream {
    return new PromptStream(this.events(id, prompt, options));
  }

  /**
   * The Server-Sent Events of a prompt, which are requested when the iteration starts.
   *
   * @param id - The LLMClient's id or hashed id.
   * @param prompt - The prompt.
   * @param options - `sessionKey`, and per-request options.
   * @returns A function that starts the request.
   */
  events(id: SmarterId, prompt: PromptInput, options?: PromptOptions): () => AsyncGenerator<ServerSentEvent> {
    const path = `${this.path}${resourceId(id)}/prompt/`;
    const json = { session_key: options?.sessionKey ?? null, messages: requestMessages(toMessages(prompt)) };
    return () => this.http.events("POST", path, { ...options, json });
  }

  /**
   * Start or resume a conversation with an LLMClient.
   *
   * @param id - The LLMClient's id or hashed id.
   * @param options - `sessionKey`: an existing session's key, to resume it, or none for a new session.
   * @returns The chat session.
   */
  async chat(id: SmarterId, options?: PromptOptions): Promise<ChatSession> {
    return new ChatSession(this, id, await this.config(id, options));
  }

  /**
   * An LLMClient's plugins.
   *
   * @param id - The LLMClient's integer id.
   * @param options - Per-request options.
   * @returns The plugins.
   */
  async plugins(id: SmarterId, options?: RequestOptions): Promise<LLMClientPlugin[]> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/plugins/`, z.array(LLMClientPlugin), options);
  }

  /**
   * An LLMClient's built-in functions, e.g. `calculator`.
   *
   * @param id - The LLMClient's integer id.
   * @param options - Per-request options.
   * @returns The functions.
   */
  async functions(id: SmarterId, options?: RequestOptions): Promise<LLMClientFunction[]> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/functions`, z.array(LLMClientFunction), options);
  }

  /**
   * The api keys that may call an LLMClient that requires authentication.
   *
   * @param id - The LLMClient's integer id.
   * @param options - Per-request options.
   * @returns The api keys.
   */
  async apiKeys(id: SmarterId, options?: RequestOptions): Promise<LLMClientApiKey[]> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/apikeys/`, z.array(LLMClientApiKey), options);
  }

  /**
   * The custom domains of an LLMClient.
   *
   * @param id - The LLMClient's integer id.
   * @param options - Per-request options.
   * @returns The custom domains.
   */
  async customDomains(id: SmarterId, options?: RequestOptions): Promise<LLMClientCustomDomain[]> {
    return this.http.request(
      "GET",
      `${this.path}${resourceId(id)}/customdomains`,
      z.array(LLMClientCustomDomain),
      options,
    );
  }

  /**
   * Deploy an LLMClient on its own host name.
   *
   * This creates real, possibly billable infrastructure: DNS records, a TLS certificate and a
   * Kubernetes ingress.
   *
   * @param name - The LLMClient's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  async deploy(name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.client.manifests.deploy(this.kind, name, options);
  }

  /**
   * Undo an LLMClient's deployment.
   *
   * @param name - The LLMClient's name.
   * @param options - Per-request options.
   * @returns The platform's response.
   */
  async undeploy(name: string, options?: RequestOptions): Promise<SmarterJournalMessage> {
    return this.client.manifests.undeploy(this.kind, name, options);
  }
}
