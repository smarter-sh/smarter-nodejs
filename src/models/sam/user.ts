/**
 * The SAM type of the `User` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - User
 */
export interface SAMUser {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMUserMetadata;
  spec: SAMUserSpec;
  /**
   * User.status[obj]: Optional, Read-only. Stateful status information about the User.
   */
  status?: SAMUserStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * User.metadata[obj]: Required, the User metadata.
 */
export interface SAMUserMetadata {
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
   * User.metadata.username[str]. Required. The Django username of the user.
   */
  username: string;
  /**
   * The semantic version of the manifest. Example: 0.1.0
   */
  version: string | null;
  [k: string]: unknown | undefined;
}
/**
 * User.spec[obj]: Required, the User specification.
 */
export interface SAMUserSpec {
  config: SAMUserSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * User.spec.config[object]. The configuration for the User.
 */
export interface SAMUserSpecConfig {
  /**
   * User.spec.configuration.email[str]. The email address of the User.
   */
  email: string;
  /**
   * User.spec.configuration.firstName[str]. Optional. The first name of the User.
   */
  firstName?: string | null;
  /**
   * User.spec.configuration.isActive[bool]. Designates whether this User should be treated as active.
   */
  isActive: boolean;
  /**
   * User.spec.configuration.isStaff[bool]. Optional. Designates whether the User has admin permissions.
   */
  isStaff?: boolean | null;
  /**
   * User.spec.configuration.lastName[str]. Optional. The last name of the User.
   */
  lastName?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API User Manifest - Status class.
 */
export interface SAMUserStatus {
  /**
   * User.status.account_number: The account owner of this User. Read only.
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
   * User.status.account_number: The Smarter user who created this User. Read only.
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
