import React from 'react';
import { Play, FlaskConical, Send, Loader2 } from 'lucide-react';

interface ControlsProps {
  onOptimize: (isDryRun: boolean) => void;
  onSync: () => void;
  isLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onOptimize, onSync, isLoading }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={() => onOptimize(true)}
        disabled={isLoading}
        className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg shadow-sm bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
        Test Run (Dry Run)
      </button>
      <button
        onClick={() => onOptimize(false)}
        disabled={isLoading}
        className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Optimize & Apply (Live)
      </button>
      <button
        onClick={onSync}
        disabled={isLoading}
        className="flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Sync to Etsy
      </button>
    </div>
  );
};

export default Controls;
