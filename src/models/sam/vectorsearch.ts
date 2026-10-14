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
