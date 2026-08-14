-- ============================================================
-- 律途人生 — 给 laws 表新增稳定法条编号 code
-- code 格式: CN-{分类缩写}-{三位序号}  例: CN-LABOR-001
-- 用于场景 JSON 的 laws_revealed 引用与 scenario_laws 关联
-- ============================================================

ALTER TABLE laws ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
