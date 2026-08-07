// ============================================================
// 律途人生 — 游戏核心类型定义
// ============================================================

// ---------- 角色属性 ----------

/** 角色属性维度 */
export interface CharacterStats {
  health: number;          // 健康 (0-100)
  wealth: number;          // 财富 (0-100)
  knowledge: number;       // 知识 (0-100)
  happiness: number;       // 幸福 (0-100)
  legalAwareness: number;  // 法律意识 (0-100)
}

export const DEFAULT_STATS: CharacterStats = {
  health: 80,
  wealth: 50,
  knowledge: 30,
  happiness: 70,
  legalAwareness: 10,
};

/** 属性变化（正数=增加，负数=减少） */
export type StatsEffect = Partial<CharacterStats>;

/** 角色性别 */
export type Gender = 'male' | 'female' | 'unspecified';

// ---------- 角色 ----------

export interface Character {
  name: string;
  gender: Gender;
  age: number;
  countryCode: string;
  regionId: string | null;
  stats: CharacterStats;
  lifeStageId: string;
}

// ---------- 人生阶段 ----------

export interface LifeStage {
  id: string;
  name: Record<string, string>;  // { zh: '青年期', en: 'Young Adult' }
  ageRange: [number, number];     // [18, 35)
  icon: string;
  sortOrder: number;
  unlockedCategoryIds: string[];
}

// ---------- 游戏存档 ----------

export interface GameSave {
  id: string;
  userId: string;
  characterName: string;
  gender: Gender;
  countryId: string;
  regionId: string | null;
  age: number;
  lifeStageId: string;
  stats: CharacterStats;
  completedScenarioIds: string[];
  currentStoryline: string | null;
  achievementIds: string[];
  totalPlayedMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------- 场景 ----------

/** 场景难度 */
export type ScenarioDifficulty = 1 | 2 | 3 | 4 | 5;

/** 图片状态 */
export type ImageStatus = 'pending' | 'generated' | 'failed';

export interface Scenario {
  id: string;
  title: Record<string, string>;
  narrative: Record<string, string>;
  lifeStageId: string;
  categoryId: string;
  countryId: string;
  regionId: string | null;
  difficulty: ScenarioDifficulty;
  minAge: number | null;
  maxAge: number | null;
  triggerTags: string[];
  imagePrompt: string | null;
  cachedImageUrl: string | null;
  imageStatus: ImageStatus;
  isPublished: boolean;
  version: number;
}

// ---------- 场景选项 ----------

export interface ScenarioChoice {
  id: string;
  scenarioId: string;
  choiceText: Record<string, string>;
  consequenceText: Record<string, string>;
  statsEffect: StatsEffect;
  legalOutcome: Record<string, string> | null;
  isLegallyCorrect: boolean;
  isBestEnding: boolean;
  sortOrder: number;
}

// ---------- 游戏阶段 ----------

export type GamePhase =
  | 'main_menu'
  | 'character_creation'
  | 'playing'
  | 'scenario_active'
  | 'scenario_result'
  | 'game_over';

// ---------- 游戏状态 ----------

export interface GameState {
  phase: GamePhase;
  currentSave: GameSave | null;
  currentScenario: Scenario | null;
  currentChoices: ScenarioChoice[];
  selectedChoice: ScenarioChoice | null;
  pendingStatChanges: StatsEffect | null;
  revealedLawIds: string[];
  unlockedAchievementIds: string[];
}
