/**
 * The SAM type of the `MCPClient` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - MCPClient.
 */
export interface SAMMCPClient {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMMCPClientMetadata;
  spec: SAMMCPClientSpec;
  /**
   * MCPClient.status[obj]: Optional, Read-only. Stateful status information about the MCPClient.
   */
  status?: SAMMCPClientStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * MCPClient.metadata[obj]: Required, the MCPClient metadata.
 */
export interface SAMMCPClientMetadata {
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
 * MCPClient.spec[obj]: Required, the MCPClient specification.
 */
export interface SAMMCPClientSpec {
  config: SAMMCPClientSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * MCPClient.spec.config[object]. The configuration for the MCPClient.
 */
export interface SAMMCPClientSpecConfig {
  /**
   * MCPClient.spec.config.allowedResources[list]: glob patterns of the resource URIs that the LLM may read, e.g. docs://example.com/* . Empty means none.
   */
  allowedResources?: string[] | null;
  /**
   * MCPClient.spec.config.allowedTools[list]: glob patterns of the tool names to offer the LLM, e.g. search_* . Empty means all of the tools that the server advertises.
   */
  allowedTools?: string[] | null;
  /**
   * MCPClient.spec.config.apiKeyHeader[str]: the HTTP header that carries an api_key credential.
   */
  apiKeyHeader?: string | null;
  /**
   * MCPClient.spec.config.authType[str]: how to authenticate with the MCP server. One of: ['none', 'api_key', 'bearer_token', 'oauth2']. oauth2 sends an OAuth access token, obtained elsewhere, as a bearer token.
   */
  authType?: string;
  /**
   * MCPClient.spec.config.cacheTtl[int]: seconds to cache the MCP server's tools, instructions and capabilities. 0 disables caching.
   */
  cacheTtl?: number;
  /**
   * MCPClient.spec.config.credentials[str]: the name of the Smarter Secret containing the credential. Required unless authType is none.
   */
  credentials?: string | null;
  /**
   * MCPClient.spec.config.endpointUrl[str]: the https URL of the MCP server's endpoint.
   */
  endpointUrl: string;
  /**
   * MCPClient.spec.config.headers[dict]: optional, non-secret HTTP headers to send to the MCP server. Credentials belong in a Smarter Secret, via credentials.
   */
  headers?: {
    [k: string]: string | undefined;
  } | null;
  /**
   * MCPClient.spec.config.includeInstructions[bool]: add the MCP server's instructions to the system prompt.
   */
  includeInstructions?: boolean;
  /**
   * MCPClient.spec.config.isActive[bool]: whether LLMClients use this MCPClient.
   */
  isActive?: boolean;
  /**
   * MCPClient.spec.config.priority[int]: the order in which an LLMClient's MCPClients are offered to the LLM. Lower runs first.
   */
  priority?: number;
  /**
   * MCPClient.spec.config.timeout[int]: seconds to wait for the MCP server to connect and respond.
   */
  timeout?: number;
  /**
   * MCPClient.spec.config.transport[str]: the MCP transport. One of: ['http', 'sse']. http is Streamable HTTP, and sse is the legacy HTTP+SSE transport.
   */
  transport?: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API MCPClient Manifest - Status class.
 *
 * Read only. Besides ownership, it reports the result of the last connection to the MCP server.
 */
export interface SAMMCPClientStatus {
  /**
   * MCPClient.status.account_number: The account owner of this MCPClient. Read only.
   */
  accountNumber: string;
  /**
   * MCPClient.status.connectionStatus: the result of the last connection to the MCP server: unconfigured, connected, disconnected or error. Read only.
   */
  connectionStatus?: string | null;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * MCPClient.status.lastConnected: when Smarter last connected to the MCP server. Read only.
   */
  lastConnected?: string | null;
  /**
   * MCPClient.status.lastError: the error of the last failed connection, if any. Read only.
   */
  lastError?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * MCPClient.status.protocolVersion: the MCP protocol version negotiated with the server. Read only.
   */
  protocolVersion?: string | null;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * MCPClient.status.serverName: the name that the MCP server reported. Read only.
   */
  serverName?: string | null;
  /**
   * MCPClient.status.serverVersion: the version that the MCP server reported. Read only.
   */
  serverVersion?: string | null;
  /**
   * MCPClient.status.tools: the names of the MCP server's tools that this MCPClient offers the LLM, as of the last connection. Read only.
   */
  tools?: string[] | null;
  /**
   * MCPClient.status.username: The Smarter user who created this MCPClient. Read only.
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
