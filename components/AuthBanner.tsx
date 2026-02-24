import React from 'react';
import { Shield, ServerCrash } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
      {children}
    </div>
);

export const AuthBanner: React.FC = () => {
    const { login, logout, auth } = useAppContext();
    const { t } = useTranslation();

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start">
                        {auth.isAuthenticated ? '✅ Connected to Etsy Shop' : <><Shield className="w-6 h-6 me-2 text-purple-500"/>{t('auth_banner_title')}</>}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {auth.isAuthenticated ? 'Your shop is linked and ready for optimization!' : t('auth_banner_subtitle')}
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    {auth.isAuthenticated ? (
                        <button onClick={logout} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                            Disconnect
                        </button>
                    ) : (
                        <a href="/api/auth/login" className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors inline-block text-center no-underline">
                            Connect to Etsy Shop
                        </a>
                    )}
                </div>
            </div>
        </Card>
    );
};

export const ErrorDisplay: React.FC<{message: string}> = ({ message }) => (
    <Card>
        <div className="flex flex-col items-center justify-center text-center py-8">
            <ServerCrash className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">An Error Occurred</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">{message}</p>
        </div>
    </Card>
);