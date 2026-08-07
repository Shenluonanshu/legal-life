import type { Country } from '../types/legal';

/** 支持的国家列表 */
export const COUNTRIES: Omit<Country, 'id'>[] = [
  {
    code: 'CN',
    name: { zh: '中国', en: 'China' },
    legalSystem: 'civil_law',
    currency: 'CNY',
    defaultLanguage: 'zh',
    isActive: true,
  },
  {
    code: 'US',
    name: { zh: '美国', en: 'United States' },
    legalSystem: 'common_law',
    currency: 'USD',
    defaultLanguage: 'en',
    isActive: false,
  },
  {
    code: 'JP',
    name: { zh: '日本', en: 'Japan' },
    legalSystem: 'civil_law',
    currency: 'JPY',
    defaultLanguage: 'ja',
    isActive: false,
  },
  {
    code: 'KR',
    name: { zh: '韩国', en: 'South Korea' },
    legalSystem: 'civil_law',
    currency: 'KRW',
    defaultLanguage: 'ko',
    isActive: false,
  },
  {
    code: 'DE',
    name: { zh: '德国', en: 'Germany' },
    legalSystem: 'civil_law',
    currency: 'EUR',
    defaultLanguage: 'de',
    isActive: false,
  },
  {
    code: 'FR',
    name: { zh: '法国', en: 'France' },
    legalSystem: 'civil_law',
    currency: 'EUR',
    defaultLanguage: 'fr',
    isActive: false,
  },
];

export const DEFAULT_COUNTRY = 'CN';
