-- ============================================================
-- 律途人生 — 数据库函数、触发器和全文搜索
-- ============================================================

-- ---------- 启用 pg_trgm 扩展（中文全文搜索索引用） ----------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- 增加法条查看次数 ----------
CREATE OR REPLACE FUNCTION increment_law_view_count(law_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE laws
  SET view_count = view_count + 1
  WHERE id = law_id;
END;
$$;

-- ---------- 自动更新 updated_at ----------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 为所有需要自动更新时间的表创建触发器
CREATE TRIGGER set_updated_at_laws
  BEFORE UPDATE ON laws
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_scenarios
  BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_game_saves
  BEFORE UPDATE ON game_saves
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------- 全文搜索配置（中文） ----------
-- 使用 pg_bigm 或 simple 分词进行中文搜索
-- 注意：生产环境建议安装 zhparser 扩展或使用外部搜索引擎

-- 为关键词字段创建 GIN 索引以支持 LIKE/ILIKE 查询加速
CREATE INDEX IF NOT EXISTS idx_laws_title_search ON laws USING GIN ((title->>'zh') gin_trgm_ops);

-- ---------- 场景权重计算函数 ----------
CREATE OR REPLACE FUNCTION calculate_scenario_weight(
  p_difficulty INT,
  p_player_age INT,
  p_min_age INT DEFAULT NULL,
  p_max_age INT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_recent_category_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS REAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  weight REAL := 1.0;
BEGIN
  -- 难度匹配：中等难度权重最高
  weight := weight * (1.0 - ABS(p_difficulty - 3) * 0.15);

  -- 年龄匹配：越接近年龄范围中间，权重越高
  IF p_min_age IS NOT NULL AND p_max_age IS NOT NULL THEN
    IF p_player_age >= p_min_age AND p_player_age <= p_max_age THEN
      weight := weight * 1.1;
    ELSE
      weight := weight * 0.5;
    END IF;
  END IF;

  -- 类别多样性：最近完成过的类别降权
  IF p_category_id IS NOT NULL AND p_recent_category_ids IS NOT NULL THEN
    IF p_category_id = ANY(p_recent_category_ids) THEN
      weight := weight * 0.5;
    END IF;
  END IF;

  RETURN GREATEST(weight, 0.1);
END;
$$;

-- ---------- 成就检查函数（示例） ----------
CREATE OR REPLACE FUNCTION check_law_collection_achievement(
  p_save_id UUID,
  p_total_collected INT
)
RETURNS TABLE(achievement_id UUID, achievement_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否达到 10 条：解锁 "法律学徒" 成就
  IF p_total_collected >= 10 THEN
    RETURN QUERY
      SELECT a.id, a.code
      FROM achievements a
      WHERE a.code = 'collect_10'
        AND NOT EXISTS (
          SELECT 1 FROM user_achievements ua
          WHERE ua.save_id = p_save_id AND ua.achievement_id = a.id
        );
  END IF;

  -- 检查是否达到 50 条：解锁 "法学生" 成就
  IF p_total_collected >= 50 THEN
    RETURN QUERY
      SELECT a.id, a.code
      FROM achievements a
      WHERE a.code = 'collect_50'
        AND NOT EXISTS (
          SELECT 1 FROM user_achievements ua
          WHERE ua.save_id = p_save_id AND ua.achievement_id = a.id
        );
  END IF;
END;
$$;
