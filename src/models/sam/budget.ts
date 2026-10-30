/**
 * The SAM type of the `Budget` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Budget.
 */
export interface SAMBudget {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMBudgetMetadata;
  spec: SAMBudgetSpec;
  /**
   * Budget.status[obj]: Optional, Read-only. Stateful status information about the Budget.
   */
  status?: SAMBudgetStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Budget.metadata[obj]: Required, the Budget metadata.
 */
export interface SAMBudgetMetadata {
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
 * Budget.spec[obj]: Required, the Budget specification.
 */
export interface SAMBudgetSpec {
  config: SAMBudgetSpecConfig;
  /**
   * Budget.spec.resources[list]. The resources that the Budget is enforced on. Resources that are removed from the list are detached.
   *
   * @maxItems 1000
   */
  resources?: SAMBudgetSpecResource[];
  [k: string]: unknown | undefined;
}
/**
 * Budget.spec.config[object]. The limits of the Budget.
 */
export interface SAMBudgetSpecConfig {
  /**
   * Budget.spec.config.absoluteLimit: the most that may be spent in total, from when the budget is attached. 0 means no limit.
   */
  absoluteLimit?: number | string;
  /**
   * Budget.spec.config.action: block further charges when a limit is reached, or only warn.
   */
  action?: "block" | "warn";
  /**
   * Budget.spec.config.duration: the billing periods, from when the budget is attached, after which it no longer applies. 0 means never.
   */
  duration?: number;
  /**
   * Budget.spec.config.message: what people are told when the budget blocks their request. Defaults to a description of the limit that was reached.
   */
  message?: string | null;
  /**
   * Budget.spec.config.period: the billing period of periodicLimit and duration.
   */
  period?: "hour" | "day" | "week" | "month";
  /**
   * Budget.spec.config.periodicLimit: the most that may be spent in a billing period. 0 means no limit.
   */
  periodicLimit?: number | string;
  /**
   * Budget.spec.config.unit: what the limits measure: cost in USD, or total tokens.
   */
  unit?: "cost" | "tokens";
  /**
   * Budget.spec.config.warningThreshold: the percentage of a limit at which a warning is sent. 0 means never.
   */
  warningThreshold?: number;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Budget Manifest Budget.spec.resources[]: a resource that the budget is enforced on.
 *
 * Either kind and name, with an optional accountNumber, or a recordLocator.
 */
export interface SAMBudgetSpecResource {
  /**
   * Budget.spec.resources.accountNumber: the account that the resource belongs to. Defaults to your own.
   */
  accountNumber?: string | null;
  /**
   * Budget.spec.resources.kind: the resource's manifest kind, e.g. LLMClient.
   */
  kind?:
    | (
        | "Account"
        | "User"
        | "ApiConnection"
        | "SqlConnection"
        | "LLMClient"
        | "LLMHost"
        | "LLMHostCompute"
        | "MCPClient"
        | "Orchestrator"
        | "Provider"
        | "Proxy"
        | "Vectorsearch"
        | "ApiPlugin"
        | "SkillPlugin"
        | "SqlPlugin"
        | "StaticPlugin"
        | "WebsearchPlugin"
        | "ImageSearchPlugin"
      )
    | null;
  /**
   * Budget.spec.resources.name: the resource's name. For an Account, its account number; for a User, the username.
   */
  name?: string | null;
  /**
   * Budget.spec.resources.recordLocator: any resource's record locator, e.g. llmclient-rc2x, in place of kind and name.
   */
  recordLocator?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Budget Manifest - Status class.
 *
 * Read only.
 */
export interface SAMBudgetStatus {
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
   * Budget.status.resources: the budget versus the actual spending of each resource. Read only.
   */
  resources?: SAMBudgetStatusResource[];
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
/**
 * The budget versus the actual spending of one of the budget's resources.
 *
 * Read only.
 */
export interface SAMBudgetStatusResource {
  /**
   * Budget.status.resources.absoluteActual: spending since startDate.
   */
  absoluteActual: number | string;
  /**
   * Budget.status.resources.absolutePercent: absoluteActual, as a percentage of the limit.
   */
  absolutePercent?: number | null;
  /**
   * Budget.status.resources.expiresAt: when the budget's duration ends.
   */
  expiresAt?: string | null;
  /**
   * Budget.status.resources.isActive: whether the budget is enforced on it.
   */
  isActive: boolean;
  /**
   * Budget.status.resources.isLocked: whether the budget refuses further charges.
   */
  isLocked: boolean;
  /**
   * Budget.status.resources.lockReason: which limit was reached.
   */
  lockReason?: string | null;
  /**
   * Budget.status.resources.periodicActual: spending this billing period.
   */
  periodicActual: number | string;
  /**
   * Budget.status.resources.periodicPercent: periodicActual, as a percentage of the limit.
   */
  periodicPercent?: number | null;
  /**
   * Budget.status.resources.recordLocator: the resource's record locator.
   */
  recordLocator: string;
  /**
   * Budget.status.resources.startDate: when the budget was attached.
   */
  startDate: string;
  [k: string]: unknown | undefined;
}
