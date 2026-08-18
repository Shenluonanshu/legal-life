/**
 * 场景触发算法（内联移植自 packages/game-engine/src/scenario-trigger.ts）
 *
 * 因 mobile 侧 Metro 无法可靠解析 workspace 包，沿用 lib/shared.ts 的内联模式。
 * 加权选择替代纯随机：难度匹配 + 类别多样性降权。
 */
import type { Scenario } from './shared';

export interface ScenarioFilter {
  countryId: string;
  lifeStageId?: string | null;
  regionId?: string | null;
  age: number;
  completedScenarioIds: string[];
  categoryCooldown?: number; // 同类别冷却数（最近已完成场景数）
}

/** 从场景池中按权重选择下一个场景（已做年龄过滤 + 排除已完成） */
export function selectScenario(
  scenarios: Scenario[],
  filter: ScenarioFilter
): Scenario | null {
  // 1. 过滤：已发布 + 国家 + 人生阶段 + 地区 + 年龄
  const eligible = scenarios.filter((s) => {
    if (!s.isPublished) return false;
    if (s.countryId !== filter.countryId) return false;
    if (filter.lifeStageId && s.lifeStageId !== filter.lifeStageId) return false;
    if (filter.regionId && s.regionId && s.regionId !== filter.regionId) return false;
    if (s.minAge != null && filter.age < s.minAge) return false;
    if (s.maxAge != null && filter.age > s.maxAge) return false;
    return true;
  });

  // 2. 排除已完成的
  const unplayed = eligible.filter(
    (s) => !filter.completedScenarioIds.includes(s.id)
  );

  if (unplayed.length === 0) return null;

  // 3. 计算权重
  const weighted = unplayed.map((s) => {
    let weight = 1.0;

    // 难度匹配：越接近中等难度（3），权重越高
    const difficultyBonus = 1 - Math.abs(s.difficulty - 3) * 0.15;
    weight *= difficultyBonus;

    // 类别多样性惩罚：最近完成过同类场景则降权
    if (filter.categoryCooldown) {
      const recentSameCategory = filter.completedScenarioIds
        .slice(-filter.categoryCooldown)
        .filter((id) => {
          const completed = scenarios.find((cs) => cs.id === id);
          return completed?.categoryId === s.categoryId;
        }).length;
      weight *= Math.pow(0.5, recentSameCategory);
    }

    return { scenarioId: s.id, weight };
  });

  // 4. 加权随机选择
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight <= 0) return null;

  let random = Math.random() * totalWeight;
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) {
      return scenarios.find((s) => s.id === w.scenarioId) ?? null;
    }
  }

  // 兜底：返回最后一个
  const lastId = weighted[weighted.length - 1]?.scenarioId;
  return scenarios.find((s) => s.id === lastId) ?? null;
}
