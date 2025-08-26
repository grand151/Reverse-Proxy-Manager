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
    const [formData, setFormData] = useState<Endpoint>({
        id: '',
        path_prefix: '',
        target_url: '',
        headers_to_add: {},
        auth_config: { type: 'none' },
    });
    const [headersJson, setHeadersJson] = useState('{}');
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const initialApiKey: ApiKey = { value: '', usage: 0, last_used: null };

    useEffect(() => {
        if (endpoint) {
            const processedEndpoint = JSON.parse(JSON.stringify(endpoint));
            if (processedEndpoint.auth_config?.type === 'api_key') {
                if (!processedEndpoint.auth_config.values) {
                     processedEndpoint.auth_config.values = [initialApiKey];
                }
            }
            setFormData(processedEndpoint);
            setHeadersJson(JSON.stringify(endpoint.headers_to_add || {}, null, 2));
        } else {
            setFormData({ id: '', path_prefix: '', target_url: '', headers_to_add: {}, auth_config: { type: 'none' } });
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
        if (!formData.path_prefix) newErrors.path_prefix = 'Path Prefix is required.';
        if (!formData.target_url) newErrors.target_url = 'Target URL is required.';
        
        try {
            JSON.parse(headersJson);
        } catch (e) {
            newErrors.headers_to_add = 'Invalid JSON format for headers.';
        }
        
        if (formData.auth_config?.type === 'api_key') {
            if (!formData.auth_config.name) {
                newErrors.auth_config_name = 'Header Name is required for API Key auth.';
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
                newAuthConfig = { type: 'api_key', name: '', values: [initialApiKey] };
            }
            return { ...prev, auth_config: newAuthConfig };
        });
    };

    const handleApiKeyConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleApiKeyValueChange = (index: number, value: string) => {
        setFormData(prev => {
            const newValues = [...(prev.auth_config?.values || [])];
            newValues[index] = { ...newValues[index], value: value };
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

    const formTitle = endpoint ? 'Edit Endpoint' : 'Add New Endpoint';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formTitle}>
            <form onSubmit={handleSubmit} noValidate>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                     <div>
                        <label htmlFor="id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Endpoint ID</label>
                        <input type="text" name="id" id="id" value={formData.id} onChange={handleChange} disabled={!!endpoint}
                               className={`bg-gray-50 border ${errors.id ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed`}
                               placeholder="e.g., my-service" required />
                        {errors.id && <p className="mt-1 text-xs text-red-500">{errors.id}</p>}
                    </div>
                     <div>
                        <label htmlFor="path_prefix" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Path Prefix</label>
                        <input type="text" name="path_prefix" id="path_prefix" value={formData.path_prefix} onChange={handleChange}
                               className={`bg-gray-50 border ${errors.path_prefix ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                               placeholder="e.g., /my_new_service" required />
                        {errors.path_prefix && <p className="mt-1 text-xs text-red-500">{errors.path_prefix}</p>}
                    </div>
                     <div>
                        <label htmlFor="target_url" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Target URL</label>
                        <input type="text" name="target_url" id="target_url" value={formData.target_url} onChange={handleChange}
                               className={`bg-gray-50 border ${errors.target_url ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
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
                             <div>
                                <label htmlFor="auth_config_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Header Name</label>
                                <input type="text" name="name" id="auth_config_name" value={formData.auth_config.name || ''} onChange={handleApiKeyConfigChange}
                                       className={`bg-gray-50 border ${errors.auth_config_name ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                                       placeholder="e.g., X-API-Key" required />
                                {errors.auth_config_name && <p className="mt-1 text-xs text-red-500">{errors.auth_config_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-900 dark:text-white">API Keys</label>
                                {formData.auth_config.values?.map((key: ApiKey, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="text" value={key.value} onChange={(e) => handleApiKeyValueChange(index, e.target.value)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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