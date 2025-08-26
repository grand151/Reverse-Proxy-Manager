import { Endpoint, ApiKey } from '../types';

let endpoints: Endpoint[] = [
    {
        id: "httpbin-service",
        path_prefix: "/service1",
        target_url: "http://httpbin.org/anything",
        headers_to_add: {
            "X-Proxy-Source": "ReactGUI"
        },
        auth_config: {
            type: "none"
        }
    },
    {
        id: "jsonplaceholder-posts",
        path_prefix: "/service2",
        target_url: "https://jsonplaceholder.typicode.com",
        auth_config: {
            type: "api_key",
            name: "X-Api-Token",
            values: [{ value: "secret-placeholder-token", usage: 0, last_used: null }]
        }
    },
     {
        id: "image-placeholder",
        path_prefix: "/images",
        target_url: "https://picsum.photos",
        auth_config: {
            type: "none"
        }
    },
    {
        id: "gemini-api-service",
        path_prefix: "/gemini",
        target_url: "https://generativelanguage.googleapis.com",
        auth_config: {
            type: "api_key",
            name: "x-goog-api-key",
            values: [
                { value: "YOUR_GEMINI_API_KEY_1", usage: 5, last_used: "2023-10-26T10:00:00Z" },
                { value: "YOUR_GEMINI_API_KEY_2", usage: 2, last_used: "2023-10-27T11:30:00Z" }
            ]
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

        // Find the key to use based on rotation (least recently used)
        let keyToUse: ApiKey | null = null;
        
        const unusedKeys = keys.filter(k => k.last_used === null);
        if(unusedKeys.length > 0) {
            keyToUse = unusedKeys[0];
        } else {
            // Sort by last_used date, oldest first
            keyToUse = [...keys].sort((a, b) => new Date(a.last_used!).getTime() - new Date(b.last_used!).getTime())[0];
        }

        if (keyToUse) {
            keyToUse.usage += 1;
            keyToUse.last_used = new Date().toISOString();
            console.log(`API: Logged hit for endpoint '${id}', key '${keyToUse.value.substring(0, 10)}...' used.`);
        }
    } else {
         console.log(`API: Logged hit for endpoint '${id}' (no API key to rotate).`);
    }

    return JSON.parse(JSON.stringify(endpoint));
};