import React from 'react';
import { Shield, ArrowLeft, Lock, FileText, Server } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const PrivacyPolicyPage: React.FC = () => {
  const { setPage, auth } = useAppContext();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-8 md:p-20 relative">
      <div className="absolute top-8 right-8">
        <button onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold hover:opacity-80 transition-opacity">
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center text-sm font-medium text-purple-600 mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('privacy_back')}
        </button>

        <div className="flex items-center space-x-3 mb-10">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black">{t('privacy_title')}</h1>
        </div>

        <div className="prose prose-purple dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400">
          <p className="text-lg font-medium text-gray-900 dark:text-white border-l-4 border-purple-500 pl-4">
            {t('privacy_intro')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Lock className="w-6 h-6 text-purple-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('privacy_encrypted')}</h3>
              <p className="text-sm">{t('privacy_encrypted_desc')}</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Server className="w-6 h-6 text-purple-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('privacy_zero_selling')}</h3>
              <p className="text-sm">{t('privacy_zero_selling_desc')}</p>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{t('privacy_s1_title')}</h2>
            <p>{t('privacy_s1_desc')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{t('privacy_s2_title')}</h2>
            <p>{/* eslint-disable-next-line react/no-danger */}
            <p dangerouslySetInnerHTML={{ __html: t('privacy_s2_desc') }} /></p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{t('privacy_s3_title')}</h2>
            <p>{t('privacy_s3_desc')}</p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;