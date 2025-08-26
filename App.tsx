import React, { useState, useEffect, useCallback } from 'react';
import { Endpoint } from './types';
import * as apiService from './services/apiService';
import Header from './components/Header';
import EndpointList from './components/EndpointList';
import EndpointFormModal from './components/EndpointFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import { PlusIcon } from './components/Icons';

const App: React.FC = () => {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [deletingEndpointId, setDeletingEndpointId] = useState<string | null>(null);

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

    const handleOpenConfirmModal = (id: string) => {
        setDeletingEndpointId(id);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setDeletingEndpointId(null);
    };

    const handleDeleteEndpoint = async () => {
        if (!deletingEndpointId) return;
        try {
            await apiService.deleteEndpoint(deletingEndpointId);
            await fetchEndpoints();
            handleCloseConfirmModal();
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


    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Configured Endpoints</h1>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Endpoint</span>
                    </button>
                </div>

                {isLoading && <p className="text-center text-lg">Loading endpoints...</p>}
                {error && <p className="text-center text-lg text-red-500">{error}</p>}
                {!isLoading && !error && (
                    <EndpointList
                        endpoints={endpoints}
                        onEdit={handleOpenEditModal}
                        onDelete={handleOpenConfirmModal}
                        onClone={handleCloneEndpoint}
                        onHit={handleEndpointHit}
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

            {isConfirmModalOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleDeleteEndpoint}
                    title="Delete Endpoint"
                    message={`Are you sure you want to delete the endpoint with ID "${deletingEndpointId}"? This action cannot be undone.`}
                />
            )}
        </div>
    );
};

export default App;