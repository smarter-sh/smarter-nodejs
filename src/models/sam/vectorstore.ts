/**
 * The SAM type of the `Vectorstore` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Vectorstore.
 */
export interface SAMVectorstore {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMVectorstoreMetadata;
  spec: SAMVectorstoreSpec;
  /**
   * Vectorstore.status[obj]: Optional, Read-only. Stateful status information about the Vectorstore.
   */
  status?: SAMVectorstoreStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.metadata[obj]: Required, the Vectorstore metadata.
 */
export interface SAMVectorstoreMetadata {
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
 * Vectorstore.spec[obj]: Required, the Vectorstore specification.
 */
export interface SAMVectorstoreSpec {
  /**
   * Vectorstore.__init__.backend: qdrant or pinecone.
   */
  backend: "qdrant" | "pinecone";
  /**
   * Vectorstore.__init__.connection: managed only. The name of an ApiConnection with the service's URL and API key Secret, e.g. https://api.pinecone.io, or a Qdrant Cloud cluster's URL.
   */
  connection?: string | null;
  embeddings: SAMVectorstoreEmbeddings;
  /**
   * Vectorstore.__init__.hosting: self_hosted, run by Smarter on Kubernetes (qdrant only), or managed, a service reached through the ApiConnection in connection.
   */
  hosting?: "self_hosted" | "managed";
  index: SAMVectorstoreIndex;
  /**
   * Vectorstore.__init__.isActive: whether it may be used.
   */
  isActive?: boolean;
  maintenance?: SAMVectorstoreMaintenance;
  /**
   * Vectorstore.__init__.pinecone: pinecone only.
   */
  pinecone?: SAMVectorstorePinecone | null;
  /**
   * Vectorstore.__init__.selfHosted: self_hosted only.
   */
  selfHosted?: SAMVectorstoreSelfHosted | null;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.__init__.embeddings
 */
export interface SAMVectorstoreEmbeddings {
  /**
   * Vectorstore.__init__.embeddings.batchSize: chunks per embeddings request and upsert.
   */
  batchSize?: number;
  /**
   * Vectorstore.__init__.embeddings.chunkOverlap: characters shared by consecutive chunks.
   */
  chunkOverlap?: number;
  /**
   * Vectorstore.__init__.embeddings.chunkSize: characters per chunk.
   */
  chunkSize?: number;
  /**
   * Vectorstore.__init__.embeddings.dimensions: ask the model for vectors of this size, if it supports it, e.g. text-embedding-3. It must equal index.dimension.
   */
  dimensions?: number | null;
  /**
   * Vectorstore.__init__.embeddings.model: the embeddings model, e.g. text-embedding-3-small.
   */
  model: string;
  /**
   * Vectorstore.__init__.embeddings.provider: a Provider with an OpenAI-compatible embeddings API, e.g. openai.
   */
  provider: string;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.__init__.index
 */
export interface SAMVectorstoreIndex {
  /**
   * Vectorstore.__init__.index.deletionProtection: refuse to destroy the database.
   */
  deletionProtection?: boolean;
  /**
   * Vectorstore.__init__.index.dimension: of the embeddings model's vectors.
   */
  dimension: number;
  /**
   * Vectorstore.__init__.index.metric: the distance metric.
   */
  metric?: "cosine" | "euclidean" | "dotproduct";
  /**
   * Vectorstore.__init__.index.name: the index or collection's name, in lowercase letters, digits and hyphens. Defaults to the manifest's name, with the account number for a managed service.
   */
  name?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.__init__.maintenance
 */
export interface SAMVectorstoreMaintenance {
  /**
   * Vectorstore.__init__.maintenance.snapshotIntervalHours: how often.
   */
  snapshotIntervalHours?: number;
  /**
   * Vectorstore.__init__.maintenance.snapshotRetention: how many are kept. Older ones are deleted.
   */
  snapshotRetention?: number;
  /**
   * Vectorstore.__init__.maintenance.snapshots: take Qdrant snapshots, or Pinecone backups.
   */
  snapshots?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.spec.pinecone: where Pinecone runs a serverless index.
 */
export interface SAMVectorstorePinecone {
  /**
   * Vectorstore.__init__.pinecone.cloud
   */
  cloud?: "aws" | "gcp" | "azure";
  /**
   * Vectorstore.__init__.pinecone.region
   */
  region?: string;
  [k: string]: unknown | undefined;
}
/**
 * Vectorstore.spec.selfHosted: the Qdrant server that Smarter runs on Kubernetes.
 */
export interface SAMVectorstoreSelfHosted {
  /**
   * Vectorstore.__init__.selfHosted.cpu: requested, e.g. 500m.
   */
  cpu?: string;
  /**
   * Vectorstore.__init__.selfHosted.image: the Qdrant image.
   */
  image?: string;
  /**
   * Vectorstore.__init__.selfHosted.memory: requested, e.g. 1Gi.
   */
  memory?: string;
  /**
   * Vectorstore.__init__.selfHosted.storage: the size of its volume, e.g. 10Gi.
   */
  storage?: string;
  /**
   * Vectorstore.__init__.selfHosted.storageClass: of its volume. Defaults to the cluster's.
   */
  storageClass?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Vectorstore Manifest - Status class.
 *
 * Read only.
 */
export interface SAMVectorstoreStatus {
  /**
   * Vectorstore.status.accountNumber: the owner's account. Read only.
   */
  accountNumber: string;
  /**
   * Vectorstore.status.apiKeySecret: the Secret with a self-hosted database's API key.
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
   * Vectorstore.status.deployedAt: when it was deployed. Read only.
   */
  deployedAt?: string | null;
  /**
   * Vectorstore.status.documentCount: its documents.
   */
  documentCount?: number;
  /**
   * Vectorstore.status.endpoint: where it is reached.
   */
  endpoint?: string | null;
  /**
   * Vectorstore.status.indexName: the Pinecone index, or Qdrant collection.
   */
  indexName?: string | null;
  /**
   * Vectorstore.status.lastCheckedAt: when its status was last checked. Read only.
   */
  lastCheckedAt?: string | null;
  /**
   * Vectorstore.status.lastMaintenanceAt: when its maintenance last ran. Read only.
   */
  lastMaintenanceAt?: string | null;
  /**
   * Vectorstore.status.lastSnapshotAt: when its last snapshot was taken. Read only.
   */
  lastSnapshotAt?: string | null;
  /**
   * Vectorstore.status.message: why, if it failed.
   */
  message?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Vectorstore.status.snapshotCount: its snapshots, or backups.
   */
  snapshotCount?: number;
  /**
   * Vectorstore.status.username: the owner. Read only.
   */
  username: string;
  /**
   * Vectorstore.status.vectorCount: as of lastCheckedAt.
   */
  vectorCount?: number;
  /**
   * Vectorstore.status.vectorstoreStatus: pending, provisioning, ready, stopped, failed or deleting.
   */
  vectorstoreStatus: string;
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
