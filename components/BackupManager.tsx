import React from 'react';
import { Backup } from '../types';
import { DatabaseZap, RotateCcw, Trash2, Save } from 'lucide-react';

interface BackupManagerProps {
    backups: Backup[];
    onCreateBackup: () => void;
    onRestoreBackup: (id: string) => void;
    onDeleteBackup: (id: string) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ backups, onCreateBackup, onRestoreBackup, onDeleteBackup }) => {
    return (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                    <DatabaseZap className="w-5 h-5 mr-3 text-gray-500" />
                    <h3 className="text-lg font-bold text-gray-200">Backup Manager</h3>
                </div>
                <button
                    onClick={onCreateBackup}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-primary-500 transition-colors"
                >
                    <Save className="w-4 h-4 mr-2" />
                    New Backup
                </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-64">
                {backups.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-4">No backups found.</p>
                ) : (
                    backups.map(backup => (
                        <div key={backup.id} className="bg-gray-800/60 p-3 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-200">Backup - {backup.timestamp.toLocaleDateString()}</p>
                                <p className="text-xs text-gray-400">{backup.timestamp.toLocaleTimeString()} - {backup.productCount} products</p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => onRestoreBackup(backup.id)}
                                    title="Restore"
                                    className="p-1.5 text-yellow-400 hover:bg-yellow-900/50 rounded-md transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDeleteBackup(backup.id)}
                                    title="Delete"
                                    className="p-1.5 text-red-400 hover:bg-red-900/50 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BackupManager;
