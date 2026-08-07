// ============================================================
// 律途人生 — 法律数据类型定义
// ============================================================

/** 法系类型 */
export type LegalSystem = 'civil_law' | 'common_law' | 'mixed';

/** 国家 */
export interface Country {
  id: string;
  code: string;                 // CN, US, JP, KR, DE, FR
  name: Record<string, string>; // { zh: '中国', en: 'China' }
  legalSystem: LegalSystem;
  currency: string | null;
  defaultLanguage: string;
  isActive: boolean;
}

/** 地区/州/省 */
export interface Region {
  id: string;
  countryId: string;
  name: Record<string, string>;
  type: 'province' | 'state' | 'prefecture' | 'special_region';
  hasSpecialLaws: boolean;
  isActive: boolean;
}

/** 法律分类 */
export interface LawCategory {
  id: string;
  name: Record<string, string>; // { zh: '劳动就业', en: 'Employment' }
  icon: string;
  color: string;
  sortOrder: number;
}

/** 法律条款 */
export interface Law {
  id: string;
  countryId: string;
  regionId: string | null;
  categoryId: string;
  title: Record<string, string>;
  lawName: Record<string, string>;    // 所属法律名称
  articleRef: string;                  // "第39条"
  fullText: Record<string, string>;    // 法条原文
  plainSummary: Record<string, string>; // 通俗解读
  keywords: string[];
  tags: string[];
  effectiveDate: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  isVerified: boolean;
  viewCount: number;
}

/** 法律知识收集记录 */
export interface LawCollection {
  saveId: string;
  lawId: string;
  discoveredAt: string;
  readCount: number;
  isFavorite: boolean;
}

/** 法律知识稀有度 */
export type LawRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** 法律图鉴条目（含稀有度） */
export interface LawCodexEntry extends Law {
  rarity: LawRarity;
  isDiscovered: boolean;
  discoveredAt: string | null;
  relatedScenarioIds: string[];
}
