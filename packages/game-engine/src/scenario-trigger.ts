// ============================================================
// 游戏引擎 — 场景触发算法
// ============================================================
import type { Scenario, ScenarioWeight } from '@legal-life/shared';

/** 场景池过滤器参数 */
export interface ScenarioFilter {
  countryId: string;
  lifeStageId: string;
  regionId?: string | null;
  age: number;
  completedScenarioIds: string[];
  categoryCooldown?: number; // 同类别冷却数（已完成场景数）
}

/** 从场景池中选择下一个场景 */
export function selectScenario(
  scenarios: Scenario[],
  filter: ScenarioFilter
): Scenario | null {
  // 1. 过滤：按国家、人生阶段、年龄
  const eligible = scenarios.filter((s) => {
    if (!s.isPublished) return false;
    if (s.countryId !== filter.countryId) return false;
    if (s.lifeStageId !== filter.lifeStageId) return false;
    if (filter.regionId && s.regionId && s.regionId !== filter.regionId) return false;
    if (s.minAge && filter.age < s.minAge) return false;
    if (s.maxAge && filter.age > s.maxAge) return false;
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

    // 难度匹配：越接近当前可用范围中间，权重越高
    const difficultyBonus = 1 - Math.abs(s.difficulty - 3) * 0.15;
    weight *= difficultyBonus;

    // 类别多样性惩罚：如果最近已完成同类场景，降权
    if (filter.categoryCooldown) {
      const recentSameCategory = filter.completedScenarioIds
        .slice(-filter.categoryCooldown)
        .filter((id) => {
          const completed = scenarios.find((cs) => cs.id === id);
          return completed?.categoryId === s.categoryId;
        }).length;
      weight *= Math.pow(0.5, recentSameCategory);
    }

    return { scenarioId: s.id, weight, reason: `difficulty=${s.difficulty}` };
  });

  // 4. 加权随机选择
  return weightedRandomSelect(scenarios, weighted);
}

/** 加权随机选择 */
function weightedRandomSelect(
  scenarios: Scenario[],
  weighted: ScenarioWeight[]
): Scenario | null {
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
