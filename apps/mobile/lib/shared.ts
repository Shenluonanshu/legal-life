/**
 * 内联共享类型（避免 monorepo Metro 解析问题）
 * 来源: packages/shared
 */

// ---------- 游戏类型 ----------
export interface CharacterStats {
  health: number;
  wealth: number;
  knowledge: number;
  happiness: number;
  legalAwareness: number;
}

export const DEFAULT_STATS: CharacterStats = {
  health: 80, wealth: 50, knowledge: 30, happiness: 70, legalAwareness: 10,
};

export type StatsEffect = Partial<CharacterStats>;
export type Gender = 'male' | 'female' | 'unspecified';
export type GamePhase = 'main_menu' | 'character_creation' | 'playing' | 'scenario_active' | 'scenario_result' | 'game_over';

export interface GameSave {
  id: string; userId: string; characterName: string; gender: Gender;
  countryId: string; regionId: string | null; age: number;
  lifeStageId: string; stats: CharacterStats;
  completedScenarioIds: string[]; currentStoryline: string | null;
  achievementIds: string[]; totalPlayedMinutes: number;
  isActive: boolean; createdAt: string; updatedAt: string;
}

export interface Scenario {
  id: string; key: string | null;
  title: Record<string, string>; narrative: Record<string, string>;
  lifeStageId: string; categoryId: string; countryId: string; regionId: string | null;
  difficulty: number; minAge: number | null; maxAge: number | null;
  triggerTags: string[]; imagePrompt: string | null;
  cachedImageUrl: string | null; imageStatus: string;
  isPublished: boolean; version: number;
}

export interface ScenarioChoice {
  id: string; scenarioId: string;
  choiceText: Record<string, string>; consequenceText: Record<string, string>;
  statsEffect: StatsEffect; legalOutcome: Record<string, string> | null;
  isLegallyCorrect: boolean; isBestEnding: boolean; sortOrder: number;
  branchTag: string | null; nextSceneHint: string | null; nextSceneKey: string | null;
}

// ---------- 法律类型 ----------
export interface Country {
  id: string; code: string; name: Record<string, string>;
  legalSystem: string; currency: string | null;
  defaultLanguage: string; isActive: boolean;
}

export interface Region {
  id: string; countryId: string; name: Record<string, string>;
  type: string; hasSpecialLaws: boolean; isActive: boolean;
}

export interface LawCategory {
  id: string; name: Record<string, string>; icon: string; color: string; sortOrder: number;
}

export interface Law {
  id: string; countryId: string; regionId: string | null; categoryId: string;
  title: Record<string, string>; lawName: Record<string, string>;
  articleRef: string; fullText: Record<string, string>;
  plainSummary: Record<string, string>; keywords: string[]; tags: string[];
  effectiveDate: string | null; sourceUrl: string | null; sourceName: string | null;
  isVerified: boolean; viewCount: number;
}

export interface LifeStage {
  id: string; name: Record<string, string>; ageRange: [number, number];
  icon: string; sortOrder: number; unlockedCategoryIds: string[];
}

export interface Achievement {
  id: string; code: string; title: Record<string, string>;
  description: Record<string, string>; icon: string;
  conditionType: string; conditionParams: Record<string, unknown>;
  category: string;
}

// ---------- 常量 ----------
export const COUNTRIES: Omit<Country, 'id'>[] = [
  { code: 'CN', name: { zh: '中国', en: 'China' }, legalSystem: 'civil_law', currency: 'CNY', defaultLanguage: 'zh', isActive: true },
  { code: 'US', name: { zh: '美国', en: 'United States' }, legalSystem: 'common_law', currency: 'USD', defaultLanguage: 'en', isActive: true },
  { code: 'EU', name: { zh: '欧盟', en: 'European Union' }, legalSystem: 'civil_law', currency: 'EUR', defaultLanguage: 'en', isActive: true },
];

export const DEFAULT_COUNTRY = 'CN';

export const LIFE_STAGES: Omit<LifeStage, 'id' | 'unlockedCategoryIds'>[] = [
  { name: { zh: '童年', en: 'Childhood' }, ageRange: [6, 12], icon: '👶', sortOrder: 1 },
  { name: { zh: '少年', en: 'Teenager' }, ageRange: [13, 17], icon: '🧒', sortOrder: 2 },
  { name: { zh: '青年', en: 'Young Adult' }, ageRange: [18, 25], icon: '🧑', sortOrder: 3 },
  { name: { zh: '壮年', en: 'Adult' }, ageRange: [26, 40], icon: '👨', sortOrder: 4 },
  { name: { zh: '中年', en: 'Middle Age' }, ageRange: [41, 60], icon: '🧔', sortOrder: 5 },
  { name: { zh: '老年', en: 'Senior' }, ageRange: [61, 99], icon: '👴', sortOrder: 6 },
];

export const LAW_CATEGORIES: Omit<LawCategory, 'id'>[] = [
  { name: { zh: '宪法与基本权利', en: 'Constitution & Rights' }, icon: 'scroll', color: '#8B0000', sortOrder: 1 },
  { name: { zh: '刑法与公共安全', en: 'Criminal & Public Safety' }, icon: 'gavel', color: '#DC2626', sortOrder: 2 },
  { name: { zh: '劳动就业', en: 'Employment & Labor' }, icon: 'briefcase', color: '#D97706', sortOrder: 3 },
  { name: { zh: '交通法规', en: 'Traffic Law' }, icon: 'car', color: '#059669', sortOrder: 4 },
  { name: { zh: '消费者权益', en: 'Consumer Rights' }, icon: 'shopping-cart', color: '#7C3AED', sortOrder: 5 },
  { name: { zh: '婚姻家庭', en: 'Marriage & Family' }, icon: 'heart', color: '#DB2777', sortOrder: 6 },
  { name: { zh: '网络安全与隐私', en: 'Cybersecurity & Privacy' }, icon: 'shield', color: '#0891B2', sortOrder: 7 },
  { name: { zh: '教育法律', en: 'Education Law' }, icon: 'book-open', color: '#4F46E5', sortOrder: 8 },
];

// ---------- 工具函数 ----------
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function applyStatsEffect(stats: CharacterStats, effect: StatsEffect): CharacterStats {
  const result = { ...stats };
  for (const key of Object.keys(effect) as (keyof StatsEffect)[]) {
    const delta = effect[key];
    if (delta !== undefined) result[key] = clamp(result[key] + delta);
  }
  return result;
}

export function generateRandomStats(totalPoints = 300): CharacterStats {
  const raw: number[] = Array.from({ length: 5 }, () => Math.random() * 100 + 20);
  const sum = raw.reduce((a, b) => a + b, 0);
  const normalized = raw.map((v) => Math.round((v / sum) * totalPoints));
  return {
    health: clamp(normalized[0]!), wealth: clamp(normalized[1]!),
    knowledge: clamp(normalized[2]!), happiness: clamp(normalized[3]!),
    legalAwareness: clamp(normalized[4]!),
  };
}

export const STAT_NAMES: Record<keyof CharacterStats, { zh: string; en: string; icon: string }> = {
  health: { zh: '健康', en: 'Health', icon: '🏥' },
  wealth: { zh: '财富', en: 'Wealth', icon: '💰' },
  knowledge: { zh: '知识', en: 'Knowledge', icon: '📚' },
  happiness: { zh: '幸福', en: 'Happiness', icon: '😊' },
  legalAwareness: { zh: '法律意识', en: 'Legal Awareness', icon: '⚖️' },
};

export function getLifeStageIndexByAge(age: number): number {
  for (let i = LIFE_STAGES.length - 1; i >= 0; i--) {
    const stage = LIFE_STAGES[i]!;
    if (age >= stage.ageRange[0] && age < stage.ageRange[1]) return i;
  }
  return LIFE_STAGES.length - 1;
}
