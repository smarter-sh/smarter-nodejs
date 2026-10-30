/**
 * The SAM type of the `Guardrail` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - Guardrail.
 */
export interface SAMGuardrail {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMGuardrailMetadata;
  spec: SAMGuardrailSpec;
  /**
   * Guardrail.status[obj]: Optional, Read-only. Stateful status information about the Guardrail.
   */
  status?: SAMGuardrailStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * Guardrail.metadata[obj]: Required, the Guardrail metadata.
 */
export interface SAMGuardrailMetadata {
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
 * Guardrail.spec[obj]: Required, the Guardrail specification.
 */
export interface SAMGuardrailSpec {
  config: SAMGuardrailSpecConfig;
  [k: string]: unknown | undefined;
}
/**
 * Guardrail.spec.config[object]. The configuration for the Guardrail.
 */
export interface SAMGuardrailSpecConfig {
  /**
   * Guardrail.spec.config.action[str]: what the guardrail does when it triggers. One of: ['log', 'flag', 'redact', 'transform', 'block', 'escalate'].
   */
  action: "log" | "flag" | "redact" | "transform" | "block" | "escalate";
  /**
   * Guardrail.spec.config.caseSensitive[bool]: whether the keyword strategy is case sensitive.
   */
  caseSensitive?: boolean;
  /**
   * Guardrail.spec.config.categories[list]: the moderation strategy's categories. Empty means all. Any of: ['harassment', 'harassment/threatening', 'hate', 'hate/threatening', 'illicit', 'illicit/violent', 'self-harm', 'self-harm/intent', 'self-harm/instructions', 'sexual', 'sexual/minors', 'violence', 'violence/graphic'].
   */
  categories?: string[] | null;
  /**
   * Guardrail.spec.config.category[str]: the risk the guardrail addresses. One of: ['pii', 'secrets', 'prompt_injection', 'jailbreak', 'toxicity', 'self_harm', 'hallucination', 'off_topic', 'compliance', 'formatting', 'custom'].
   */
  category?:
    | "pii"
    | "secrets"
    | "prompt_injection"
    | "jailbreak"
    | "toxicity"
    | "self_harm"
    | "hallucination"
    | "off_topic"
    | "compliance"
    | "formatting"
    | "custom";
  /**
   * Guardrail.spec.config.detectors[list]: the detector strategy's detectors. Any of: ['credit_card', 'us_ssn', 'email', 'phone_number', 'ip_address', 'iban', 'aws_access_key', 'private_key', 'api_key', 'jwt', 'password_assignment'].
   */
  detectors?: string[] | null;
  /**
   * Guardrail.spec.config.failClosed[bool]: if true, block when the check itself fails, e.g. because the LLM provider is unavailable. If false, the failure is recorded, and the prompt continues.
   */
  failClosed?: boolean;
  /**
   * Guardrail.spec.config.flags[list]: the regex strategy's flags. Any of: ['IGNORECASE', 'MULTILINE', 'DOTALL'].
   */
  flags?: string[] | null;
  /**
   * Guardrail.spec.config.isActive[bool]: whether the guardrail runs.
   */
  isActive?: boolean;
  /**
   * Guardrail.spec.config.judgePrompt[str]: the llm_judge strategy's prompt, with a {text} placeholder for the text to judge. Any other braces must be doubled, e.g. {{ and }}.
   */
  judgePrompt?: string | null;
  /**
   * Guardrail.spec.config.keywords[list]: the keyword strategy's words and phrases.
   */
  keywords?: string[] | null;
  /**
   * Guardrail.spec.config.message[str]: what block returns to the user, instead of the LLM's reply.
   */
  message?: string | null;
  /**
   * Guardrail.spec.config.mode[str]: enforce, to take the action, or monitor, to only record what the action would have been.
   */
  mode?: "enforce" | "monitor";
  /**
   * Guardrail.spec.config.model[str]: the model of the semantic, moderation and llm_judge strategies.
   */
  model?: string | null;
  /**
   * Guardrail.spec.config.pattern[str]: the regex strategy's regular expression.
   */
  pattern?: string | null;
  /**
   * Guardrail.spec.config.priority[int]: the order in which guardrails run. Lower runs first.
   */
  priority?: number;
  /**
   * Guardrail.spec.config.provider[str]: the name of the Smarter LLM Provider that the semantic, moderation and llm_judge strategies call. Defaults to openai.
   */
  provider?: string | null;
  /**
   * Guardrail.spec.config.referenceTexts[list]: the semantic strategy's examples of what to detect.
   */
  referenceTexts?: string[] | null;
  /**
   * Guardrail.spec.config.replacement[str]: what redact and transform replace each match with. Defaults to [REDACTED], which an empty replacement also means. {label} is replaced with what matched, e.g. credit_card. For the regex strategy, transform may refer to groups, e.g. \1.
   */
  replacement?: string | null;
  /**
   * Guardrail.spec.config.severity[int]: from 1 (low) to 5 (critical), for reporting and review.
   */
  severity?: number;
  /**
   * Guardrail.spec.config.stage[str]: when the guardrail runs. One of: ['input', 'output', 'both'].
   */
  stage: "input" | "output" | "both";
  /**
   * Guardrail.spec.config.strategy[str]: how the guardrail detects. One of: ['regex', 'keyword', 'detector', 'semantic', 'moderation', 'llm_judge'].
   */
  strategy: "regex" | "keyword" | "detector" | "semantic" | "moderation" | "llm_judge";
  /**
   * Guardrail.spec.config.threshold[float]: the minimum confidence, from 0 to 1, at which the semantic, moderation and llm_judge strategies trigger. Defaults to 0.8.
   */
  threshold?: number | null;
  /**
   * Guardrail.spec.config.wholeWord[bool]: whether the keyword strategy matches whole words only.
   */
  wholeWord?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API Guardrail Manifest - Status class.
 *
 * Read only. Besides ownership, it reports the guardrail's events of the last 30 days. The
 * LLMClients that use it are reported in ``dependencies``.
 */
export interface SAMGuardrailStatus {
  /**
   * Guardrail.status.account_number: The account owner of this Guardrail. Read only.
   */
  accountNumber: string;
  /**
   * Guardrail.status.blocked: how many prompts this Guardrail blocked in the last 30 days. Read only.
   */
  blocked?: number | null;
  /**
   * The date in which this resource was created. Read only.
   */
  created: string;
  /**
   * dependencies[List]: The resources that depend on this resource, and that must be deleted, or stop referring to it, before it can be deleted. Lists only the resources that you can read. Read only.
   */
  dependencies?: SAMDependency[] | null;
  /**
   * Guardrail.status.errors: how many times this Guardrail failed to run in the last 30 days. Read only.
   */
  errors?: number | null;
  /**
   * Guardrail.status.lastTriggered: when this Guardrail last triggered. Read only.
   */
  lastTriggered?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * Guardrail.status.triggered: how many times this Guardrail triggered in the last 30 days. Read only.
   */
  triggered?: number | null;
  /**
   * Guardrail.status.username: The Smarter user who created this Guardrail. Read only.
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
