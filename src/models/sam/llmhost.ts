/**
 * The SAM type of the `LLMHost` kind, generated from the Smarter platform's JSON Schema.
 *
 * Do not edit: run `make sam-models`. See `src/models/sam/index.ts`.
 */

/**
 * Smarter API Manifest - LLMHost.
 */
export interface SAMLLMHost {
  /**
   * apiVersion[String]: Required. The API version of the AbstractSAMBase.
   */
  apiVersion: string;
  /**
   * kind[String]: Required. The kind of resource described by the manifest.
   */
  kind: string;
  metadata: SAMLLMHostMetadata;
  spec: SAMLLMHostSpec;
  /**
   * LLMHost.status[obj]: Optional, Read-only. Stateful status information about the LLMHost.
   */
  status?: SAMLLMHostStatus | null;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.metadata[obj]: Required, the LLMHost metadata.
 */
export interface SAMLLMHostMetadata {
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
 * LLMHost.spec[obj]: Required, the LLMHost specification.
 */
export interface SAMLLMHostSpec {
  /**
   * LLMHost.spec.compute[str]: the LLMHostCompute that the LLMHost runs on, e.g. gpu_l4_1x. Defaults to the cheapest one that its resources fit.
   */
  compute?: string | null;
  engine: SAMLLMHostEngineConfig;
  healthCheck?: SAMLLMHostHealthCheck;
  model: SAMLLMHostModel;
  network?: SAMLLMHostNetwork;
  resources?: SAMLLMHostResources;
  scaling?: SAMLLMHostScaling;
  storage?: SAMLLMHostStorage;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.engine[object]: the inference server.
 */
export interface SAMLLMHostEngineConfig {
  /**
   * LLMHost.spec.engine.apiFormat[str]: the wire protocol. One of: ['openai_compatible', 'huggingface', 'ollama_native', 'custom'].
   */
  apiFormat?: "openai_compatible" | "huggingface" | "ollama_native" | "custom";
  /**
   * LLMHost.spec.engine.args[list]: additional arguments, passed to the engine as they are.
   */
  args?: string[];
  /**
   * LLMHost.spec.engine.command[list]: overrides the image's entrypoint. For custom engines.
   */
  command?: string[] | null;
  /**
   * LLMHost.spec.engine.contextLength[int]: the maximum context the server allocates, in tokens.
   */
  contextLength?: number | null;
  /**
   * LLMHost.spec.engine.dtype[str]: e.g. auto, bfloat16, float16.
   */
  dtype?: string | null;
  /**
   * LLMHost.spec.engine.env[dict]: additional environment variables.
   */
  env?: {
    [k: string]: string | undefined;
  };
  /**
   * LLMHost.spec.engine.gpuMemoryUtilization[float]: the fraction of GPU memory the server may use.
   */
  gpuMemoryUtilization?: number | null;
  /**
   * LLMHost.spec.engine.image[str]: the container image. Defaults to the engine's official image. Pin a version in production. Required for custom.
   */
  image?: string | null;
  /**
   * LLMHost.spec.engine.maxConcurrentRequests[int]: the requests that one replica serves at once.
   */
  maxConcurrentRequests?: number | null;
  /**
   * LLMHost.spec.engine.name[str]: the inference server. One of: ['vllm', 'tgi', 'sglang', 'llama_cpp', 'ollama', 'tei', 'custom'].
   */
  name: "vllm" | "tgi" | "sglang" | "llama_cpp" | "ollama" | "tei" | "custom";
  /**
   * LLMHost.spec.engine.port[int]: the container port. Defaults to the engine's port. Required for custom.
   */
  port?: number | null;
  /**
   * LLMHost.spec.engine.tensorParallelSize[int]: the GPUs that one replica shards the model across.
   */
  tensorParallelSize?: number | null;
  /**
   * LLMHost.spec.engine.trustRemoteCode[bool]: run Python code from the model repository. Only for repositories that you trust.
   */
  trustRemoteCode?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.healthCheck[object]: probes.
 */
export interface SAMLLMHostHealthCheck {
  /**
   * LLMHost.spec.healthCheck.path[str]: the HTTP health path. Defaults to the engine's, e.g. /health.
   */
  path?: string | null;
  /**
   * LLMHost.spec.healthCheck.periodSeconds[int]: how often the probes run.
   */
  periodSeconds?: number;
  /**
   * LLMHost.spec.healthCheck.startupTimeoutSeconds[int]: the time the server has to download and load the weights before it is restarted. Large models need more.
   */
  startupTimeoutSeconds?: number;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.model[object]: what is served.
 */
export interface SAMLLMHostModel {
  /**
   * LLMHost.spec.model.architecture[str]: e.g. llama, qwen3, gemma3.
   */
  architecture?: string | null;
  capabilities?: SAMLLMHostModelCapabilities;
  /**
   * LLMHost.spec.model.contextWindow[int]: the model's maximum context, in tokens.
   */
  contextWindow?: number | null;
  /**
   * LLMHost.spec.model.embeddingDimensions[int]: for embedding models.
   */
  embeddingDimensions?: number | null;
  /**
   * LLMHost.spec.model.file[str]: a single weights file within the repository, e.g. a GGUF file for llama_cpp. For ollama with a Hugging Face source, the quantization tag, e.g. Q4_K_M.
   */
  file?: string | null;
  /**
   * LLMHost.spec.model.license[str]: e.g. apache-2.0.
   */
  license?: string | null;
  /**
   * LLMHost.spec.model.parameterCount[int]: the number of parameters.
   */
  parameterCount?: number | null;
  /**
   * LLMHost.spec.model.quantization[str]: the weights' precision. One of: ['none', 'fp32', 'fp16', 'bf16', 'fp8', 'mxfp4', 'int8', 'int4', 'gguf', 'awq', 'gptq'].
   */
  quantization?: "none" | "fp32" | "fp16" | "bf16" | "fp8" | "mxfp4" | "int8" | "int4" | "gguf" | "awq" | "gptq";
  /**
   * LLMHost.spec.model.repository[str]: the model, in the source's terms: a Hugging Face repository id, e.g. Qwen/Qwen3-8B; an Ollama tag, e.g. llama3.1:8b; an S3 prefix, e.g. s3://bucket/models/qwen3; a URL; or, for pvc, a path within the volume.
   */
  repository: string;
  /**
   * LLMHost.spec.model.revision[str]: a Hugging Face branch, tag or commit SHA. Pin a commit SHA for reproducible deployments. Defaults to main.
   */
  revision?: string | null;
  /**
   * LLMHost.spec.model.servedName[str]: the model name that clients send in their requests. Defaults to the LLMHost's name. Ollama always uses repository.
   */
  servedName?: string | null;
  /**
   * LLMHost.spec.model.source[str]: where the weights come from. One of: ['huggingface', 'ollama', 's3', 'url', 'pvc'].
   */
  source?: "huggingface" | "ollama" | "s3" | "url" | "pvc";
  /**
   * LLMHost.spec.model.task[str]: what the model does. One of: ['text-generation', 'embedding'].
   */
  task?: "text-generation" | "embedding";
  /**
   * LLMHost.spec.model.tokenSecret[str]: the name of a Smarter Secret with a Hugging Face access token, for gated models, e.g. Llama and Gemma. You must also accept the model's license on huggingface.co.
   */
  tokenSecret?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.model.capabilities[object]: what the model can do.
 */
export interface SAMLLMHostModelCapabilities {
  /**
   * LLMHost.spec.model.capabilities.functionCalling[bool]: supports tool calls. Some engines also require args, e.g. vLLM's --enable-auto-tool-choice and --tool-call-parser.
   */
  functionCalling?: boolean;
  /**
   * LLMHost.spec.model.capabilities.reasoning[bool]: a reasoning model.
   */
  reasoning?: boolean;
  /**
   * LLMHost.spec.model.capabilities.streaming[bool]: streams responses.
   */
  streaming?: boolean;
  /**
   * LLMHost.spec.model.capabilities.vision[bool]: accepts images.
   */
  vision?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.network[object]: reachability.
 */
export interface SAMLLMHostNetwork {
  /**
   * LLMHost.spec.network.allowUnauthenticated[bool]: permit an Ingress for an engine that does not authenticate requests, e.g. tgi and ollama. Anyone who knows the hostname can use the model.
   */
  allowUnauthenticated?: boolean;
  /**
   * LLMHost.spec.network.apiKeySecret[str]: the name of a Smarter Secret with the API key that clients must send as a Bearer token. If omitted, Smarter generates one when the LLMHost is launched, and stores it in the Secret llmhost_<name>_api_key.
   */
  apiKeySecret?: string | null;
  /**
   * LLMHost.spec.network.hostname[str]: the Ingress hostname. Defaults to <name>.llmhost.<account number>.<environment API domain>.
   */
  hostname?: string | null;
  /**
   * LLMHost.spec.network.ingress[bool]: create an Ingress.
   */
  ingress?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.resources[object]: compute.
 */
export interface SAMLLMHostResources {
  /**
   * LLMHost.spec.resources.cpu[str]: the pod's CPU request, e.g. 4 or 3500m.
   */
  cpu?: string | null;
  /**
   * LLMHost.spec.resources.gpuCount[int]: the GPUs per replica. 0 runs on CPU.
   */
  gpuCount?: number;
  /**
   * LLMHost.spec.resources.gpuResource[str]: the Kubernetes extended resource, e.g. nvidia.com/gpu.
   */
  gpuResource?: string;
  /**
   * LLMHost.spec.resources.memory[str]: the pod's memory request and limit, e.g. 24Gi.
   */
  memory?: string | null;
  /**
   * LLMHost.spec.resources.nodeSelector[dict]: additional node labels.
   */
  nodeSelector?: {
    [k: string]: string | undefined;
  };
  /**
   * LLMHost.spec.resources.serviceAccountName[str]: e.g. for IRSA access to an S3 model source.
   */
  serviceAccountName?: string | null;
  /**
   * LLMHost.spec.resources.shmSize[str]: the size of /dev/shm.
   */
  shmSize?: string;
  /**
   * LLMHost.spec.resources.tolerations[list]: Kubernetes tolerations. When gpuCount > 0, a toleration of the gpuResource taint is added.
   */
  tolerations?: {
    [k: string]: unknown | undefined;
  }[];
  /**
   * LLMHost.spec.resources.vramRequiredGb[int]: the GPU memory the model requires. Informational.
   */
  vramRequiredGb?: number | null;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.scaling[object]: replicas.
 */
export interface SAMLLMHostScaling {
  /**
   * LLMHost.spec.scaling.replicas[int]: the replicas. More than one requires storage.accessMode ReadWriteMany or ReadOnlyMany.
   */
  replicas?: number;
  [k: string]: unknown | undefined;
}
/**
 * LLMHost.spec.storage[object]: the model volume.
 */
export interface SAMLLMHostStorage {
  /**
   * LLMHost.spec.storage.accessMode[str]: One of: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'].
   */
  accessMode?: "ReadWriteOnce" | "ReadWriteMany" | "ReadOnlyMany";
  /**
   * LLMHost.spec.storage.existingClaim[str]: an existing PersistentVolumeClaim to mount, instead of creating one. Required when model.source is pvc.
   */
  existingClaim?: string | null;
  /**
   * LLMHost.spec.storage.retain[bool]: keep the volume, and its downloaded weights, on undeploy. It is always deleted when the LLMHost is deleted.
   */
  retain?: boolean;
  /**
   * LLMHost.spec.storage.size[str]: e.g. 50Gi.
   */
  size?: string;
  /**
   * LLMHost.spec.storage.storageClass[str]: defaults to the cluster's default class.
   */
  storageClass?: string | null;
  [k: string]: unknown | undefined;
}
/**
 * Smarter API LLMHost Manifest - Status class.
 *
 * Read only. Besides ownership, it reports the LLMHost's lifecycle state, where it can be
 * reached, and its accumulated cost, as of its most recent status check.
 */
export interface SAMLLMHostStatus {
  /**
   * LLMHost.status.account_number: The account owner of this LLMHost. Read only.
   */
  accountNumber: string;
  /**
   * LLMHost.status.apiKeySecret: the Smarter Secret with the API key, if any. Read only.
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
   * LLMHost.status.deployedAt: when it was last launched. Read only.
   */
  deployedAt?: string | null;
  /**
   * LLMHost.status.endpoint: the base URL inside the cluster, e.g. for LLMClients. Read only.
   */
  endpoint?: string | null;
  /**
   * LLMHost.status.estimatedCost: uptimeHours times replicas times each replica's share of its compute's node price. Read only.
   */
  estimatedCost?: number | string | null;
  /**
   * LLMHost.status.healthy: the result of the last health check. Read only.
   */
  healthy?: boolean | null;
  /**
   * LLMHost.status.hostStatus: the lifecycle state, e.g. pending, active or error. Read only.
   */
  hostStatus?: string | null;
  /**
   * LLMHost.status.lastCheckedAt: when its status was last checked. Read only.
   */
  lastCheckedAt?: string | null;
  /**
   * LLMHost.status.message: why the LLMHost is in its state, e.g. a container error. Read only.
   */
  message?: string | null;
  /**
   * The date in which this resource was most recently changed. Read only.
   */
  modified: string;
  /**
   * LLMHost.status.publicUrl: the base URL of the Ingress, if any. Read only.
   */
  publicUrl?: string | null;
  /**
   * LLMHost.status.readyReplicas: ready. Read only.
   */
  readyReplicas?: number | null;
  /**
   * recordLocator[String]: An optional identifier used to locate the resource record associated with this manifest. Read only.
   */
  recordLocator: string;
  /**
   * LLMHost.status.replicas: desired. Read only.
   */
  replicas?: number | null;
  /**
   * LLMHost.status.uptimeHours: hours since deployedAt. Read only.
   */
  uptimeHours?: number | null;
  /**
   * LLMHost.status.username: The Smarter user who created this LLMHost. Read only.
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
