
import React from 'react';
import { GlobeAltIcon } from './Icons';

const Header: React.FC = () => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md">
            <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                    <span className="text-xl font-semibold text-gray-800 dark:text-white">
                        Reverse Proxy Manager
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
