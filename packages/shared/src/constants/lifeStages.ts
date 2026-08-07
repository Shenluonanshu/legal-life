import type { LifeStage } from '../types/game';

/** 人生阶段定义 */
export const LIFE_STAGES: Omit<LifeStage, 'id' | 'unlockedCategoryIds'>[] = [
  {
    name: { zh: '童年', en: 'Childhood' },
    ageRange: [6, 12],
    icon: '👶',
    sortOrder: 1,
  },
  {
    name: { zh: '少年', en: 'Teenager' },
    ageRange: [13, 17],
    icon: '🧒',
    sortOrder: 2,
  },
  {
    name: { zh: '青年', en: 'Young Adult' },
    ageRange: [18, 25],
    icon: '🧑',
    sortOrder: 3,
  },
  {
    name: { zh: '壮年', en: 'Adult' },
    ageRange: [26, 40],
    icon: '👨',
    sortOrder: 4,
  },
  {
    name: { zh: '中年', en: 'Middle Age' },
    ageRange: [41, 60],
    icon: '🧔',
    sortOrder: 5,
  },
  {
    name: { zh: '老年', en: 'Senior' },
    ageRange: [61, 99],
    icon: '👴',
    sortOrder: 6,
  },
];

/** 根据年龄获取人生阶段索引 */
export function getLifeStageIndexByAge(age: number): number {
  for (let i = LIFE_STAGES.length - 1; i >= 0; i--) {
    const stage = LIFE_STAGES[i]!;
    if (age >= stage.ageRange[0] && age < stage.ageRange[1]) {
      return i;
    }
  }
  return LIFE_STAGES.length - 1; // 默认返回最后一个阶段
}
