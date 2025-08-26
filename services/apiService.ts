import { Endpoint, ApiKey } from '../types';

let endpoints: Endpoint[] = [
    {
        id: "gemini-api-proxy",
        path_prefixes: [
            "/v1beta/models/gemini-2.5-flash:generateContent",
            "/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse"
        ],
        target_url: "https://generativelanguage.googleapis.com",
        headers_to_add: {
            "X-Proxy-Manager": "Consolidated-Gemini-Endpoint"
        },
        auth_config: {
            type: "api_key",
            name: "key",
            in: "query",
            values: [
                {
                    value: "YOUR_GEMINI_API_KEY_1",
                    usage: 5,
                    last_used: "2023-10-26T10:00:00Z",
                    rate_limit: { requests_per_minute: 60 },
                    usage_history: [Date.now() - 65000, Date.now() - 20000, Date.now() - 10000, Date.now() - 5000, Date.now() - 1000]
                }
            ]
        }
    },
    {
        id: "jsonplaceholder-proxy",
        path_prefixes: ["/posts", "/comments"],
        target_url: "https://jsonplaceholder.typicode.com",
        headers_to_add: {
            "X-Proxy-User": "test-user"
        },
        auth_config: {
            type: "none"
        }
    }
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getEndpoints = async (): Promise<Endpoint[]> => {
    await simulateDelay(500);
    console.log("API: Fetched endpoints");
    return JSON.parse(JSON.stringify(endpoints)); // Return a deep copy
};

export const addEndpoint = async (endpoint: Endpoint): Promise<Endpoint> => {
    await simulateDelay(300);
    if (endpoints.some(ep => ep.id === endpoint.id)) {
        throw new Error(`Endpoint with ID '${endpoint.id}' already exists.`);
    }
    endpoints.push(endpoint);
    console.log("API: Added endpoint", endpoint);
    return JSON.parse(JSON.stringify(endpoint));
};

export const updateEndpoint = async (id: string, updatedEndpoint: Endpoint): Promise<Endpoint> => {
    await simulateDelay(300);
    const index = endpoints.findIndex(ep => ep.id === id);
    if (index === -1) {
        throw new Error(`Endpoint with ID '${id}' not found.`);
    }
    endpoints[index] = { ...endpoints[index], ...updatedEndpoint };
    console.log("API: Updated endpoint", endpoints[index]);
    return JSON.parse(JSON.stringify(endpoints[index]));
};

export const deleteEndpoint = async (id: string): Promise<{ message: string }> => {
    await simulateDelay(300);
    const initialLength = endpoints.length;
    endpoints = endpoints.filter(ep => ep.id !== id);
    if (endpoints.length === initialLength) {
        throw new Error(`Endpoint with ID '${id}' not found.`);
    }
    console.log("API: Deleted endpoint with ID", id);
    return { message: `Endpoint '${id}' deleted successfully` };
};

export const cloneEndpoint = async (id: string): Promise<Endpoint> => {
    await simulateDelay(300);
    const originalEndpoint = endpoints.find(ep => ep.id === id);
    if (!originalEndpoint) {
        throw new Error(`Endpoint with ID '${id}' not found for cloning.`);
    }

    let newId = `${originalEndpoint.id}-copy`;
    let counter = 2;
    while (endpoints.some(ep => ep.id === newId)) {
        newId = `${originalEndpoint.id}-copy-${counter}`;
        counter++;
    }

    const clonedEndpoint: Endpoint = {
        ...JSON.parse(JSON.stringify(originalEndpoint)),
        id: newId,
    };

    endpoints.push(clonedEndpoint);
    console.log("API: Cloned endpoint", clonedEndpoint);
    return JSON.parse(JSON.stringify(clonedEndpoint));
};

export const logEndpointHit = async (id: string): Promise<Endpoint> => {
    await simulateDelay(200);
    const endpoint = endpoints.find(ep => ep.id === id);

    if (!endpoint) {
        throw new Error(`Endpoint with ID '${id}' not found.`);
    }

    if (endpoint.auth_config?.type === 'api_key' && endpoint.auth_config.values && endpoint.auth_config.values.length > 0) {
        const keys = endpoint.auth_config.values;
        const now = Date.now();
        
        let chosenKey: ApiKey | null = null;

        // Iterate through keys to find one that is not rate-limited
        for (const key of keys) {
            if (!key.usage_history) {
                key.usage_history = [];
            }
            // Clean up old history (older than a day) to prevent memory leaks
            key.usage_history = key.usage_history.filter(ts => now - ts < 24 * 60 * 60 * 1000);

            const requestsInLastMinute = key.usage_history.filter(ts => now - ts < 60 * 1000).length;
            const requestsInLastHour = key.usage_history.filter(ts => now - ts < 60 * 60 * 1000).length;
            const requestsInLastDay = key.usage_history.length; // since we filtered for the last day

            const isRateLimited = (
                (key.rate_limit?.requests_per_minute != null && requestsInLastMinute >= key.rate_limit.requests_per_minute) ||
                (key.rate_limit?.requests_per_hour != null && requestsInLastHour >= key.rate_limit.requests_per_hour) ||
                (key.rate_limit?.requests_per_day != null && requestsInLastDay >= key.rate_limit.requests_per_day)
            );

            if (!isRateLimited) {
                chosenKey = key;
                break; // Found a valid key
            }
        }

        if (chosenKey) {
            chosenKey.usage += 1;
            chosenKey.last_used = new Date().toISOString();
            chosenKey.usage_history.push(now);
            console.log(`API: Logged hit for endpoint '${id}', key '${chosenKey.value.substring(0, 10)}...' used.`);
        } else {
            // All keys are rate-limited
            console.error(`API: All keys for endpoint '${id}' are currently rate-limited.`);
            throw new Error(`All API keys for endpoint '${id}' are currently rate-limited. Please try again later.`);
        }
    } else {
         console.log(`API: Logged hit for endpoint '${id}' (no API key to rotate).`);
    }

    return JSON.parse(JSON.stringify(endpoint));
};

export const overwriteEndpoints = async (newEndpoints: Endpoint[]): Promise<void> => {
    await simulateDelay(300);
    if (!Array.isArray(newEndpoints)) {
        throw new Error("Invalid configuration format provided.");
    }
    endpoints = JSON.parse(JSON.stringify(newEndpoints)); // Deep copy
    console.log("API: Overwrote all endpoints with new configuration.");
};
