// ============================================================
// 律途人生 — 共享类型包导出索引
// ============================================================

// Types
export type * from './types/game';
export type * from './types/legal';
export type * from './types/scenario';

// Constants
export { COUNTRIES, DEFAULT_COUNTRY } from './constants/countries';
export { LIFE_STAGES, getLifeStageIndexByAge } from './constants/lifeStages';
export { LAW_CATEGORIES } from './constants/categories';

// Utils
export {
  clamp,
  applyStatsEffect,
  meetsStatRequirements,
  generateRandomStats,
  STAT_NAMES,
} from './utils/attributeCalc';
