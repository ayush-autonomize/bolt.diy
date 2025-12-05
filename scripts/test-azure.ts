import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    console.log('Testing Azure OpenAI Connection...');
    console.log('Endpoint:', endpoint);
    console.log('Deployment:', deploymentName);
    console.log('API Key:', apiKey ? '******' : 'Missing');

    if (!apiKey || !endpoint || !deploymentName) {
        console.error('Missing configuration');
        process.exit(1);
    }

    const openai = createOpenAI({
        baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
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

    try {
        const { text } = await generateText({
            model: openai(''), // Model name is in the URL already for Azure
            prompt: 'Say hello',
        });

        console.log('Success! Response:', JSON.stringify(text));
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
