import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import de from './locales/de/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
};

// Custom path detector for URL-based language
const pathDetector = {
  name: 'path',
  lookup() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && ['de', 'es', 'fr'].includes(firstSegment)) {
      return firstSegment;
    }
    return 'en';
  },
};

// Create custom language detector with path detection
const languageDetector = new LanguageDetector();
languageDetector.addDetector(pathDetector);

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'es', 'fr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
