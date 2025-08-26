import React from 'react';
import { Endpoint } from '../types';
import EndpointItem from './EndpointItem';

interface EndpointListProps {
    endpoints: Endpoint[];
    onEdit: (endpoint: Endpoint) => void;
    onDelete: (id: string) => void;
    onClone: (id: string) => void;
    onHit: (id: string) => void;
}

const EndpointList: React.FC<EndpointListProps> = ({ endpoints, onEdit, onDelete, onClone, onHit }) => {
    if (endpoints.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Endpoints Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Get started by adding a new proxy endpoint.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {endpoints.map(endpoint => (
                <EndpointItem
                    key={endpoint.id}
                    endpoint={endpoint}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClone={onClone}
                    onHit={onHit}
                />
            ))}
        </div>
    );
};

export default EndpointList;