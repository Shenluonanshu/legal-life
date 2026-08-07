// ============================================================
// 游戏引擎 — 角色系统
// ============================================================
import type { Character, CharacterStats, Gender } from '@legal-life/shared';
import {
  DEFAULT_STATS,
  generateRandomStats,
  clamp,
} from '@legal-life/shared';

/** 创建角色参数 */
export interface CreateCharacterParams {
  name: string;
  gender: Gender;
  age: number;
  countryCode: string;
  regionId: string | null;
  stats?: Partial<CharacterStats>;
  lifeStageId: string;
}

/** 创建新角色 */
export function createCharacter(params: CreateCharacterParams): Character {
  const baseStats = generateRandomStats(300);

  return {
    name: params.name,
    gender: params.gender,
    age: clamp(params.age, 6, 99),
    countryCode: params.countryCode,
    regionId: params.regionId,
    stats: params.stats
      ? { ...DEFAULT_STATS, ...baseStats, ...params.stats }
      : baseStats,
    lifeStageId: params.lifeStageId,
  };
}

/** 获取角色状态摘要 */
export function getCharacterSummary(character: Character): string {
  const { name, age, stats } = character;
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const avg = Math.round(total / 5);
  return `${name}, ${age}岁 — 综合评分: ${avg}/100`;
}
