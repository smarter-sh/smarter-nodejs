/**
 * The SAM type of the `Orchestrator` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Role an LLMClient (Harness) plays within an Orchestrator.
 *
 * Values must stay aligned with
 * smarter.apps.orchestrator.models.OrchestratorHarness.Role.
 */
export type HarnessRole = "planner" | "executor" | "critic" | "router" | "summarizer" | "tool_caller";
/**
 * Coordination pattern the Orchestrator applies across its member LLMClients.
 *
 * Values must stay aligned with
 * smarter.apps.orchestrator.models.OrchestrationStrategy.
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
