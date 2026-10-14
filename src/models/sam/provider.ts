/**
 * The SAM type of the `Provider` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Account
 */
export interface SAMProvider {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMProviderMetadata;
  spec: SAMProviderSpec;
  /**
   * Provider.status[obj]: Optional, Read-only. Stateful status information about the Provider.
   */
  status?: SAMProviderStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Provider.metadata[obj]: Required, the Provider metadata.
 */
export interface SAMProviderMetadata {
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
 * Provider.spec[obj]: Required, the Provider specification.
 */
export interface SAMProviderSpec {
  provider: SAMProviderSpecProvider;
  [k: string]: unknown | undefined;
}
/**
 * Provider.spec.selector[obj]: the spec for the Provider
 */
export interface SAMProviderSpecProvider {
  /**
   * The name of the Smarter Secret containing the API key to use for verification tests.
   */
  api_key?: string | null;
  /**
   * The base URL for the Provider's API.
   */
  base_url?: string | null;
  /**
   * The URL path to test connectivity with the Provider's API.
   */
  connectivity_test_path?: string | null;
  /**
   * The contact email of the Provider.
   */
  contact_email?: string | null;
  /**
   * A brief description of the Provider.
   */
  description?: string | null;
  /**
   * The documentation URL of the Provider.
   */
  docs_url?: string | null;
  /**
   * The logo of the Provider.
   */
  logo?: string | null;
  /**
   * The name of the Provider. Case sensitive. Must be unique and not empty, with no leading or trailing whitespace and no special characters. examples: 'OpenAI', 'GoogleAI', 'MetaAI'.
   */
  name: string;
  /**
   * The privacy policy URL of the Provider.
   */
  privacy_policy_url?: string | null;
  /**
   * The support email of the Provider.
   */
  support_email?: string | null;
  /**
   * The terms of service URL of the Provider.
   */
  terms_of_service_url?: string | null;
  /**
   * The website_url URL of the Provider.
   */
  website_url?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Provider Manifest - Status class.
 */
export interface SAMProviderStatus {
  /**
   * Provider.status.can_activate: Indicates whether this Provider can be activated. Read only.
   */
  can_activate?: boolean;
  /**
   * Provider.status.contact_email_verified: The date in which the contact email for this Provider was verified. Read only.
   */
  contact_email_verified?: string | null;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * Provider.status.is_active: Indicates whether this Provider is currently active. Read only.
   */
  is_active: boolean;
  /**
   * Provider.status.is_deprecated: Indicates whether this Provider is deprecated. Read only.
   */
  is_deprecated: boolean;
  /**
   * Provider.status.is_flagged: Indicates whether this Provider has been flagged for review. Read only.
   */
  is_flagged: boolean;
  /**
   * Provider.status.is_suspended: Indicates whether this Provider is currently suspended. Read only.
   */
  is_suspended: boolean;
  /**
   * Provider.status.is_verified: Indicates whether this Provider has been verified. Read only.
   */
  is_verified: boolean;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * Provider.status.ownership_requested: The Smarter user that has requested ownership of this Provider. Read only.
   */
  ownership_requested?: string | null;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Provider.status.support_email_verified: The date in which the support email for this Provider was verified. Read only.
   */
  support_email_verified?: string | null;
  /**
   * Provider.status.tos_accepted_at: The date in which the Terms of Service for this Provider were accepted. Read only.
   */
  tos_accepted_at?: string | null;
  /**
   * Provider.status.tos_accepted_by: The Smarter user that accepted the Terms of Service for this Provider. Read only.
   */
  tos_accepted_by?: string | null;
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
