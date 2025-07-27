import React, { useEffect, useRef } from 'react';
import { ActivityLog, ActivityStatus } from '../types';
import { Info, CheckCircle, AlertTriangle, XCircle, Terminal, RefreshCw } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface LogPanelProps {
  logs: ActivityLog[];
}

const StatusIcon: React.FC<{ status: ActivityStatus }> = ({ status }) => {
  switch (status) {
    case 'Success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'Running':
    case 'Processing':
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'Queued':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 h-96 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center">
        <Terminal className="w-5 h-5 mr-3 text-gray-500" />
        <h3 className="text-lg font-bold text-gray-200">Activity Log</h3>
      </div>
      <div ref={logContainerRef} className="flex-grow p-4 overflow-y-auto text-sm space-y-3">
        {logs.length === 0 ? (
           <div className="flex items-center justify-center h-full text-gray-600">
            <p>Logs will appear here...</p>
           </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 font-mono">
              <span className="text-gray-600 mt-0.5">{log.timestamp.toLocaleTimeString()}</span>
              <div className="flex items-start gap-2 flex-1">
                <div className="mt-0.5"><StatusIcon status={log.status} /></div>
                <p className="text-gray-300 break-words w-full">
                    {t(log.tKey, log.options)}
                    {log.subtitle && <span className="text-gray-500"> - {log.subtitle}</span>}
                    {log.change && <span className="text-green-400 ml-2">{log.change}</span>}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel;