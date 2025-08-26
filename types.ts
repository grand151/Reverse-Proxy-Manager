export interface ApiKey {
    value: string;
    usage: number;
    last_used: string | null;
    rate_limit?: {
        requests_per_minute?: number;
        tokens_per_minute?: number;
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

export interface CorsConfig {
    enabled: boolean;
    allowed_origins?: string[];
    allowed_methods?: string[];
    allowed_headers?: string[];
}

export interface Endpoint {
    id: string;
    path_prefixes: string[];
    target_url: string;
    headers_to_add?: Record<string, string>;
    auth_config?: AuthConfig;
    cors_config?: CorsConfig;
}