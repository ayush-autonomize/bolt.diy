import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class AzureProvider extends BaseProvider {
    name = 'Azure';
    getApiKeyLink = 'https://portal.azure.com';

    config = {
        apiTokenKey: 'AZURE_OPENAI_API_KEY',
    };

    staticModels: ModelInfo[] = [
        {
            name: 'gpt-4o',
            label: 'GPT-4o (Azure)',
            provider: 'Azure',
            maxTokenAllowed: 128000,
            maxCompletionTokens: 4096,
        },
    ];

    async getDynamicModels(
        apiKeys?: Record<string, string>,
        settings?: IProviderSetting,
        serverEnv?: Record<string, string>,
    ): Promise<ModelInfo[]> {
        const deploymentName = serverEnv?.['AZURE_OPENAI_DEPLOYMENT_NAME'] || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

        if (deploymentName) {
            return [{
                name: deploymentName,
                label: `${deploymentName} (Azure)`,
                provider: 'Azure',
                maxTokenAllowed: 128000,
                maxCompletionTokens: 4096,
            }];
        }

        return [];
    }

    getModelInstance(options: {
        model: string;
        serverEnv: any;
        apiKeys?: Record<string, string>;
        providerSettings?: Record<string, IProviderSetting>;
    }): LanguageModelV1 {
        const { model, serverEnv, apiKeys, providerSettings } = options;

        const apiKey = apiKeys?.[this.name] || serverEnv?.['AZURE_OPENAI_API_KEY'] || process.env.AZURE_OPENAI_API_KEY;
        const endpoint = serverEnv?.['AZURE_OPENAI_ENDPOINT'] || process.env.AZURE_OPENAI_ENDPOINT;
        const deploymentName = serverEnv?.['AZURE_OPENAI_DEPLOYMENT_NAME'] || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

        if (!apiKey) {
            throw new Error(`Missing API key for ${this.name} provider`);
        }

        if (!endpoint) {
            throw new Error(`Missing Endpoint for ${this.name} provider`);
        }

        // Construct baseURL
        let baseURL = endpoint;
        const deployment = deploymentName || model; // Fallback to model name if deployment not set

        if (!baseURL.includes('/openai/deployments')) {
            baseURL = `${baseURL}/openai/deployments/${deployment}`;
        }

        const openai = createOpenAI({
            baseURL,
            apiKey,
            headers: {
                'api-key': apiKey,
            },
            compatibility: 'strict',
            fetch: async (url, options) => {
                const urlObj = new URL(url.toString());
                urlObj.searchParams.append('api-version', '2024-02-15-preview');
                return fetch(urlObj.toString(), options);
            },
        });

        return openai('');
    }
}
