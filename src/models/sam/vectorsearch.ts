/**
 * The SAM type of the `Vectorsearch` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * The retrieval strategy to use when querying the Vectorstore.
 */
export type VectorsearchSearchType = "similarity" | "similarity_score_threshold" | "mmr";

/**
 * Smarter API Manifest - Vectorsearch.
 */
export interface SAMVectorsearch {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMVectorsearchMetadata;
  spec: SAMVectorsearchSpec;
  /**
   * Vectorsearch.status[obj]: Optional, Read-only. Stateful status information about the Vectorsearch.
   */
  status?: SAMVectorsearchStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Vectorsearch.metadata[obj]: Required, the Vectorsearch metadata.
 */
export interface SAMVectorsearchMetadata {
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
 * Vectorsearch.spec[obj]: Required, the Vectorsearch specification.
 */
export interface SAMVectorsearchSpec {
  config: SAMVectorsearchSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * Vectorsearch.spec.config[object]. The configuration for the Vectorsearch.
 */
export interface SAMVectorsearchSpecConfig {
  /**
   * Optional name of the Secret used to authenticate against the Vectorstore, if required.
   */
  auth_secret_name?: string | null;
  /**
   * Number of candidate documents to fetch before MMR re-ranking. Only valid when search_type='mmr'.
   */
  fetch_k?: number | null;
  /**
   * Whether this Vectorsearch is active and eligible to be queried.
   */
  is_enabled?: boolean;
  /**
   * Number of top results to return from the search.
   */
  k?: number;
  /**
   * Diversity vs. relevance trade-off for MMR (0.0=max diversity, 1.0=max relevance). Only valid when search_type='mmr'.
   */
  lambda_mult?: number | null;
  /**
   * Optional metadata filter applied to the Vectorstore query, e.g. {'source': 'faq'}.
   */
  metadata_filter?: {
    [k: string]: unknown | undefined;
  } | null;
  /**
   * Minimum relevance score a result must meet to be included. Only valid when search_type='similarity_score_threshold'.
   */
  score_threshold?: number | null;
  search_type?: VectorsearchSearchType;
  /**
   * The name of the locally-hosted Vectorstore this search queries against.
   */
  vectorstore_name: string;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Vectorsearch Manifest - Status class.
 */
export interface SAMVectorsearchStatus {
  /**
   * Vectorsearch.status.account_number: The account owner of this Vectorsearch. Read only.
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
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Vectorsearch.status.username: The Smarter user who created this Vectorsearch. Read only.
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
