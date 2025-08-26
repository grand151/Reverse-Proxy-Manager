import React, { useState } from 'react';
import { Endpoint } from '../types';
import Modal from './Modal';

interface TestEndpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    endpoint: Endpoint;
}

interface TestResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    isJson: boolean;
}

const TestEndpointModal: React.FC<TestEndpointModalProps> = ({ isOpen, onClose, endpoint }) => {
    const [selectedPrefix, setSelectedPrefix] = useState(endpoint.path_prefixes[0] || '');
    const [subPath, setSubPath] = useState('');
    const [method, setMethod] = useState('GET');
    const [requestHeaders, setRequestHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
    const [requestBody, setRequestBody] = useState('{}');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<TestResponse | null>(null);

    const getFinalUrl = () => {
        const proxyPrefix = selectedPrefix;
        const cleanedSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
        
        // Handle query params in the prefix
        if (proxyPrefix.includes('?')) {
            const [base, query] = proxyPrefix.split('?');
            const finalBase = [base, cleanedSubPath].filter(Boolean).join('/');
            return `${finalBase}?${query}`;
        }

        return [proxyPrefix, cleanedSubPath].filter(Boolean).join('/');
    };
    
    const handleSendRequest = async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        let parsedHeaders: Record<string, string> = {};
        try {
            parsedHeaders = JSON.parse(requestHeaders);
        } catch (e) {
            setError('Request headers are not valid JSON.');
            setIsLoading(false);
            return;
        }

        let bodyToSend: BodyInit | undefined = undefined;
        if (method !== 'GET' && method !== 'HEAD') {
            try {
                // We just check if it's valid JSON, but send as string
                JSON.parse(requestBody);
                bodyToSend = requestBody;
            } catch (e) {
                setError('Request body is not valid JSON.');
                setIsLoading(false);
                return;
            }
        }

        try {
            const res = await fetch(getFinalUrl(), {
                method,
                headers: parsedHeaders,
                body: bodyToSend
            });
            
            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            
            const responseBody = await res.text();
            let isJson = false;
            let formattedBody = responseBody;

            try {
                formattedBody = JSON.stringify(JSON.parse(responseBody), null, 2);
                isJson = true;
            } catch (e) {
                // Not a JSON response, keep as text
            }
            
            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: formattedBody,
                isJson: isJson
            });

        } catch (err: any) {
            setError(`Request failed: ${err.message}. This could be a network error or a CORS issue if the proxy isn't configured to handle requests from this origin.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const selectClass = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const textareaClass = `block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white font-mono`;
    const statusClass = (status: number) => {
        if (status >= 500) return 'text-red-500 bg-red-100 dark:bg-red-900/50';
        if (status >= 400) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50';
        if (status >= 200) return 'text-green-500 bg-green-100 dark:bg-green-900/50';
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Test Endpoint: ${endpoint.id}`}>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Request Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="method-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Method</label>
                        <select id="method-select" value={method} onChange={e => setMethod(e.target.value)} className={selectClass}>
                            <option>GET</option>
                            <option>POST</option>
                            <option>PUT</option>
                            <option>PATCH</option>
                            <option>DELETE</option>
                        </select>
                    </div>
                    <div className="md:col-span-4">
                         <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Request URL</label>
                        <input type="text" id="url" value={getFinalUrl()} readOnly className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-not-allowed" />
                    </div>
                </div>

                {endpoint.path_prefixes.length > 1 && (
                     <div>
                        <label htmlFor="prefix-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Path Prefix</label>
                        <select id="prefix-select" value={selectedPrefix} onChange={e => setSelectedPrefix(e.target.value)} className={selectClass}>
                            {endpoint.path_prefixes.map(prefix => (
                                <option key={prefix} value={prefix}>{prefix}</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="subPath" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Append to Path (Optional)</label>
                    <input
                        type="text" id="subPath" value={subPath} onChange={(e) => setSubPath(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="e.g., /users/1"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="requestHeaders" className="block mb-2 text-sm font-medium">Request Headers (JSON)</label>
                        <textarea id="requestHeaders" rows={5} value={requestHeaders} onChange={e => setRequestHeaders(e.target.value)} className={textareaClass}></textarea>
                    </div>
                    <div>
                        <label htmlFor="requestBody" className="block mb-2 text-sm font-medium">Request Body (JSON)</label>
                        <textarea id="requestBody" rows={5} value={requestBody} onChange={e => setRequestBody(e.target.value)} className={textareaClass} disabled={method === 'GET' || method === 'HEAD'}></textarea>
                    </div>
                </div>

                {/* Response Section */}
                {isLoading && <div className="text-center p-4">Loading...</div>}
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-800 dark:text-red-200">{error}</div>}
                {response && (
                    <div className="space-y-4 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold">Response</h3>
                        <div>
                            <span className={`px-2 py-1 rounded-md text-sm font-bold ${statusClass(response.status)}`}>
                                Status: {response.status} {response.statusText}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">Response Body</h4>
                            <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs max-h-60 overflow-auto">
                                <code className={`${response.isJson ? 'language-json' : ''}`}>{response.body || '(Empty Response Body)'}</code>
                            </pre>
                        </div>
                        <div>
                            <h4 className="text-md font-semibold mb-2">Response Headers</h4>
                            <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs max-h-40 overflow-auto">
                                <code>{JSON.stringify(response.headers, null, 2)}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-end p-4 space-x-2 border-t border-gray-200 dark:border-gray-700 rounded-b">
                 <button type="button" onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600">Close</button>
                 <button type="button" onClick={handleSendRequest} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Request'}
                </button>
            </div>
        </Modal>
    );
};

export default TestEndpointModal;