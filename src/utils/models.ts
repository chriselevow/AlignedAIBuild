interface ModelConfig {
    name: string;
    displayName: string;
    temperature: number;
    type: "text" | "vision";
    maxTokens?: number;
}

const MODEL_CONFIGS: { [key: string]: ModelConfig } = {
    "meta-llama/llama-4-maverick-17b-128e-instruct": {
        name: "meta-llama/llama-4-maverick-17b-128e-instruct",
        displayName: "Llama 4 Maverick",
        temperature: 0.1,
        type: "vision",
        maxTokens: 8192
    },
    "meta-llama/llama-4-scout-17b-16e-instruct": {
        name: "meta-llama/llama-4-scout-17b-16e-instruct",
        displayName: "Llama 4 Scout",
        temperature: 0.1,
        type: "vision",
        maxTokens: 8192
    },
    "qwen/qwen3-32b": {
        name: "qwen/qwen3-32b",
        displayName: "Qwen 3 (32B)",
        temperature: 0.1,
        type: "text",
        maxTokens: 32768
    },
    "moonshotai/kimi-k2-instruct": {
        name: "moonshotai/kimi-k2-instruct",
        displayName: "Kimi K2",
        temperature: 0.6,
        type: "text",
        maxTokens: 131072
    },
    "qwen-2.5-coder-32b": {
        name: "qwen-2.5-coder-32b",
        displayName: "Qwen 2.5 Coder (32B)",
        temperature: 0.1,
        type: "text",
        maxTokens: 32768
    },
    "qwen-qwq-32b": {
        name: "qwen-qwq-32b",
        displayName: "QwQ Reasoning (32B)",
        temperature: 0.6,
        type: "text",
        maxTokens: 32768
    },
    "deepseek-r1-distill-llama-70b": {
        name: "deepseek-r1-distill-llama-70b",
        displayName: "DeepSeek R1 (70B)",
        temperature: 0.6,
        type: "text",
        maxTokens: 16384
    },
    "qwen-2.5-32b": {
        name: "qwen-2.5-32b",
        displayName: "Qwen 2.5 (32B)",
        temperature: 0.1,
        type: "text",
        maxTokens: 32768
    },
    "llama-3.3-70b-versatile": {
        name: "llama-3.3-70b-versatile",
        displayName: "Llama 3.3 (70B)",
        temperature: 0.1,
        type: "text",
        maxTokens: 32768
    },
    "llama-3.2-90b-vision-preview": {
        name: "llama-3.2-90b-vision-preview",
        displayName: "Llama 3.2 Vision (90B)",
        temperature: 0.1,
        type: "vision"
    },
    "llama-3.2-11b-vision-preview": {
        name: "llama-3.2-11b-vision-preview",
        displayName: "Llama 3.2 Vision (11B)",
        temperature: 0.1,
        type: "vision"
    }
};

// Default temperature if model not found in configs
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 8192;

// Export only text-based models for MODEL_OPTIONS
export const MODEL_OPTIONS = Object.entries(MODEL_CONFIGS)
    .map(([key, _]) => key);

export function getModelDisplayName(modelKey: string): string {
    return MODEL_CONFIGS[modelKey]?.displayName ?? modelKey;
}

export function getModelTemperature(modelName: string): number {
    return MODEL_CONFIGS[modelName]?.temperature ?? DEFAULT_TEMPERATURE;
}

export function getModelMaxTokens(modelName: string): number {
    return MODEL_CONFIGS[modelName]?.maxTokens ?? DEFAULT_MAX_TOKENS;
}

export function getModelConfig(modelName: string): ModelConfig {
    return MODEL_CONFIGS[modelName] ?? {
        name: modelName,
        temperature: DEFAULT_TEMPERATURE,
        type: "text"
    };
}

export function getFallbackModel(): string {
	// Use same model for fallback
	return "llama-3.3-70b-versatile";
}

export const PRIMARY_MODEL = "llama-3.3-70b-specdec";
export const VANILLA_MODEL = "llama-3.3-70b-versatile";

export const PRIMARY_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const FALLBACK_VISION_MODEL = "llama-3.2-90b-vision-preview";
