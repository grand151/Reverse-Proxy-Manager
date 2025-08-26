import React, { useState, useEffect } from 'react';
import { Endpoint, AuthConfig, ApiKey } from '../types';
import Modal from './Modal';
import { MinusIcon, PlusIcon } from './Icons';

interface EndpointFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (endpoint: Endpoint) => void;
    endpoint: Endpoint | null;
}

const EndpointFormModal: React.FC<EndpointFormModalProps> = ({ isOpen, onClose, onSave, endpoint }) => {
    const initialApiKey: ApiKey = { value: '', usage: 0, last_used: null, rate_limit: {}, usage_history: [] };
    
    const getInitialFormData = (): Endpoint => ({
        id: '',
        path_prefixes: [''],
        target_url: '',
        headers_to_add: {},
        auth_config: { type: 'none' },
    });

    const [formData, setFormData] = useState<Endpoint>(getInitialFormData());
    const [headersJson, setHeadersJson] = useState('{}');
    const [errors, setErrors] = useState<Record<string, string>>({});
    

    useEffect(() => {
        if (endpoint) {
            const processedEndpoint = JSON.parse(JSON.stringify(endpoint));
            if (!processedEndpoint.path_prefixes || processedEndpoint.path_prefixes.length === 0) {
                processedEndpoint.path_prefixes = [''];
            }
            if (processedEndpoint.auth_config?.type === 'api_key') {
                if (!processedEndpoint.auth_config.in) {
                    processedEndpoint.auth_config.in = 'header';
                }
                if (!processedEndpoint.auth_config.values || processedEndpoint.auth_config.values.length === 0) {
                     processedEndpoint.auth_config.values = [initialApiKey];
                } else {
                    processedEndpoint.auth_config.values = processedEndpoint.auth_config.values.map((k: ApiKey) => ({
                        ...initialApiKey,
                        ...k,
                        rate_limit: k.rate_limit || {},
                    }));
                }
            }
            setFormData(processedEndpoint);
            setHeadersJson(JSON.stringify(endpoint.headers_to_add || {}, null, 2));
        } else {
            setFormData(getInitialFormData());
            setHeadersJson('{}');
        }
        setErrors({});
    }, [endpoint, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.id) newErrors.id = 'ID is required.';
        if (!formData.path_prefixes || formData.path_prefixes.length === 0 || formData.path_prefixes.some(p => !p.trim())) {
            newErrors.path_prefixes = 'At least one Path Prefix is required and cannot be empty.';
        }
        if (!formData.target_url) newErrors.target_url = 'Target URL is required.';
        
        try {
            JSON.parse(headersJson);
        } catch (e) {
            newErrors.headers_to_add = 'Invalid JSON format for headers.';
        }
        
        if (formData.auth_config?.type === 'api_key') {
            if (!formData.auth_config.name) {
                newErrors.auth_config_name = 'Header/Parameter Name is required for API Key auth.';
            }
            if (!formData.auth_config.values || formData.auth_config.values.length === 0 || formData.auth_config.values.some((k: ApiKey) => !k.value.trim())) {
                newErrors.auth_config_values = 'At least one API Key is required and cannot be empty.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const finalEndpoint: Endpoint = {
                ...formData,
                headers_to_add: JSON.parse(headersJson),
            };
            onSave(finalEndpoint);
        }
    };

    const handleAuthTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as AuthConfig['type'];
        setErrors({}); // Clear errors on type change
        setFormData(prev => {
            let newAuthConfig: AuthConfig = { type: newType };
            if (newType === 'api_key') {
                newAuthConfig = { type: 'api_key', name: '', in: 'header', values: [initialApiKey] };
            }
            return { ...prev, auth_config: newAuthConfig };
        });
    };

    const handleApiKeyConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            auth_config: {
                ...prev.auth_config,
                type: 'api_key',
                [name]: value
            }
        }));
    }

    const handleApiKeyValueChange = (index: number, field: 'value' | 'requests_per_minute' | 'requests_per_hour' | 'requests_per_day', value: string) => {
        setFormData(prev => {
            const newValues = [...(prev.auth_config?.values || [])];
            const updatedKey = { ...newValues[index] };

            if (field === 'value') {
                updatedKey.value = value;
            } else {
                updatedKey.rate_limit = {
                    ...updatedKey.rate_limit,
                    [field]: value === '' ? undefined : Number(value)
                };
            }
    
            newValues[index] = updatedKey;
    
            return {
                ...prev,
                auth_config: { ...prev.auth_config, type: 'api_key', values: newValues }
            };
        });
    };

    const addApiKey = () => {
        setFormData(prev => {
            const newValues = [...(prev.auth_config?.values || []), initialApiKey];
            return {
                ...prev,
                auth_config: { ...prev.auth_config, type: 'api_key', values: newValues }
            };
        });
    };

    const removeApiKey = (index: number) => {
        setFormData(prev => {
            const newValues = (prev.auth_config?.values || []).filter((_: any, i: number) => i !== index);
             if (newValues.length === 0) {
                newValues.push(initialApiKey); // Always keep at least one input
            }
            return {
                ...prev,
                auth_config: { ...prev.auth_config, type: 'api_key', values: newValues }
            };
        });
    };
    
    const handlePrefixChange = (index: number, value: string) => {
        setFormData(prev => {
            const newPrefixes = [...prev.path_prefixes];
            newPrefixes[index] = value;
            return { ...prev, path_prefixes: newPrefixes };
        });
    };

    const addPrefix = () => {
        setFormData(prev => ({
            ...prev,
            path_prefixes: [...prev.path_prefixes, '']
        }));
    };

    const removePrefix = (index: number) => {
        setFormData(prev => {
            const newPrefixes = prev.path_prefixes.filter((_, i) => i !== index);
            if (newPrefixes.length === 0) {
                newPrefixes.push('');
            }
            return { ...prev, path_prefixes: newPrefixes };
        });
    };

    const formTitle = endpoint ? 'Edit Endpoint' : 'Add New Endpoint';
    
    const inputClass = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const errorInputClass = "border-red-500";
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formTitle}>
            <form onSubmit={handleSubmit} noValidate>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                     <div>
                        <label htmlFor="id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Endpoint ID</label>
                        <input type="text" name="id" id="id" value={formData.id} onChange={handleChange} disabled={!!endpoint}
                               className={`${inputClass} ${errors.id ? errorInputClass : ''} disabled:opacity-70 disabled:cursor-not-allowed`}
                               placeholder="e.g., my-service" required />
                        {errors.id && <p className="mt-1 text-xs text-red-500">{errors.id}</p>}
                    </div>
                     <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Path Prefixes</label>
                        <div className="space-y-2">
                             {formData.path_prefixes.map((prefix, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={prefix} onChange={(e) => handlePrefixChange(index, e.target.value)}
                                        className={`${inputClass} ${errors.path_prefixes ? errorInputClass : ''}`}
                                        placeholder="e.g., /my_new_service" required 
                                    />
                                    <button type="button" onClick={() => removePrefix(index)}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Remove Path Prefix"
                                            disabled={formData.path_prefixes.length === 1}
                                        >
                                        <MinusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.path_prefixes && <p className="mt-1 text-xs text-red-500">{errors.path_prefixes}</p>}
                         <button type="button" onClick={addPrefix}
                                    className="mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-700">
                            <PlusIcon className="w-4 h-4" />
                            Add Path Prefix
                        </button>
                    </div>
                     <div>
                        <label htmlFor="target_url" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Target URL</label>
                        <input type="text" name="target_url" id="target_url" value={formData.target_url} onChange={handleChange}
                               className={`${inputClass} ${errors.target_url ? errorInputClass : ''}`}
                               placeholder="e.g., http://localhost:8080" required />
                         {errors.target_url && <p className="mt-1 text-xs text-red-500">{errors.target_url}</p>}
                    </div>
                    <div>
                        <label htmlFor="headersToAdd" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Headers to Add (JSON)</label>
                        <textarea id="headersToAdd" rows={4} value={headersJson} onChange={e => setHeadersJson(e.target.value)}
                                  className={`block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border ${errors.headers_to_add ? 'border-red-500' : 'border-gray-300'} focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white font-mono`}
                                  placeholder='{"X-Custom-Header": "Value"}'></textarea>
                         {errors.headers_to_add && <p className="mt-1 text-xs text-red-500">{errors.headers_to_add}</p>}
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="auth_type" className="block text-sm font-medium text-gray-900 dark:text-white">Auth Config</label>
                        <select id="auth_type" value={formData.auth_config?.type || 'none'} onChange={handleAuthTypeChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                            <option value="none">None</option>
                            <option value="api_key">API Key</option>
                        </select>
                    </div>

                    {formData.auth_config?.type === 'api_key' && (
                        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="auth_config_in" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">API Key Location</label>
                                    <select id="auth_config_in" name="in" value={formData.auth_config.in || 'header'} onChange={handleApiKeyConfigChange}
                                            className={inputClass}>
                                        <option value="header">Header</option>
                                        <option value="query">Query Parameter</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="auth_config_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        {formData.auth_config.in === 'query' ? 'Parameter Name' : 'Header Name'}
                                    </label>
                                    <input type="text" name="name" id="auth_config_name" value={formData.auth_config.name || ''} onChange={handleApiKeyConfigChange}
                                           className={`${inputClass} ${errors.auth_config_name ? errorInputClass : ''}`}
                                           placeholder={formData.auth_config.in === 'query' ? 'e.g., key' : 'e.g., X-API-Key'} required />
                                    {errors.auth_config_name && <p className="mt-1 text-xs text-red-500">{errors.auth_config_name}</p>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-900 dark:text-white">API Keys &amp; Rate Limits</label>
                                {formData.auth_config.values?.map((key: ApiKey, index: number) => (
                                    <div key={index} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={key.value} onChange={(e) => handleApiKeyValueChange(index, 'value', e.target.value)}
                                                className={inputClass}
                                                placeholder="Enter API Key"
                                            />
                                            <button type="button" onClick={() => removeApiKey(index)}
                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Remove API Key"
                                                disabled={formData.auth_config.values && formData.auth_config.values.length === 1}
                                            >
                                                <MinusIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <div>
                                                <label htmlFor={`rpm-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">RPM</label>
                                                <input id={`rpm-${index}`} type="number" min="0" placeholder="Reqs/Min" value={key.rate_limit?.requests_per_minute || ''}
                                                    onChange={(e) => handleApiKeyValueChange(index, 'requests_per_minute', e.target.value)}
                                                    className={`${inputClass} text-xs p-2`} />
                                            </div>
                                             <div>
                                                <label htmlFor={`rph-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">RPH</label>
                                                <input id={`rph-${index}`} type="number" min="0" placeholder="Reqs/Hour" value={key.rate_limit?.requests_per_hour || ''}
                                                    onChange={(e) => handleApiKeyValueChange(index, 'requests_per_hour', e.target.value)}
                                                    className={`${inputClass} text-xs p-2`} />
                                            </div>
                                             <div>
                                                <label htmlFor={`rpd-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">RPD</label>
                                                <input id={`rpd-${index}`} type="number" min="0" placeholder="Reqs/Day" value={key.rate_limit?.requests_per_day || ''}
                                                    onChange={(e) => handleApiKeyValueChange(index, 'requests_per_day', e.target.value)}
                                                    className={`${inputClass} text-xs p-2`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {errors.auth_config_values && <p className="mt-1 text-xs text-red-500">{errors.auth_config_values}</p>}
                                <button type="button" onClick={addApiKey}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-700">
                                    <PlusIcon className="w-4 h-4" />
                                    Add API Key
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center p-4 space-x-2 border-t border-gray-200 dark:border-gray-700 rounded-b">
                    <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save</button>
                    <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">Cancel</button>
                </div>
            </form>
        </Modal>
    );
};

export default EndpointFormModal;