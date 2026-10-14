/**
 * The SAM type of the `CustomDomain` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - CustomDomain.
 */
export interface SAMCustomDomain {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMCustomDomainMetadata;
  spec: SAMCustomDomainSpec;
  /**
   * CustomDomain.status[obj]: Optional, Read-only. Stateful status information about the CustomDomain.
   */
  status?: SAMCustomDomainStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * CustomDomain.metadata[obj]: Required, the CustomDomain metadata.
 */
export interface SAMCustomDomainMetadata {
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
 * CustomDomain.spec[obj]: Required, the CustomDomain specification.
 */
export interface SAMCustomDomainSpec {
  config: SAMCustomDomainSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * CustomDomain.spec.config[object]. Required. The configuration of the CustomDomain.
 */
export interface SAMCustomDomainSpecConfig {
  /**
   * CustomDomain.spec.config.domainName[str]. Required. The domain name, e.g. 'llmclients.example.com'. It cannot be changed once the domain has been registered.
   */
  domainName: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API CustomDomain Manifest - Status class.
 *
 * Read only. Besides ownership, it reports the domain's AWS Route53 hosted zone, whether
 * the domain is verified, and its DNS records. The LLMClient that uses it is reported in
 * ``dependencies``.
 */
export interface SAMCustomDomainStatus {
  /**
   * CustomDomain.status.accountNumber: The account owner of this CustomDomain. Read only.
   */
  accountNumber: string;
  /**
   * CustomDomain.status.awsHostedZoneId: The AWS Route53 hosted zone of this CustomDomain, once it is registered with smarter deploy. Read only.
   */
  awsHostedZoneId?: string | null;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * CustomDomain.status.dnsRecords: The DNS records of this CustomDomain. Read only.
   */
  dnsRecords?: string[];
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * CustomDomain.status.username: The Smarter user who created this CustomDomain. Read only.
   */
  username: string;
  /**
   * CustomDomain.status.verificationMessage: Why the domain is not verified yet, or why its verification failed. Read only.
   */
  verificationMessage?: string | null;
  /**
   * CustomDomain.status.verificationStatus: Not Verified, Verifying, Verified or Failed. The domain is Verified when its NS records are delegated to its hosted zone, and its TLS certificate is issued. Read only.
   */
  verificationStatus?: string;
  /**
   * CustomDomain.status.verifiedAt: When the domain was verified. Read only.
   */
  verifiedAt?: string | null;
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
