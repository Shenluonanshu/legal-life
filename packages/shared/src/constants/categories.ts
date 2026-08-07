import type { LawCategory } from '../types/legal';

/** 法律分类定义 */
export const LAW_CATEGORIES: Omit<LawCategory, 'id'>[] = [
  {
    name: { zh: '宪法与基本权利', en: 'Constitution & Rights' },
    icon: 'scroll',
    color: '#8B0000',
    sortOrder: 1,
  },
  {
    name: { zh: '刑法与公共安全', en: 'Criminal & Public Safety' },
    icon: 'gavel',
    color: '#DC2626',
    sortOrder: 2,
  },
  {
    name: { zh: '民法与合同', en: 'Civil & Contract Law' },
    icon: 'file-text',
    color: '#2563EB',
    sortOrder: 3,
  },
  {
    name: { zh: '劳动就业', en: 'Employment & Labor' },
    icon: 'briefcase',
    color: '#D97706',
    sortOrder: 4,
  },
  {
    name: { zh: '交通法规', en: 'Traffic Law' },
    icon: 'car',
    color: '#059669',
    sortOrder: 5,
  },
  {
    name: { zh: '婚姻家庭', en: 'Marriage & Family' },
    icon: 'heart',
    color: '#DB2777',
    sortOrder: 6,
  },
  {
    name: { zh: '消费者权益', en: 'Consumer Rights' },
    icon: 'shopping-cart',
    color: '#7C3AED',
    sortOrder: 7,
  },
  {
    name: { zh: '网络安全与隐私', en: 'Cybersecurity & Privacy' },
    icon: 'shield',
    color: '#0891B2',
    sortOrder: 8,
  },
  {
    name: { zh: '教育法律', en: 'Education Law' },
    icon: 'book-open',
    color: '#4F46E5',
    sortOrder: 9,
  },
  {
    name: { zh: '医疗与社会保障', en: 'Healthcare & Social Security' },
    icon: 'activity',
    color: '#0D9488',
    sortOrder: 10,
  },
];
