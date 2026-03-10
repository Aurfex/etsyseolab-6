import React, { useMemo } from 'react';
import { Page, Language } from '../types';
import { LayoutDashboard, SearchCheck, Zap, Bot, Radar, Settings, Sun, Moon, HelpCircle, Mic, Gift, ChevronLeft, ChevronRight, User, LogOut, Trophy, LayoutTemplate, PlusSquare, Lock, Calculator, ImageIcon } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAppContext } from '../contexts/AppContext';

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    collapsed: boolean;
    language: Language;
    disabled?: boolean;
}> = ({ icon: Icon, label, isActive, onClick, collapsed, language, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={collapsed ? label : undefined}
      className={`relative flex items-center w-full h-11 px-3 rounded-lg text-sm font-medium transition-colors duration-200 group
        ${isActive && !disabled
          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }
        ${collapsed ? 'justify-center' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive && !disabled ? 'text-purple-600 dark:text-purple-300' : ''}`} />
      <span className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
      
      {disabled && !collapsed && (
          <Lock className="w-4 h-4 ml-auto text-gray-500" />
      )}

      {isActive && !disabled && <div className={`absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-purple-600 rounded-full ${language === 'fa' ? 'right-0' : 'left-0'}`}></div>}
       {!collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 lg:hidden">
            {label}
        </div>
      )}
    </button>
  );
};


const Sidebar: React.FC = () => {
    const {
        page,
        setPage,
        settings,
        effectiveTheme,
        updateSettings,
        isSidebarCollapsed,
        toggleSidebar,
        auth,
        logout
    } = useAppContext();
    const { t, language, setLanguage } = useTranslation();

    const navItems = useMemo(() => {
        const allItems = [
            { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard, authRequired: false },
            { id: 'optimizer', label: t('nav_optimizer'), icon: SearchCheck, authRequired: true },
            { id: 'add_product', label: t('nav_add_product'), icon: PlusSquare, authRequired: true },
            { id: 'pricing', label: 'Pricing Calculator', icon: Calculator, authRequired: true },
            { id: 'image_seo', label: 'Image SEO', icon: ImageIcon, authRequired: true },
            { id: 'autopilot', label: t('nav_autopilot'), icon: Bot, authRequired: true },
            { id: 'competitor', label: t('nav_competitor'), icon: Radar, authRequired: true },
        ];

        return allItems.map(item => ({
            ...item,
            disabled: item.authRequired && !auth.isAuthenticated
        }));

    }, [t, auth.isAuthenticated]);

    const settingsItem = { id: 'settings', label: t('nav_settings'), icon: Settings, disabled: false };

    const toggleTheme = () => {
        const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
        updateSettings({ ...settings, theme: newTheme });
    };

    const toggleLanguage = () => {
        const newLanguage = language === 'en' ? 'fa' : 'en';
        setLanguage(newLanguage);
    };

    return (
        <aside className={`fixed top-0 left-0 z-20 flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-full md:w-20' : 'w-64'}`}>
            <div className={`flex items-center border-b border-gray-200 dark:border-gray-800 px-4 transition-all flex-shrink-0 ${isSidebarCollapsed ? 'h-16 justify-center' : 'h-16 justify-between'}`}>
                <div className={`flex items-center gap-2 overflow-hidden ${isSidebarCollapsed ? 'hidden' : ''}`}>
                    <Zap className="h-7 w-7 text-purple-500 flex-shrink-0" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">ETSY SEOLAB</span>
                </div>
                 <Zap className={`h-7 w-7 text-purple-500 flex-shrink-0 ${isSidebarCollapsed ? '' : 'hidden'}`} />
                <button onClick={toggleSidebar} className={'p-2 rounded-full hidden lg:block text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors'}>
                    {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
            
            <nav className="flex-grow px-4 py-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={page === item.id}
                        onClick={() => !item.disabled && setPage(item.id as Page)}
                        collapsed={isSidebarCollapsed}
                        language={language}
                        disabled={item.disabled}
                    />
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2 flex-shrink-0">
                <NavItem
                    icon={settingsItem.icon}
                    label={settingsItem.label}
                    isActive={page === settingsItem.id}
                    onClick={() => !settingsItem.disabled && setPage(settingsItem.id as Page)}
                    collapsed={isSidebarCollapsed}
                    language={language}
                    disabled={settingsItem.disabled}
                />
                 {auth.isAuthenticated && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                         <div className="flex items-center p-2">
                            <User className="w-8 h-8 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 flex-shrink-0"/>
                            <div className={`ml-3 overflow-hidden ${isSidebarCollapsed ? 'hidden' : ''}`}>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{auth.user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{auth.user?.email}</p>
                            </div>
                        </div>
                    </div>
                 )}
                <div className="flex items-center justify-around">
                     <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
                        {effectiveTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button onClick={toggleLanguage} className="p-2 w-10 text-center rounded-full text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors" aria-label="Toggle language">
                        {language === 'en' ? t('language_toggle_fa') : t('language_toggle_en')}
                    </button>
                    {auth.isAuthenticated && (
                        <button onClick={logout} className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors" aria-label="Log out">
                            <LogOut className="w-5 h-5 text-red-500" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
