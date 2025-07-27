import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

interface HeaderProps {
    pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle }) => {
    const { t } = useTranslation();
    const { settings } = useAppContext();

    return (
        <header className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center px-6 h-16">
                 <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
                <div className="flex items-center gap-2">
                     <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {t('ai_active')}
                    </button>
                    {settings.autopilot.enabled && (
                        <button className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700/80 rounded-full">
                            {t('autopilot_on')}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
export default Header;
