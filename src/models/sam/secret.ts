/**
 * The SAM type of the `Secret` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Secret
 */
export interface SAMSecret {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMSecretMetadata;
  spec: SAMSecretSpec;
  /**
   * Secret.status[obj]: Optional, Read-only. Stateful status information about the Secret.
   */
  status?: SAMSecretStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Secret.metadata[obj]: Required, the Secret metadata.
 */
export interface SAMSecretMetadata {
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
   * Secret.metadata.name[str]. Required. The name of the secret. camelCase, no spaces, no special characters.
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
 * Secret.spec[obj]: Required, the Secret specification.
 */
export interface SAMSecretSpec {
  config: SAMSecretSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * Secret.spec.config[object]. The configuration for the Secret.
 */
export interface SAMSecretSpecConfig {
  /**
   * Secret.spec.configuration.expiration_date[str]. Optional. The expiration date of the Secret.
   */
  expiration_date?: string | null;
  /**
   * Secret.spec.configuration.value[str]. Required. The unencrypted value of the Secret.
   */
  value: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Secret Manifest - Status class (read-only, like Kubernetes status attributes).
 */
export interface SAMSecretStatus {
  /**
   * Secret.status.account_number: The account owner of this Secret. Read only.
   */
  accountNumber: string;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * Secret.status.last_accessed: The date in which this Secret was most recently accessed. Read only.
   */
  last_accessed?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Secret.status.account_number: The Smarter user who created this Secret. Read only.
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
