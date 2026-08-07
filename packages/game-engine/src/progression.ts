// ============================================================
// 游戏引擎 — 年龄推进与阶段转换
// ============================================================
import { LIFE_STAGES, getLifeStageIndexByAge } from '@legal-life/shared';

/** 年龄推进参数 */
export interface AgeProgressionParams {
  currentAge: number;
  currentLifeStageId: string;
  yearsToAdvance: number;
}

/** 年龄推进结果 */
export interface AgeProgressionResult {
  newAge: number;
  newLifeStageId: string | null;
  stageChanged: boolean;
  oldLifeStageId: string;
}

/** 推进年龄并检测人生阶段转换 */
export function advanceAge(params: AgeProgressionParams): AgeProgressionResult {
  const newAge = params.currentAge + params.yearsToAdvance;
  const oldIndex = getLifeStageIndexByAge(params.currentAge);
  const newIndex = getLifeStageIndexByAge(newAge);

  const stageChanged = oldIndex !== newIndex;
  const newStage = LIFE_STAGES[newIndex];
  const newLifeStageId = stageChanged ? `stage_${newIndex}` : null;

  return {
    newAge,
    newLifeStageId,
    stageChanged,
    oldLifeStageId: params.currentLifeStageId,
  };
}

/** 场景年龄推进量（根据场景重要程度） */
export function getScenarioAgeAdvance(difficulty: number): number {
  // 难度越高，场景越重要，推进的年数越多
  const map: Record<number, number> = {
    1: 0.5,
    2: 1,
    3: 1.5,
    4: 2,
    5: 3,
  };
  return map[difficulty] ?? 1;
}

/** 检测是否需要触发阶段转换事件 */
export function shouldTriggerStageEvent(
  stageChanged: boolean,
  newAge: number
): boolean {
  // 阶段转换时，且年龄在目标阶段的前半段
  if (!stageChanged) return false;

  const stageIndex = getLifeStageIndexByAge(newAge);
  const stage = LIFE_STAGES[stageIndex];
  if (!stage) return false;

  const stageLength = stage.ageRange[1] - stage.ageRange[0];
  const positionInStage = newAge - stage.ageRange[0];

  // 在阶段的前 30% 时触发转换事件
  return positionInStage < stageLength * 0.3;
}
