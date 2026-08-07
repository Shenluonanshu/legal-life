// ============================================================
// 律途人生 — 场景/事件类型定义
// ============================================================

import type { Scenario, ScenarioChoice } from './game';

/** 场景关联法条 */
export interface ScenarioLawLink {
  scenarioId: string;
  lawId: string;
  relevance: 'direct' | 'related' | 'reference';
}

/** 完整场景数据（含选项和关联法条） */
export interface ScenarioFull extends Scenario {
  choices: ScenarioChoice[];
  linkedLaws: ScenarioLawLink[];
}

/** 场景触发条件 */
export interface ScenarioTrigger {
  lifeStageId: string;
  countryId: string;
  regionId?: string;
  minAge?: number;
  maxAge?: number;
  tags: string[];
  excludeCompleted: boolean;
}

/** 决策历史 */
export interface DecisionRecord {
  saveId: string;
  scenarioId: string;
  chosenChoiceId: string;
  statsBefore: Record<string, number>;
  statsAfter: Record<string, number>;
  playedAt: string;
}

/** 场景权重（用于加权随机选择） */
export interface ScenarioWeight {
  scenarioId: string;
  weight: number;
  reason: string;
}
