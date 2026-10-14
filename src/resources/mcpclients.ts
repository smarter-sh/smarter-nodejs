/**
 * MCPClients: the platform's connections to Model Context Protocol servers.
 *
 * @example
 * ```ts
 * const tools = await client.mcpClients.tools(1);
 * const result = await client.mcpClients.callTool(1, "aws___search_documentation", { search_phrase: "S3" });
 * console.log(result.content);
 * ```
 */

import type { RequestOptions } from "../core/http.ts";
import type { JsonValue, SmarterId } from "../core/typing.ts";
import { MCPClient, MCPClientStatus, MCPClientTools, MCPToolResult } from "../models/mcpclient.ts";
import { resourceId, SmarterKindResource } from "./base.ts";

/** MCPClients: `/api/v1/mcpclients/`, and the manifest api's `MCPClient` kind. */
export class MCPClients extends SmarterKindResource<typeof MCPClient> {
  readonly kind = "MCPClient";
  readonly path = "mcpclients/";
  readonly model = MCPClient;

  /**
   * The tools that an MCPClient allows the LLM to call, from the server's cached catalog.
   *
   * @param id - The MCPClient's id or hashed id.
   * @param options - `refresh`: true to read the catalog from the server now.
   * @returns The connection's state, the server's instructions, and the tools.
   */
  async tools(id: SmarterId, options?: RequestOptions & { refresh?: boolean }): Promise<MCPClientTools> {
    return this.http.request("GET", `${this.path}${resourceId(id)}/tools/`, MCPClientTools, {
      ...options,
      params: { refresh: options?.refresh ? true : undefined },
    });
  }

  /**
   * Reconnect to an MCPClient's server, and reload its catalog. Only the owner may refresh.
   *
   * @param id - The MCPClient's id or hashed id.
   * @param options - Per-request options.
   * @returns The connection's state.
   */
  async refresh(id: SmarterId, options?: RequestOptions): Promise<MCPClientStatus> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/refresh/`, MCPClientStatus, options);
  }

  /**
   * Call one of an MCPClient's tools. Only the owner may call tools.
   *
   * @param id - The MCPClient's id or hashed id.
   * @param tool - The tool's name.
   * @param args - The tool's arguments, as its input schema describes them.
   * @param options - Per-request options.
   * @returns The tool's result. Check `isError`: a tool reports its own failures in its result.
   */
  async callTool(
    id: SmarterId,
    tool: string,
    args: Record<string, JsonValue> = {},
    options?: RequestOptions,
  ): Promise<MCPToolResult> {
    return this.http.request("POST", `${this.path}${resourceId(id)}/tools/${resourceId(tool)}/`, MCPToolResult, {
      ...options,
      json: args,
    });
  }
}
