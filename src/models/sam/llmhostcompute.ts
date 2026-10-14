/**
 * The SAM type of the `LLMHostCompute` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - LLMHostCompute.
 */
export interface SAMLLMHostCompute {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMLLMHostComputeMetadata;
  spec: SAMLLMHostComputeSpec;
  /**
   * LLMHostCompute.status[obj]: Optional, Read-only. Stateful status information about the LLMHostCompute.
   */
  status?: SAMLLMHostComputeStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * LLMHostCompute.metadata[obj]: Required, the LLMHostCompute metadata.
 */
export interface SAMLLMHostComputeMetadata {
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
 * LLMHostCompute.spec[obj]: Required, the LLMHostCompute specification.
 */
export interface SAMLLMHostComputeSpec {
  cost?: SAMLLMHostComputeCost;
  node: SAMLLMHostComputeNode;
  nodeGroup?: SAMLLMHostComputeNodeGroup;
  [k: string]: unknown | undefined;
}
/**
 * LLMHostCompute.spec.cost[object]: for reporting.
 */
export interface SAMLLMHostComputeCost {
  /**
   * LLMHostCompute.spec.cost.currency[str]: e.g. USD.
   */
  currency?: string;
  /**
   * LLMHostCompute.spec.cost.perHour[decimal]: the cost per hour of one node, e.g. its on-demand price.
   */
  perHour?: number | string | null;
  [k: string]: unknown | undefined;
}
/**
 * LLMHostCompute.spec.node[object]: the kind of node.
 */
export interface SAMLLMHostComputeNode {
  /**
   * LLMHostCompute.spec.node.amiType[str]: e.g. AL2023_x86_64_NVIDIA. Defaults to the NVIDIA AMI for a GPU node, else the standard AMI.
   */
  amiType?: string | null;
  /**
   * LLMHostCompute.spec.node.capacityType[str]: ON_DEMAND or SPOT.
   */
  capacityType?: string;
  /**
   * LLMHostCompute.spec.node.cpu[int]: the node's vCPUs.
   */
  cpu: number;
  /**
   * LLMHostCompute.spec.node.diskSizeGb[int]: the node's root volume, for container images. Model weights are on the LLMHosts' own volumes.
   */
  diskSizeGb?: number;
  /**
   * LLMHostCompute.spec.node.gpu[object]: the node's GPUs. None for a CPU node.
   */
  gpu?: SAMLLMHostComputeGpu | null;
  /**
   * LLMHostCompute.spec.node.instanceType[str]: e.g. g6.2xlarge.
   */
  instanceType: string;
  /**
   * LLMHostCompute.spec.node.memoryGb[int]: the node's memory, in GiB.
   */
  memoryGb: number;
  [k: string]: unknown | undefined;
}
/**
 * Spec.node.gpu: the node's GPUs.
 */
export interface SAMLLMHostComputeGpu {
  /**
   * LLMHostCompute.spec.node.gpu.count[int]: the node's GPUs.
   */
  count: number;
  /**
   * LLMHostCompute.spec.node.gpu.memoryGb[int]: the memory of one GPU, in GB.
   */
  memoryGb: number;
  /**
   * LLMHostCompute.spec.node.gpu.resource[str]: the Kubernetes extended resource that advertises the GPUs.
   */
  resource?: string;
  /**
   * LLMHostCompute.spec.node.gpu.type[str]: the GPU model, e.g. L4, A10G, H100-80GB.
   */
  type: string;
  [k: string]: unknown | undefined;
}
/**
 * LLMHostCompute.spec.nodeGroup[object]: the node group of the nodes.
 */
export interface SAMLLMHostComputeNodeGroup {
  /**
   * LLMHostCompute.spec.nodeGroup.maxNodes[int]: the most nodes that Smarter adds to the node group.
   */
  maxNodes?: number;
  /**
   * LLMHostCompute.spec.nodeGroup.subnetIds[list]: the node group's subnets. Defaults to the platform's. One subnet keeps the nodes in one availability zone, with the LLMHosts' model volumes.
   */
  subnetIds?: string[];
  [k: string]: unknown | undefined;
}
/**
 * Smarter API LLMHostCompute Manifest - Status class.
 *
 * Read only. Besides ownership, it reports the node group, as of its most recent reconcile.
 */
export interface SAMLLMHostComputeStatus {
  /**
   * LLMHostCompute.status.account_number: The account owner of this LLMHostCompute. Read only.
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
   * LLMHostCompute.status.desiredNodes: the node group's desired size. Read only.
   */
  desiredNodes?: number | null;
  /**
   * LLMHostCompute.status.lastReconciledAt: when it was last reconciled. Read only.
   */
  lastReconciledAt?: string | null;
  /**
   * LLMHostCompute.status.llmhosts: the LLMHosts that run on it. Read only.
   */
  llmhosts?: number | null;
  /**
   * LLMHostCompute.status.message: the result of the last reconcile. Read only.
   */
  message?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * LLMHostCompute.status.nodeGroupName: the cloud's name of the node group. Read only.
   */
  nodeGroupName?: string | null;
  /**
   * LLMHostCompute.status.nodeGroupStatus: e.g. absent, CREATING or ACTIVE. Read only.
   */
  nodeGroupStatus?: string | null;
  /**
   * LLMHostCompute.status.readyNodes: the nodes that have joined the cluster. Read only.
   */
  readyNodes?: number | null;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * LLMHostCompute.status.username: The Smarter user who created this LLMHostCompute. Read only.
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
