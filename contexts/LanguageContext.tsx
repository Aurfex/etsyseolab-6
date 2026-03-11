import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, TFunction, Translations } from '../types';
import { useAppContext } from './AppContext';
import en from '../locales/en.ts';
import fr from '../locales/fr.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationData: { [key in Language]: Translations } = {
  en,
  fr,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useAppContext();
  const language = settings.language;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr'; // French is LTR
  }, [language]);

  const t: TFunction = (key, options) => {
    let translation = translationData[language][key] || key;
    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }
    return translation;
  };

  const setLanguage = (newLanguage: Language) => {
    updateSettings({ ...settings, language: newLanguage });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};