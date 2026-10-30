/**
 * The SAM type of the `Orchestrator` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * The part this LLMClient plays in the Orchestrator: planner, executor, critic, router, summarizer or tool_caller. The supervisor strategy needs a planner, and the router strategy a router.
 */
export type HarnessRole = "planner" | "executor" | "critic" | "router" | "summarizer" | "tool_caller";
/**
 * How the Orchestrator coordinates its LLMClients: sequential, parallel, supervisor, router, voting or debate. Supervisor needs a harness with role planner, router one with role router, and voting and debate at least two harnesses.
 */
export type OrchestrationStrategy = "sequential" | "parallel" | "supervisor" | "router" | "voting" | "debate";

/**
 * Smarter API Manifest - Orchestrator.
 */
export interface SAMOrchestrator {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMOrchestratorMetadata;
  spec: SAMOrchestratorSpec;
  /**
   * Orchestrator.status[obj]: Optional, Read-only. Stateful status information about the Orchestrator.
   */
  status?: SAMOrchestratorStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Orchestrator.metadata[obj]: Required, the Orchestrator metadata.
 */
export interface SAMOrchestratorMetadata {
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
 * Orchestrator.spec[obj]: Required, the Orchestrator specification.
 */
export interface SAMOrchestratorSpec {
  config: SAMOrchestratorSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * Orchestrator.spec.config[object]. The configuration for the Orchestrator.
 */
export interface SAMOrchestratorSpecConfig {
  /**
   * LLMClients (Harnesses) that participate in this Orchestrator.
   *
   * @minItems 1
   */
  harnesses: [SAMOrchestratorHarnessConfig, ...SAMOrchestratorHarnessConfig[]];
  /**
   * Whether the Orchestrator is active.
   */
  isActive?: boolean;
  /**
   * Upper bound on orchestration loop iterations.
   */
  maxIterations?: number;
  strategy?: OrchestrationStrategy;
  [k: string]: unknown | undefined;
}
/**
 * A single LLMClient (Harness) membership within the Orchestrator.
 *
 * Mirrors smarter.apps.orchestrator.models.OrchestratorHarness. The
 * llmClientName is a reference by name, not by primary key — resolved
 * against the account's existing LLMClients at apply time.
 */
export interface SAMOrchestratorHarnessConfig {
  /**
   * Per-membership overrides (e.g. temperature, system prompt fragment, tool allowlist).
   */
  config?: {
    [k: string]: unknown | undefined;
  };
  /**
   * Relative ordering for sequential/supervisor strategies.
   */
  executionOrder?: number;
  /**
   * Whether this LLMClient's membership in the Orchestrator is active.
   */
  isActive?: boolean;
  /**
   * Name of an existing LLMClient to attach as a Harness.
   */
  llmClientName: string;
  role?: HarnessRole;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Orchestrator Manifest - Status class.
 */
export interface SAMOrchestratorStatus {
  /**
   * Orchestrator.status.account_number: The account owner of this Orchestrator. Read only.
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
   * Orchestrator.status.username: The Smarter user who created this Orchestrator. Read only.
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
