/**
 * The SAM type of the `Account` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Account
 */
export interface SAMAccount {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMAccountMetadata;
  spec: SAMAccountSpec;
  /**
   * Account.status[obj]: Optional, Read-only. Stateful status information about the Account.
   */
  status?: SAMAccountStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Account.metadata[obj]: Required, the Account metadata.
 */
export interface SAMAccountMetadata {
  /**
   * Account.metadata.accountNumber[str]. Your preassigned 12-digit account number for your Smarter Account in the format '####-####-####'. Read only.
   */
  accountNumber?: string | null;
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
 * Account.spec[obj]: Required, the Account specification.
 */
export interface SAMAccountSpec {
  config: SAMAccountSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * Account.spec.config[object]. The configuration for the Account.
 */
export interface SAMAccountSpecConfig {
  /**
   * Account.spec.configuration.address1[str]. The primary address for the Account.
   */
  address1?: string | null;
  /**
   * Account.spec.configuration.address2[str]. Optional. The secondary address for the Account.
   */
  address2?: string | null;
  /**
   * Account.spec.configuration.city[str]. The city for the Account.
   */
  city?: string | null;
  /**
   * Account.spec.configuration.companyName[str]. The legal entity of your Smarter Account for invoicing and legal correspondence.
   */
  companyName: string;
  /**
   * Account.spec.configuration.country[str]. The ISO 3166 country code for the Account. Default: USA.
   */
  country?: string;
  /**
   * Account.spec.configuration.currency[str]. The primary ISO 4217 currency for the Account. Default: USD.
   */
  currency?: string;
  /**
   * Account.spec.configuration.language[str]. The primary BCP 47 language tag for the Account. Default: en-US.
   */
  language?: string;
  /**
   * Account.spec.configuration.phoneNumber[str]. The primary phone number for the Account.
   */
  phoneNumber?: string | null;
  /**
   * Account.spec.configuration.postalCode[str]. The postal code for the Account.
   */
  postalCode?: string | null;
  /**
   * Account.spec.configuration.state[str]. The state for the Account.
   */
  state?: string | null;
  /**
   * Account.spec.configuration.timezone[str]. The primary IANA timezone for the Account. Default: America/New_York.
   */
  timezone?: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Account Manifest - Status class.
 */
export interface SAMAccountStatus {
  /**
   * Account.status.adminAccount: The designated Smarter admin user for this Account. Read only.
   */
  adminAccount: string;
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
