/**
 * The SAM type of the `Proxy` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Proxy.
 */
export interface SAMProxy {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMProxyMetadata;
  spec: SAMProxySpec;
  /**
   * Proxy.status[obj]: Optional, Read-only. Stateful status information about the Proxy.
   */
  status?: SAMProxyStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Proxy.metadata[obj]: Required, the Proxy metadata.
 */
export interface SAMProxyMetadata {
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
 * Proxy.spec[obj]: Required, the Proxy specification.
 */
export interface SAMProxySpec {
  /**
   * Proxy.spec.allowedPaths[list]: glob patterns of the paths, relative to baseUrl, that callers may use, e.g. chat/completions or models/*. Empty allows every path.
   */
  allowedPaths?: string[];
  /**
   * Proxy.spec.apiKey[str]: the name of the Secret that contains the provider's API key. It must belong to, or be shared with, the manifest's owner. Defaults to the Provider's API key.
   */
  apiKey?: string | null;
  auth?: SAMProxySpecAuth;
  /**
   * Proxy.spec.baseUrl[str]: the base URL of the provider's API, e.g. https://api.openai.com/v1/. Defaults to the Provider's base URL.
   */
  baseUrl?: string | null;
  /**
   * Proxy.spec.headers[dict]: other HTTP headers that are added to every request, e.g. anthropic-version. They replace the caller's headers of the same name.
   */
  headers?: {
    [k: string]: string | undefined;
  };
  /**
   * Proxy.spec.isActive[bool]: inactive Proxy refuse every request.
   */
  isActive?: boolean;
  /**
   * Proxy.spec.provider[str]: the name of the Provider whose API the Proxy forwards to, e.g. openai. It must belong to, or be shared with, the manifest's owner.
   */
  provider: string;
  /**
   * Proxy.spec.timeout[int]: the most seconds to wait for the provider's response.
   */
  timeout?: number;
  [k: string]: unknown | undefined;
}
/**
 * Proxy.spec.auth[object]: how the provider expects its API key. Defaults to Authorization: Bearer.
 */
export interface SAMProxySpecAuth {
  /**
   * Proxy.spec.auth.header[str]: the HTTP header in which the provider expects its API key, e.g. Authorization (OpenAI), x-api-key (Anthropic) or x-goog-api-key (Google Gemini).
   */
  header?: string;
  /**
   * Proxy.spec.auth.scheme[str]: the prefix of the API key in the header, e.g. Bearer. Empty or null for none, e.g. for x-api-key.
   */
  scheme?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Proxy Manifest - Status class.
 *
 * Read only. Besides ownership, it reports where the Proxy is, and where it forwards to.
 */
export interface SAMProxyStatus {
  /**
   * Proxy.status.accountNumber: The account owner of this Proxy. Read only.
   */
  accountNumber: string;
  /**
   * Proxy.status.apiKeySecret: The name of the Secret whose API key is added to requests: spec.apiKey, else the Provider's. None if there is none. Read only.
   */
  apiKeySecret?: string | null;
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
   * Proxy.status.upstreamUrl: The base URL of the provider's API, to which requests are forwarded: spec.baseUrl, else the Provider's. Read only.
   */
  upstreamUrl?: string | null;
  /**
   * Proxy.status.url: The URL of the Proxy's passthrough endpoint, to use as the base URL of the provider's SDK. Read only.
   */
  url?: string | null;
  /**
   * Proxy.status.username: The Smarter user who created this Proxy. Read only.
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
