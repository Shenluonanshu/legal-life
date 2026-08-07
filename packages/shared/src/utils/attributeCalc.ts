import type { CharacterStats, StatsEffect } from '../types/game';

/** 限制属性值在 0-100 范围内 */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** 应用属性变化，返回新的属性对象 */
export function applyStatsEffect(
  stats: CharacterStats,
  effect: StatsEffect
): CharacterStats {
  const result = { ...stats };
  for (const key of Object.keys(effect) as (keyof StatsEffect)[]) {
    const delta = effect[key];
    if (delta !== undefined) {
      result[key] = clamp(result[key] + delta);
    }
  }
  return result;
}

/** 检查属性是否满足条件 */
export function meetsStatRequirements(
  stats: CharacterStats,
  requirements: Partial<Record<keyof CharacterStats, { min?: number; max?: number }>>
): boolean {
  for (const [key, range] of Object.entries(requirements)) {
    const statKey = key as keyof CharacterStats;
    const value = stats[statKey];
    if (range?.min !== undefined && value < range.min) return false;
    if (range?.max !== undefined && value > range.max) return false;
  }
  return true;
}

/** 随机生成初始属性 */
export function generateRandomStats(totalPoints = 300): CharacterStats {
  // 使用狄利克雷分布生成随机比例
  const raw: number[] = Array.from({ length: 5 }, () => Math.random() * 100 + 20);
  const sum = raw.reduce((a, b) => a + b, 0);
  const normalized = raw.map((v) => Math.round((v / sum) * totalPoints));

  return {
    health: clamp(normalized[0]!),
    wealth: clamp(normalized[1]!),
    knowledge: clamp(normalized[2]!),
    happiness: clamp(normalized[3]!),
    legalAwareness: clamp(normalized[4]!),
  };
}

/** 统计名称中文映射 */
export const STAT_NAMES: Record<keyof CharacterStats, { zh: string; en: string; icon: string }> = {
  health: { zh: '健康', en: 'Health', icon: '🏥' },
  wealth: { zh: '财富', en: 'Wealth', icon: '💰' },
  knowledge: { zh: '知识', en: 'Knowledge', icon: '📚' },
  happiness: { zh: '幸福', en: 'Happiness', icon: '😊' },
  legalAwareness: { zh: '法律意识', en: 'Legal Awareness', icon: '⚖️' },
};
