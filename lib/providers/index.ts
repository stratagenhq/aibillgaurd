export type ProviderType =
  | "openai"
  | "anthropic"
  | "groq"
  | "gemini"
  | "azure_openai"
  | "fireworks"
  | "together"
  | "mistral"
  | "midjourney"
  | "elevenlabs"
  | "perplexity";

export interface ProviderMeta {
  label: string;
  color: string;
  bgColor: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  docsUrl: string;
  syncSupported: boolean;
}

export const PROVIDER_META: Record<ProviderType, ProviderMeta> = {
  openai: {
    label: "OpenAI",
    color: "#10a37f",
    bgColor: "rgba(16,163,127,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    syncSupported: true,
  },
  anthropic: {
    label: "Anthropic",
    color: "#d97706",
    bgColor: "rgba(217,119,6,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    syncSupported: false,
  },
  groq: {
    label: "Groq",
    color: "#f55036",
    bgColor: "rgba(245,80,54,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    syncSupported: false,
  },
  gemini: {
    label: "Google Gemini",
    color: "#4285f4",
    bgColor: "rgba(66,133,244,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/apikey",
    syncSupported: false,
  },
  azure_openai: {
    label: "Azure OpenAI",
    color: "#0078d4",
    bgColor: "rgba(0,120,212,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Your Azure OpenAI key",
    docsUrl: "https://azure.microsoft.com/en-us/products/ai-services/openai-service",
    syncSupported: false,
  },
  fireworks: {
    label: "Fireworks AI",
    color: "#ff6b35",
    bgColor: "rgba(255,107,53,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "fw_...",
    docsUrl: "https://fireworks.ai/account/api-keys",
    syncSupported: false,
  },
  together: {
    label: "Together AI",
    color: "#7c3aed",
    bgColor: "rgba(124,58,237,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Your Together API key",
    docsUrl: "https://api.together.xyz/settings/api-keys",
    syncSupported: false,
  },
  mistral: {
    label: "Mistral",
    color: "#f97316",
    bgColor: "rgba(249,115,22,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Your Mistral API key",
    docsUrl: "https://console.mistral.ai/api-keys",
    syncSupported: false,
  },
  midjourney: {
    label: "Midjourney",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Your Midjourney API key",
    docsUrl: "https://docs.midjourney.com",
    syncSupported: false,
  },
  elevenlabs: {
    label: "ElevenLabs",
    color: "#9333ea",
    bgColor: "rgba(147,51,234,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Your ElevenLabs API key",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
    syncSupported: false,
  },
  perplexity: {
    label: "Perplexity",
    color: "#20b2aa",
    bgColor: "rgba(32,178,170,0.12)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "pplx-...",
    docsUrl: "https://www.perplexity.ai/settings/api",
    syncSupported: false,
  },
};

export const ALL_PROVIDERS = Object.entries(PROVIDER_META).map(([type, meta]) => ({
  type: type as ProviderType,
  ...meta,
}));
