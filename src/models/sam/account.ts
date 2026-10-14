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
