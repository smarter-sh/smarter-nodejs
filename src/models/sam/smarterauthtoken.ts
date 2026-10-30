/**
 * The SAM type of the `SmarterAuthToken` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - SmarterAuthToken
 */
export interface SAMSmarterAuthToken {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMSmarterAuthTokenMetadata;
  spec: SAMSmarterAuthTokenSpec;
  /**
   * SmarterAuthToken.status[obj]: Optional, Read-only. Stateful status information about the SmarterAuthToken.
   */
  status?: SAMSmarterAuthTokenStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * SmarterAuthToken.metadata[obj]: Required, the SmarterAuthToken metadata.
 */
export interface SAMSmarterAuthTokenMetadata {
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
 * SmarterAuthToken.spec[obj]: Required, the SmarterAuthToken specification.
 */
export interface SAMSmarterAuthTokenSpec {
  config: SAMSmarterAuthTokenSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * SmarterAuthToken.spec.config[object]. The configuration for the SmarterAuthToken.
 */
export interface SAMSmarterAuthTokenSpecConfig {
  /**
   * SmarterAuthToken.spec.configuration.isActive[bool]. Required. Whether the SmarterAuthToken is activated.
   */
  isActive?: boolean;
  /**
   * SmarterAuthToken.spec.configuration.username[str]. The Smarter username to which this SmarterAuthToken is attached.
   */
  username: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API SmarterAuthToken Manifest - Status class.
 */
export interface SAMSmarterAuthTokenStatus {
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * SmarterAuthToken.status.modified: The date in which this SmarterAuthToken was most recently used for authentication. Read only.
   */
  lastUsedAt?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
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
