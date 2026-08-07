// ============================================================
// 游戏引擎 — 决策后果计算
// ============================================================
import type { CharacterStats, StatsEffect } from '@legal-life/shared';
import { applyStatsEffect } from '@legal-life/shared';

/** 决策结果 */
export interface DecisionResult {
  statsBefore: CharacterStats;
  statsAfter: CharacterStats;
  appliedEffect: StatsEffect;
  revealedLawIds: string[];
  narrativeText: string;
  isLegalCorrect: boolean;
}

/** 计算决策后果 */
export function calculateConsequence(
  currentStats: CharacterStats,
  effect: StatsEffect,
  revealedLawIds: string[],
  narrativeText: string,
  isLegalCorrect: boolean
): DecisionResult {
  const statsAfter = applyStatsEffect(currentStats, effect);

  return {
    statsBefore: { ...currentStats },
    statsAfter,
    appliedEffect: { ...effect },
    revealedLawIds,
    narrativeText,
    isLegalCorrect,
  };
}

/** 检查属性是否触发临界事件 */
export function checkCriticalStats(
  stats: CharacterStats
): string[] {
  const warnings: string[] = [];

  if (stats.health <= 10) {
    warnings.push('health_critical');
  }
  if (stats.wealth <= 5) {
    warnings.push('bankruptcy_risk');
  }
  if (stats.happiness <= 10) {
    warnings.push('depression_risk');
  }
  if (stats.legalAwareness >= 90) {
    warnings.push('legal_expert');
  }

  return warnings;
}
