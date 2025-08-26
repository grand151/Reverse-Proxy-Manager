import React from 'react';
import { Endpoint, ApiKey } from '../types';
import { BeakerIcon, BoltIcon, CloneIcon, EditIcon, TrashIcon } from './Icons';

interface EndpointItemProps {
    endpoint: Endpoint;
    onEdit: (endpoint: Endpoint) => void;
    onDelete: (id: string) => void;
    onClone: (id: string) => void;
    onHit: (id: string) => void;
    onTest: (id: string) => void;
}

const formatLastUsed = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
};

const KeyUsageStats: React.FC<{ keys: ApiKey[] }> = ({ keys }) => {
    if (!keys || keys.length === 0) {
        return null;
    }
    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">API Key Usage</h4>
            <div className="space-y-2 text-xs">
                {keys.map((key, index) => (
                    <div key={index} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                            <div className="sm:col-span-1">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Key {index + 1}:</span>
                                <code className="ml-2 truncate" title={key.value}>{key.value.substring(0, 15)}...</code>
                            </div>
                            <div className="sm:col-span-1">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Usage:</span>
                                <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{key.usage}</span>
                            </div>
                            <div className="sm:col-span-1">
                                 <span className="font-medium text-gray-600 dark:text-gray-400">Last Used:</span>
                                 <span className="ml-2">{formatLastUsed(key.last_used)}</span>
                            </div>
                        </div>
                         {(key.rate_limit && Object.values(key.rate_limit).some(v => v != null && v > 0)) && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center space-x-4">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Limits:</span>
                                <div className="flex items-center gap-4 text-xs">
                                    {key.rate_limit?.requests_per_minute != null && (
                                        <span>RPM: <span className="font-bold">{key.rate_limit.requests_per_minute}</span></span>
                                    )}
                                     {key.rate_limit?.requests_per_hour != null && (
                                        <span>RPH: <span className="font-bold">{key.rate_limit.requests_per_hour}</span></span>
                                    )}
                                     {key.rate_limit?.requests_per_day != null && (
                                        <span>RPD: <span className="font-bold">{key.rate_limit.requests_per_day}</span></span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const EndpointItem: React.FC<EndpointItemProps> = ({ endpoint, onEdit, onDelete, onClone, onHit, onTest }) => {
    const hasApiKeys = endpoint.auth_config?.type === 'api_key' && endpoint.auth_config.values && endpoint.auth_config.values.length > 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 transition-shadow duration-200 hover:shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex-1 mb-4 md:mb-0 w-full md:w-auto">
                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 break-all">{endpoint.id}</h3>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-start">
                             <span className="font-semibold w-28 shrink-0">Path Prefixes:</span>
                             <div className="flex flex-col items-start gap-1">
                                {endpoint.path_prefixes.map((prefix, index) => (
                                    <code key={index} className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 text-gray-800 dark:text-gray-200 break-all">{prefix}</code>
                                ))}
                            </div>
                        </div>
                        <p className="mt-2 flex items-center">
                            <span className="font-semibold w-28 shrink-0">Target URL:</span>
                            <a href={endpoint.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{endpoint.target_url}</a>
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 self-end md:self-center">
                     <button
                        onClick={() => onTest(endpoint.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Test endpoint ${endpoint.id}`}
                        title="Test Endpoint"
                    >
                        <BeakerIcon className="w-5 h-5" />
                    </button>
                     <button
                        onClick={() => onHit(endpoint.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Simulate hit on endpoint ${endpoint.id}`}
                        title="Simulate Hit"
                    >
                        <BoltIcon className="w-5 h-5" />
                    </button>
                     <button
                        onClick={() => onClone(endpoint.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Clone endpoint ${endpoint.id}`}
                        title="Clone"
                    >
                        <CloneIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onEdit(endpoint)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Edit endpoint ${endpoint.id}`}
                         title="Edit"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onDelete(endpoint.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Delete endpoint ${endpoint.id}`}
                        title="Delete"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {hasApiKeys && <KeyUsageStats keys={endpoint.auth_config!.values!} />}
        </div>
    );
};

export default EndpointItem;