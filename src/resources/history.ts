/** The history of chat sessions, tool calls and plugin uses: `/api/v1/prompts/history/`, and the Smarter Journal. */

import { z } from "zod";

import type { RequestOptions } from "../core/http.ts";
import type { SmarterId } from "../core/typing.ts";
import { JournalEntry, JournalPage } from "../models/journal.ts";
import { PromptPluginUsage, PromptSession, PromptToolCall } from "../models/misc.ts";
import { resourceId, SmarterAPIResource } from "./base.ts";

/**
 * The chat sessions of the api key's user, and their tool calls and plugin uses, newest first.
 *
 * An account admin also reads the sessions of their account's users, and a superuser every session.
 */
export class PromptHistory extends SmarterAPIResource {
  /** The history's endpoint. */
  readonly path = "prompts/history/";

  /**
   * The chat sessions.
   *
   * @param options - Per-request options.
   * @returns The sessions.
   */
  async sessions(options?: RequestOptions): Promise<PromptSession[]> {
    return this.http.request("GET", `${this.path}prompt/`, z.array(PromptSession), options);
  }

  /**
   * A chat session, by id.
   *
   * @param id - The session's id.
   * @param options - Per-request options.
   * @returns The session.
   */
  async session(id: SmarterId, options?: RequestOptions): Promise<PromptSession> {
    return this.http.request("GET", `${this.path}prompt/${resourceId(id)}/`, PromptSession, options);
  }

  /**
   * The tool calls of the chat sessions, with the LLM requests that made them.
   *
   * @param options - Per-request options.
   * @returns The tool calls.
   */
  async toolCalls(options?: RequestOptions): Promise<PromptToolCall[]> {
    return this.http.request("GET", `${this.path}tool-calls/`, z.array(PromptToolCall), options);
  }

  /**
   * A tool call, by id.
   *
   * @param id - The tool call's id.
   * @param options - Per-request options.
   * @returns The tool call.
   */
  async toolCall(id: SmarterId, options?: RequestOptions): Promise<PromptToolCall> {
    return this.http.request("GET", `${this.path}tool-calls/${resourceId(id)}/`, PromptToolCall, options);
  }

  /**
   * The plugin uses of the chat sessions.
   *
   * @param options - Per-request options.
   * @returns The plugin uses.
   */
  async pluginUsage(options?: RequestOptions): Promise<PromptPluginUsage[]> {
    return this.http.request("GET", `${this.path}plugin-usage/`, z.array(PromptPluginUsage), options);
  }

  /**
   * A plugin use, by id.
   *
   * @param id - The plugin use's id.
   * @param options - Per-request options.
   * @returns The plugin use.
   */
  async pluginUse(id: SmarterId, options?: RequestOptions): Promise<PromptPluginUsage> {
    return this.http.request("GET", `${this.path}plugin-usage/${resourceId(id)}/`, PromptPluginUsage, options);
  }
}

/** The options of a page of the journal, beside the per-request options. */
export interface JournalListOptions extends RequestOptions {
  /** The page number, from 1. */
  page?: number;
  /** Entries per page, or none for the platform's default. */
  pageSize?: number | null;
  /** Only entries whose key, thing or command contains this text. */
  search?: string | null;
  /** A sort field, e.g. `createdAt` or `-statusCode`. */
  ordering?: string | null;
}

/**
 * The Smarter Journal: a record of every journaled api request and response. Superusers only.
 *
 * Each entry's request document holds the caller's headers, including their api key, so only
 * superusers may read the journal.
 */
export class Journal extends SmarterAPIResource {
  /** The journal's endpoint. */
  readonly path = "journal/";

  /**
   * One page of the journal's entries, newest first, without their request and response documents.
   *
   * @param options - `page`, `pageSize`, `search` and `ordering`.
   * @returns The page, and its pagination.
   */
  async list(options?: JournalListOptions): Promise<JournalPage> {
    return this.http.request("GET", this.path, JournalPage, {
      ...options,
      params: {
        page: options?.page ?? 1,
        page_size: options?.pageSize,
        search: options?.search,
        ordering: options?.ordering,
      },
    });
  }

  /**
   * A journal entry, with its request and response documents.
   *
   * @param key - The entry's key: the `metadata.key` of a journaled response.
   * @param options - Per-request options.
   * @returns The entry.
   */
  async retrieve(key: string, options?: RequestOptions): Promise<JournalEntry> {
    return this.http.request("GET", `${this.path}${resourceId(key)}/`, JournalEntry, options);
  }
}
