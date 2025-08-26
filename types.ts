export interface ApiKey {
    value: string;
    usage: number;
    last_used: string | null;
}

export interface AuthConfig {
    type: 'none' | 'api_key' | 'basic_auth' | 'bearer_token';
    values?: ApiKey[];
    [key: string]: any;
}

export interface Endpoint {
    id: string;
    path_prefix: string;
    target_url: string;
    headers_to_add?: Record<string, string>;
    auth_config?: AuthConfig;
}