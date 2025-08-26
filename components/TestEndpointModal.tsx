import React, { useState } from 'react';
import { Endpoint } from '../types';
import Modal from './Modal';

interface TestEndpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    endpoint: Endpoint;
}

const TestEndpointModal: React.FC<TestEndpointModalProps> = ({ isOpen, onClose, endpoint }) => {
    const [selectedPrefix, setSelectedPrefix] = useState(endpoint.path_prefixes[0] || '');
    const [subPath, setSubPath] = useState('');
    const baseUrl = `${window.location.origin}${selectedPrefix}`;

    const getFinalUrl = () => {
        const cleanedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanedSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;

        if (cleanedBase.includes('?')) {
             const [base, query] = cleanedBase.split('?');
             if (!cleanedSubPath) return cleanedBase;
             return `${base}/${cleanedSubPath}?${query}`;
        }

        if (!cleanedSubPath) return cleanedBase;
        return `${cleanedBase}/${cleanedSubPath}`;
    };

    const handleTest = () => {
        window.open(getFinalUrl(), '_blank', 'noopener,noreferrer');
        onClose();
    };
    
    const selectClass = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Test Endpoint: ${endpoint.id}`}>
            <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        This tool helps you construct a test URL. Your actual reverse proxy server must be configured to handle requests at this application's domain and the specified path prefix.
                    </p>
                </div>
                {endpoint.path_prefixes.length > 1 && (
                     <div>
                        <label htmlFor="prefix-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Path Prefix to Test</label>
                        <select id="prefix-select" value={selectedPrefix} onChange={e => setSelectedPrefix(e.target.value)} className={selectClass}>
                            {endpoint.path_prefixes.map(prefix => (
                                <option key={prefix} value={prefix}>{prefix}</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="subPath" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Path to Append (Optional)</label>
                    <input
                        type="text"
                        id="subPath"
                        value={subPath}
                        onChange={(e) => setSubPath(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="e.g., 1"
                        aria-describedby="subpath-helper"
                    />
                     <p id="subpath-helper" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        This will be appended to your path prefix. Example for JSON Placeholder: <code className="bg-gray-200 dark:bg-gray-600 rounded px-1 py-0.5">1</code> to get post with ID 1.
                    </p>
                </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">Full Test URL</label>
                    <code className="block w-full p-2.5 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 break-all text-sm">
                        {getFinalUrl()}
                    </code>
                </div>
            </div>
            <div className="flex items-center justify-end p-4 space-x-2 border-t border-gray-200 dark:border-gray-700 rounded-b">
                 <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">Cancel</button>
                 <button type="button" onClick={handleTest} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    Open Test URL
                </button>
            </div>
        </Modal>
    );
};

export default TestEndpointModal;