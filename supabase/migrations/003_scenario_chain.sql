-- ============================================================
-- 律途人生 — 场景连贯性（分支链）迁移
-- 为场景补稳定标识 key，为选项补分支标签与下集预告/分支引用，
-- 支撑「选择导向不同人生分支」的核心理念。
--
-- 注意：本迁移需在 Supabase SQL Editor 手动执行
-- （REST 导入脚本无法执行 DDL）。
-- ============================================================

-- 场景稳定标识（如 cn-job-001），用于分支链显式引用
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS key TEXT UNIQUE;

-- 选项分支元数据
ALTER TABLE scenario_choices
  ADD COLUMN IF NOT EXISTS branch_tag TEXT,       -- 分支标签（维权达人/随波逐流…）
  ADD COLUMN IF NOT EXISTS next_scene_hint TEXT,  -- 下集预告文案
  ADD COLUMN IF NOT EXISTS next_scene_key TEXT;   -- 指向下一场景的 key（NULL=加权随机）

CREATE INDEX IF NOT EXISTS idx_choices_next_scene ON scenario_choices(next_scene_key);
