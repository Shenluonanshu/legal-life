// ============================================================
// 游戏引擎 — 导出索引
// ============================================================

export { createCharacter, getCharacterSummary } from './character';
export type { CreateCharacterParams } from './character';

export { selectScenario } from './scenario-trigger';
export type { ScenarioFilter } from './scenario-trigger';

export { calculateConsequence, checkCriticalStats } from './consequence';
export type { DecisionResult } from './consequence';

export {
  advanceAge,
  getScenarioAgeAdvance,
  shouldTriggerStageEvent,
} from './progression';
export type { AgeProgressionParams, AgeProgressionResult } from './progression';
