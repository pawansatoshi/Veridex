export interface VeridexRuntimeConfig {
  rpcUrl: string;
  chain: string;
  rpcTimeoutMs: number;
  rpcMaxAttempts: number;
  maxConcurrency: number;
  maxBytecodeBytes: number;
  verificationBaseUrl?: string;
  verificationApiKey?: string;
  verificationChainId?: number;
}

export function validateRuntimeConfig(config: VeridexRuntimeConfig): VeridexRuntimeConfig {
  if (!/^https?:\/\//i.test(config.rpcUrl)) throw new Error("rpcUrl must use http or https");
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(config.chain)) throw new Error("chain must be a bounded identifier");
  if (!Number.isInteger(config.rpcTimeoutMs) || config.rpcTimeoutMs < 100 || config.rpcTimeoutMs > 30_000) throw new Error("rpcTimeoutMs must be between 100 and 30000 milliseconds");
  if (!Number.isInteger(config.rpcMaxAttempts) || config.rpcMaxAttempts < 1 || config.rpcMaxAttempts > 5) throw new Error("rpcMaxAttempts must be between 1 and 5");
  if (!Number.isInteger(config.maxConcurrency) || config.maxConcurrency < 1 || config.maxConcurrency > 16) throw new Error("maxConcurrency must be between 1 and 16");
  if (!Number.isInteger(config.maxBytecodeBytes) || config.maxBytecodeBytes < 1 || config.maxBytecodeBytes > 1_000_000) throw new Error("maxBytecodeBytes must be between 1 and 1000000");
  if (config.verificationBaseUrl !== undefined && !/^https?:\/\//i.test(config.verificationBaseUrl)) throw new Error("verificationBaseUrl must use http or https");
  if (config.verificationChainId !== undefined && (!Number.isInteger(config.verificationChainId) || config.verificationChainId < 1 || config.verificationChainId > 0xffffffff)) throw new Error("verificationChainId is invalid");
  return config;
}
