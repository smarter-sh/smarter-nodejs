/**
 * The SAM type of the `ApiConnection` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Connection Manifest - ApiConnection Model
 */
export interface SAMApiConnection {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMConnectionCommonMetadata;
  spec: SAMApiConnectionSpec;
  /**
   * Connection.status[obj]: Optional, Read-only. Stateful status information about the Connection.
   */
  status?: SAMConnectionCommonStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Connection.metadata[obj]: Required, the Connection metadata.
 */
export interface SAMConnectionCommonMetadata {
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
 * ApiConnection.spec[obj]: Required, the ApiConnection specification.
 */
export interface SAMApiConnectionSpec {
  connection: ApiConnection;
  [k: string]: unknown | undefined;
}
/**
 * ApiConnection.spec.selector[obj]: the selector logic to use for the ApiConnection
 */
export interface ApiConnection {
  /**
   * The API key for authentication, if required.
   */
  apiKey?: string | null;
  /**
   * The authentication method to use. Example: 'Basic Auth', 'Token Auth'.
   */
  authMethod?: string;
  /**
   * The root domain of the API. Example: 'https://api.example.com'.
   */
  baseUrl: string;
  /**
   * The remote host of the proxy connection.
   */
  proxyHost?: string | null;
  /**
   * The password for the proxy connection.
   */
  proxyPassword?: string | null;
  /**
   * The port of the proxy connection.
   */
  proxyPort?: number | null;
  /**
   * The protocol of the proxy connection. Example: 'http', 'https'.
   */
  proxyProtocol?: string | null;
  /**
   * The username for the proxy connection.
   */
  proxyUsername?: string | null;
  /**
   * The timeout for the API request in seconds. Default is 30 seconds.
   */
  timeout?: number;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Connection Manifest - Status class.
 */
export interface SAMConnectionCommonStatus {
  /**
   * Connection.status.account_number: The account owner of this Connection. Read only.
   */
  account_number: string;
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
   * Connection.status.username: The Smarter user who created this Connection. Read only.
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
