/**
 * 国际化配置
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import zh from '../i18n/zh.json';
import en from '../i18n/en.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'zh';

i18next.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: deviceLanguage === 'en' ? 'en' : 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
