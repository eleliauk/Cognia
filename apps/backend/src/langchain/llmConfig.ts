import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config/env.js';

/**
 * LLM Provider configurations
 * Supports multiple providers: Deepseek, OpenRouter, OpenAI
 */
export interface LLMProviderConfig {
  baseURL: string;
  modelName: string;
  apiKey: string;
}

/**
 * Predefined LLM provider configurations
 */
export const llmProviderConfigs: Record<string, Omit<LLMProviderConfig, 'apiKey'>> = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    modelName: 'deepseek/deepseek-chat',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo',
  },
};

/**
 * Get LLM configuration based on environment variables
 */
export function getLLMConfig(): LLMProviderConfig {
  const provider = config.llmProvider.toLowerCase();

  // Check if provider exists in predefined configs
  if (llmProviderConfigs[provider]) {
    return {
      ...llmProviderConfigs[provider],
      apiKey: config.llmApiKey,
    };
  }

  // Use custom configuration from environment variables
  return {
    baseURL: config.llmBaseUrl,
    modelName: config.llmModel,
    apiKey: config.llmApiKey,
  };
}

/**
 * Create and configure ChatOpenAI instance
 */
export function createLLM(): ChatOpenAI {
  const llmConfig = getLLMConfig();

  if (!llmConfig.apiKey) {
    console.warn('⚠️  LLM API key not configured. Matching engine will use fallback strategy.');
  }

  return new ChatOpenAI({
    modelName: llmConfig.modelName,
    temperature: 0.3,
    timeout: config.llmTimeout,
    maxRetries: 2,
    configuration: {
      baseURL: llmConfig.baseURL,
      apiKey: llmConfig.apiKey,
    },
  });
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.llmApiKey) {
    errors.push('LLM_API_KEY is not set');
  }

  if (!config.llmProvider) {
    errors.push('LLM_PROVIDER is not set');
  }

  const provider = config.llmProvider.toLowerCase();
  if (!llmProviderConfigs[provider] && !config.llmBaseUrl) {
    errors.push(`Unknown LLM provider: ${provider}. Please set LLM_BASE_URL for custom providers.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
