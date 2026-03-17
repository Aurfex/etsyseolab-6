import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { ToastData } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (toast) {
      const duration = toast.type === 'info' ? 10000 : 5000;
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const toastConfig = {
    success: {
      icon: CheckCircle,
      barColor: 'bg-green-500',
      textColor: 'text-green-800 dark:text-green-200',
      bgColor: 'bg-green-50 dark:bg-green-900/50',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    error: {
      icon: XCircle,
      barColor: 'bg-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      bgColor: 'bg-red-50 dark:bg-red-900/50',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    info: {
      icon: RefreshCw,
      barColor: 'bg-blue-500',
      textColor: 'text-blue-800 dark:text-blue-200',
      bgColor: 'bg-blue-50 dark:bg-blue-900/40',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
  };

  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const message = t(toast.tKey, toast.options);

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border ${config.bgColor} ${config.borderColor} animate-fade-in-up`}
      role="alert"
    >
      <div className="flex">
        <div className={`w-2 ${config.barColor}`}></div>
        <div className="flex items-center p-4">
          <Icon className={`w-6 h-6 ${config.textColor} ${toast.type === 'info' ? 'animate-spin' : ''}`} />
          <p className={`ms-3 font-medium text-sm ${config.textColor}`}>
            {message}
          </p>
        </div>
      </div>
       <button onClick={onClose} className="absolute top-1 right-1 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-500/10">
            <XCircle className="w-5 h-5" />
        </button>
    </div>
  );
};

export default Toast;