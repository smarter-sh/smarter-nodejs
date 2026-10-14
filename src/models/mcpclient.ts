/** Models of MCPClients: connections to Model Context Protocol servers, whose tools an LLMClient's LLM can call. */

import { z } from "zod";

import { JsonObject } from "../core/typing.ts";
import { SmarterResource } from "./base.ts";

/** An MCPClient: an MCP server, how to reach it, and which of its tools the LLM may call. */
export const MCPClient = SmarterResource.extend({
  /** http, sse or stdio. */
  transport: z.string().nullish(),
  endpointUrl: z.string().nullish(),
  command: z.string().nullish(),
  timeout: z.number().int().nullish(),
  authType: z.string().nullish(),
  allowedTools: z.array(z.string()).default([]),
  allowedResources: z.array(z.string()).default([]),
  includeInstructions: z.boolean().nullish(),
  cacheTtl: z.number().int().nullish(),
  isActive: z.boolean().nullish(),
  /** e.g. connected or error. */
  status: z.string().nullish(),
  priority: z.number().int().nullish(),
  protocolVersion: z.string().nullish(),
  serverName: z.string().nullish(),
  serverVersion: z.string().nullish(),
  /** The names of every tool that the server offers. */
  tools: z.array(z.string()).default([]),
  lastConnectedAt: z.string().nullish(),
  lastError: z.string().nullish(),
});
export type MCPClient = z.infer<typeof MCPClient>;

/** The connection state of an MCPClient. */
export const MCPClientStatus = z.looseObject({
  name: z.string(),
  status: z.string().nullish(),
  protocolVersion: z.string().nullish(),
  serverName: z.string().nullish(),
  serverVersion: z.string().nullish(),
  lastConnected: z.string().nullish(),
  lastError: z.string().nullish(),
  /** The error of a failed refresh. */
  error: z.string().nullish(),
});
export type MCPClientStatus = z.infer<typeof MCPClientStatus>;

/** A tool of an MCP server, which the MCPClient allows the LLM to call. */
export const MCPTool = z.looseObject({
  name: z.string(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  /** The tool's arguments, as a JSON Schema. */
  inputSchema: JsonObject.nullish(),
  readOnly: z.boolean().nullish(),
  destructive: z.boolean().nullish(),
});
export type MCPTool = z.infer<typeof MCPTool>;

/** An MCPClient's allowed tools, and the server's instructions. */
export const MCPClientTools = MCPClientStatus.extend({
  instructions: z.string().nullish(),
  tools: z.array(MCPTool).default([]),
});
export type MCPClientTools = z.infer<typeof MCPClientTools>;

/** The result of a tool call. */
export const MCPToolResult = z.looseObject({
  /** The MCPClient's name. */
  name: z.string(),
  tool: z.string(),
  isError: z.boolean().default(false),
  /** The tool's result, as text. */
  content: z.string().nullish(),
});
export type MCPToolResult = z.infer<typeof MCPToolResult>;
