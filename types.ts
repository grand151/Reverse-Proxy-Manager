export interface ApiKey {
    value: string;
    usage: number;
    last_used: string | null;
    rate_limit?: {
        requests_per_minute?: number;
        requests_per_hour?: number;
        requests_per_day?: number;
    };
    usage_history?: number[]; // Array of timestamps (ms)
}

export interface AuthConfig {
    type: 'none' | 'api_key' | 'basic_auth' | 'bearer_token';
    values?: ApiKey[];
    name?: string;
    in?: 'header' | 'query';
}

export interface Endpoint {
    id: string;
    path_prefixes: string[];
    target_url: string;
    headers_to_add?: Record<string, string>;
    auth_config?: AuthConfig;
}