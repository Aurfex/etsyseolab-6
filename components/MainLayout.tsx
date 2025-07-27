import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import { AuthBanner } from './AuthBanner';
import { useTranslation } from '../contexts/LanguageContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarCollapsed, auth, page } = useAppContext();
  const { t } = useTranslation();

  const getPageTitle = (): string => {
    const pageKey = `nav_${page}`;
    const title = t(pageKey as any);
    if (title === pageKey || !title) {
        return page.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return title;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 font-sans">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
         <Header pageTitle={getPageTitle()}/>
         <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              {auth.isAuthenticated ? children : <AuthBanner />}
            </div>
         </main>
      </div>
    </div>
  );
};

export default MainLayout;
