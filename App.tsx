import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Endpoint } from './types';
import * as apiService from './services/apiService';
import Header from './components/Header';
import EndpointList from './components/EndpointList';
import EndpointFormModal from './components/EndpointFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import TestEndpointModal from './components/TestEndpointModal';
import { PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './components/Icons';

const App: React.FC = () => {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState<boolean>(false);
    const [deletingEndpointId, setDeletingEndpointId] = useState<string | null>(null);
    const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
    const [testingEndpoint, setTestingEndpoint] = useState<Endpoint | null>(null);

    const [isConfirmImportModalOpen, setIsConfirmImportModalOpen] = useState<boolean>(false);
    const [pendingImportEndpoints, setPendingImportEndpoints] = useState<Endpoint[] | null>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);


    const fetchEndpoints = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await apiService.getEndpoints();
            setEndpoints(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch endpoints.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEndpoints();
    }, [fetchEndpoints]);

    const handleOpenAddModal = () => {
        setEditingEndpoint(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (endpoint: Endpoint) => {
        setEditingEndpoint(endpoint);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingEndpoint(null);
    };

    const handleSaveEndpoint = async (endpoint: Endpoint) => {
        try {
            if (editingEndpoint) {
                await apiService.updateEndpoint(endpoint.id, endpoint);
            } else {
                await apiService.addEndpoint(endpoint);
            }
            await fetchEndpoints();
            handleCloseFormModal();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleOpenConfirmDeleteModal = (id: string) => {
        setDeletingEndpointId(id);
        setIsConfirmDeleteModalOpen(true);
    };

    const handleCloseConfirmDeleteModal = () => {
        setIsConfirmDeleteModalOpen(false);
        setDeletingEndpointId(null);
    };

    const handleDeleteEndpoint = async () => {
        if (!deletingEndpointId) return;
        try {
            await apiService.deleteEndpoint(deletingEndpointId);
            await fetchEndpoints();
            handleCloseConfirmDeleteModal();
        } catch (err: any) {
             alert(`Error: ${err.message}`);
        }
    };

    const handleCloneEndpoint = async (id: string) => {
        try {
            await apiService.cloneEndpoint(id);
            await fetchEndpoints();
        } catch (err: any) {
            alert(`Error cloning endpoint: ${err.message}`);
        }
    };

    const handleEndpointHit = async (id: string) => {
        try {
            await apiService.logEndpointHit(id);
            // Re-fetch to show updated stats
            const data = await apiService.getEndpoints();
            setEndpoints(data);
        } catch (err: any) {
            alert(`Error simulating hit: ${err.message}`);
        }
    };

    const handleOpenTestModal = (id: string) => {
        const endpoint = endpoints.find(ep => ep.id === id);
        if (endpoint) {
            setTestingEndpoint(endpoint);
            setIsTestModalOpen(true);
        } else {
            console.error(`Could not find endpoint with ID: ${id}`);
            alert(`Error: Could not find endpoint with ID '${id}' to test.`);
        }
    };

    const handleCloseTestModal = () => {
        setIsTestModalOpen(false);
        setTestingEndpoint(null);
    };
    
    const handleExportConfig = () => {
        try {
            const jsonString = JSON.stringify(endpoints, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "proxy-config.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(`Error exporting configuration: ${err.message}`);
        }
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };
    
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Failed to read file content.");
                }
                const parsedEndpoints = JSON.parse(text);
                
                if (!Array.isArray(parsedEndpoints) || (parsedEndpoints.length > 0 && (!parsedEndpoints[0].id || !parsedEndpoints[0].target_url))) {
                    throw new Error("Invalid configuration file format. The file should be an array of endpoints.");
                }

                setPendingImportEndpoints(parsedEndpoints);
                setIsConfirmImportModalOpen(true);
            } catch (err: any) {
                alert(`Error parsing configuration file: ${err.message}`);
            }
        };
        reader.onerror = () => {
            alert("Error reading the file.");
        };
        reader.readAsText(file);
        
        event.target.value = '';
    };

    const handleConfirmImport = async () => {
        if (!pendingImportEndpoints) return;
        try {
            await apiService.overwriteEndpoints(pendingImportEndpoints);
            await fetchEndpoints();
        } catch (err: any) {
            alert(`Error applying imported configuration: ${err.message}`);
        } finally {
            setIsConfirmImportModalOpen(false);
            setPendingImportEndpoints(null);
        }
    };

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                 <input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleFileSelected}
                    accept=".json"
                    className="hidden"
                />
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Configured Endpoints</h1>
                    <div className="flex items-center gap-2">
                         <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-200"
                            title="Import from JSON file"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5" />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={handleExportConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-200"
                            title="Export to JSON file"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Add Endpoint</span>
                        </button>
                    </div>
                </div>

                {isLoading && <p className="text-center text-lg">Loading endpoints...</p>}
                {error && <p className="text-center text-lg text-red-500">{error}</p>}
                {!isLoading && !error && (
                    <EndpointList
                        endpoints={endpoints}
                        onEdit={handleOpenEditModal}
                        onDelete={handleOpenConfirmDeleteModal}
                        onClone={handleCloneEndpoint}
                        onHit={handleEndpointHit}
                        onTest={handleOpenTestModal}
                    />
                )}
            </main>

            {isFormModalOpen && (
                <EndpointFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSave={handleSaveEndpoint}
                    endpoint={editingEndpoint}
                />
            )}

            {isConfirmDeleteModalOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmDeleteModalOpen}
                    onClose={handleCloseConfirmDeleteModal}
                    onConfirm={handleDeleteEndpoint}
                    title="Delete Endpoint"
                    message={`Are you sure you want to delete the endpoint with ID "${deletingEndpointId}"? This action cannot be undone.`}
                />
            )}
            
            {isConfirmImportModalOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmImportModalOpen}
                    onClose={() => setIsConfirmImportModalOpen(false)}
                    onConfirm={handleConfirmImport}
                    title="Confirm Configuration Import"
                    message="Are you sure you want to import this configuration? This will overwrite all of your current endpoints."
                    confirmText="Yes, Overwrite"
                    confirmButtonClass="bg-amber-500 hover:bg-amber-600 focus:ring-4 focus:outline-none focus:ring-amber-300 dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus:ring-amber-800"
                />
            )}

            {isTestModalOpen && testingEndpoint && (
                <TestEndpointModal
                    isOpen={isTestModalOpen}
                    onClose={handleCloseTestModal}
                    endpoint={testingEndpoint}
                />
            )}
        </div>
    );
};

export default App;
