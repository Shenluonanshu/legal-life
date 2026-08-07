/**
 * 游戏数据 API 服务层
 *
 * 封装所有与 Supabase 的数据交互，
 * 支持在线查询 + 离线缓存降级
 */
import { supabase } from '../supabase';
import type {
  GameSave,
  Scenario,
  ScenarioChoice,
  Country,
  Region,
  Law,
  LawCategory,
  LifeStage,
  Achievement,
} from '../shared';

// ============================================================
// 存档管理
// ============================================================

/** 获取用户所有存档 */
export async function fetchGameSaves(): Promise<GameSave[]> {
  const { data, error } = await supabase
    .from('game_saves')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`加载存档失败: ${error.message}`);
  return data as GameSave[];
}

/** 保存/更新游戏存档 */
export async function saveGame(save: Partial<GameSave>): Promise<GameSave> {
  const { data, error } = await supabase
    .from('game_saves')
    .upsert(save, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`保存失败: ${error.message}`);
  return data as GameSave;
}

/** 删除存档 */
export async function deleteGameSave(saveId: string): Promise<void> {
  const { error } = await supabase
    .from('game_saves')
    .delete()
    .eq('id', saveId);

  if (error) throw new Error(`删除存档失败: ${error.message}`);
}

// ============================================================
// 国家与地区
// ============================================================

/** 获取所有启用的国家 */
export async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('is_active', true)
    .order('code');

  if (error) throw new Error(`加载国家数据失败: ${error.message}`);
  return data as Country[];
}

/** 获取某国家的地区列表 */
export async function fetchRegions(countryId: string): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true);

  if (error) throw new Error(`加载地区数据失败: ${error.message}`);
  return data as Region[];
}

// ============================================================
// 法律数据
// ============================================================

/** 获取法律分类列表 */
export async function fetchLawCategories(): Promise<LawCategory[]> {
  const { data, error } = await supabase
    .from('law_categories')
    .select('*')
    .order('sort_order');

  if (error) throw new Error(`加载法律分类失败: ${error.message}`);
  return data as LawCategory[];
}

/** 获取某国家的法律列表（分页） */
export async function fetchLaws(
  countryId: string,
  options: {
    categoryId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ laws: Law[]; total: number }> {
  const { categoryId, keyword, page = 1, pageSize = 20 } = options;

  let query = supabase
    .from('laws')
    .select('*', { count: 'exact' })
    .eq('country_id', countryId);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (keyword) query = query.textSearch('keywords', keyword);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(`加载法律数据失败: ${error.message}`);
  return { laws: data as Law[], total: count ?? 0 };
}

/** 获取单条法律详情 */
export async function fetchLawDetail(lawId: string): Promise<Law | null> {
  const { data, error } = await supabase
    .from('laws')
    .select('*')
    .eq('id', lawId)
    .single();

  if (error) return null;
  return data as Law;
}

// ============================================================
// 场景数据
// ============================================================

/** 获取人生阶段列表 */
export async function fetchLifeStages(): Promise<LifeStage[]> {
  const { data, error } = await supabase
    .from('life_stages')
    .select('*')
    .order('sort_order');

  if (error) throw new Error(`加载人生阶段失败: ${error.message}`);
  return data as LifeStage[];
}

/** 获取符合条件的场景列表 */
export async function fetchScenarios(params: {
  countryId: string;
  lifeStageId: string;
  excludeCompleted?: string[];
  limit?: number;
}): Promise<Scenario[]> {
  const { countryId, lifeStageId, excludeCompleted = [], limit = 5 } = params;

  let query = supabase
    .from('scenarios')
    .select('*')
    .eq('country_id', countryId)
    .eq('life_stage_id', lifeStageId)
    .eq('is_published', true)
    .limit(limit);

  if (excludeCompleted.length > 0) {
    query = query.not('id', 'in', `(${excludeCompleted.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`加载场景失败: ${error.message}`);
  return data as Scenario[];
}

/** 获取场景完整数据（含选项和关联法条） */
export async function fetchScenarioFull(scenarioId: string): Promise<{
  scenario: Scenario;
  choices: ScenarioChoice[];
  linkedLawIds: string[];
} | null> {
  // 并行获取场景选项和法条关联
  const [choicesResult, lawsResult] = await Promise.all([
    supabase
      .from('scenario_choices')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('sort_order'),
    supabase
      .from('scenario_laws')
      .select('law_id')
      .eq('scenario_id', scenarioId),
  ]);

  const scenarioResult = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (scenarioResult.error || !scenarioResult.data) return null;

  return {
    scenario: scenarioResult.data as Scenario,
    choices: (choicesResult.data ?? []) as ScenarioChoice[],
    linkedLawIds: (lawsResult.data ?? []).map((l: any) => l.law_id as string),
  };
}

// ============================================================
// 成就系统
// ============================================================

/** 获取所有成就定义 */
export async function fetchAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*');

  if (error) throw new Error(`加载成就数据失败: ${error.message}`);
  return data as Achievement[];
}

/** 解锁成就 */
export async function unlockAchievement(
  saveId: string,
  achievementId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_achievements')
    .upsert({ save_id: saveId, achievement_id: achievementId });

  if (error) throw new Error(`解锁成就失败: ${error.message}`);
}

// ============================================================
// 法律收集
// ============================================================

/** 记录法律知识收集 */
export async function collectLaw(
  saveId: string,
  lawId: string
): Promise<void> {
  const { error } = await supabase
    .from('law_collections')
    .upsert(
      { save_id: saveId, law_id: lawId, discovered_at: new Date().toISOString() },
      { onConflict: 'save_id,law_id' }
    );

  if (error) throw new Error(`记录法律收集失败: ${error.message}`);

  // 同时更新法条查看次数
  await supabase.rpc('increment_law_view_count', { law_id: lawId });
}

/** 获取已收集的法律列表 */
export async function fetchCollectedLaws(saveId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('law_collections')
    .select('law_id')
    .eq('save_id', saveId);

  if (error) return [];
  return (data ?? []).map((d: any) => d.law_id as string);
}

// ============================================================
// 游玩记录
// ============================================================

/** 记录场景游玩历史 */
export async function recordPlayHistory(
  saveId: string,
  scenarioId: string,
  chosenChoiceId: string
): Promise<void> {
  const { error } = await supabase
    .from('play_history')
    .insert({
      save_id: saveId,
      scenario_id: scenarioId,
      chosen_choice_id: chosenChoiceId,
    });

  if (error) console.warn(`记录游玩历史失败: ${error.message}`);
}
