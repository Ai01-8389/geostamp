import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import zh from './locales/zh.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import ar from './locales/ar.json'

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },
  es: { translation: es },
  ru: { translation: ru },
  ar: { translation: ar }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie']
    }
  })

export default i18n