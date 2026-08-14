import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('kopargaon_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kopargaon_language', language);
  }, [language]);

  const changeLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguage(lang);
    }
  };

  const t = (key, fallback = '') => {
    const dict = translations[language] || translations.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback to prevent blank screen crash
    return {
      language: 'en',
      changeLanguage: () => {},
      t: (key, fallback = '') => translations.en[key] || fallback || key
    };
  }
  return context;
};

export const useTranslation = () => {
  const { language, changeLanguage, t } = useLanguage();
  return { language, changeLanguage, t };
};
