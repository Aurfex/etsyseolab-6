import React from 'react';
import { Mail, MessageSquare, MapPin, ArrowLeft, Send } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const ContactPage: React.FC = () => {
  const { setPage, auth, showToast } = useAppContext();
  const { t, language, setLanguage } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({ message: t('contact_success_message'), type: 'success' });
    setTimeout(() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing'), 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-8 md:p-20 relative">
      <div className="absolute top-8 right-8">
        <button onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')} className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-[#F1641E] rounded-full font-bold hover:opacity-80 transition-opacity">
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center text-sm font-medium text-[#F1641E] mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('contact_back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-5xl font-black mb-6">{t('contact_title')}</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10">
              {t('contact_subtitle')}
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-[#F1641E]">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">{t('contact_email_title')}</h4>
                  <p className="text-gray-500">{t('contact_email_value')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">{t('contact_chat_title')}</h4>
                  <p className="text-gray-500">{t('contact_chat_value')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">{t('contact_location_title')}</h4>
                  <p className="text-gray-500">{t('contact_location_value')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">{t('contact_form_name')}</label>
                  <input required type="text" className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#F1641E] outline-none" placeholder={t('contact_form_name_placeholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">{t('contact_form_email')}</label>
                  <input required type="email" className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#F1641E] outline-none" placeholder={t('contact_form_email_placeholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">{t('contact_form_message')}</label>
                <textarea required rows={5} className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#F1641E] outline-none resize-none" placeholder={t('contact_form_message_placeholder')} />
              </div>
              <button type="submit" className="w-full py-4 bg-[#F1641E] text-white rounded-2xl font-bold text-lg hover:bg-[#D95A1B] transition-all flex items-center justify-center space-x-2">
                <Send className="w-5 h-5" />
                <span>{t('contact_form_submit')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;