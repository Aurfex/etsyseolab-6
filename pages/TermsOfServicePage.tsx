import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const TermsOfServicePage: React.FC = () => {
  const { setPage, auth } = useAppContext();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-8 md:p-20 relative">
      <div className="absolute top-8 right-8">
        <button onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold hover:opacity-80 transition-opacity">
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center text-sm font-medium text-purple-600 mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('terms_back')}
        </button>

        <div className="flex items-center space-x-3 mb-10">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black">{t('terms_title')}</h1>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
          <p className="text-lg">{t('terms_date')}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('terms_s1_title')}</h2>
            <p>{t('terms_s1_desc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('terms_s2_title')}</h2>
            <p>{t('terms_s2_desc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('terms_s3_title')}</h2>
            <p>{t('terms_s3_desc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('terms_s4_title')}</h2>
            <p>{t('terms_s4_desc')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;