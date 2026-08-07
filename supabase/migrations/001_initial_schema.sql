-- ============================================================
-- 律途人生 — 数据库初始迁移
-- 包含：用户档案、国家/地区、法律分类、法条、人生阶段、
--       游戏场景、选项、场景-法条关联、存档、游玩记录、
--       法律收集、图片缓存、成就系统
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======== 用户档案 ========
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ======== 国家 ========
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(2) UNIQUE NOT NULL,
  name JSONB NOT NULL,              -- { "zh": "中国", "en": "China" }
  legal_system TEXT,                -- civil_law | common_law | mixed
  currency TEXT,
  default_language TEXT DEFAULT 'zh',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries are publicly readable"
  ON countries FOR SELECT USING (true);

-- ======== 地区/州/省 ========
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  type TEXT DEFAULT 'province',
  has_special_laws BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regions are publicly readable"
  ON regions FOR SELECT USING (true);

-- ======== 法律分类 ========
CREATE TABLE law_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  icon TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE law_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Law categories are publicly readable"
  ON law_categories FOR SELECT USING (true);

-- ======== 法律条款（核心表） ========
CREATE TABLE laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id),
  category_id UUID REFERENCES law_categories(id),
  title JSONB NOT NULL,              -- 法条标题（多语言）
  law_name JSONB NOT NULL,           -- 所属法律名称
  article_ref TEXT NOT NULL,         -- "第39条" / "Article 39"
  full_text JSONB NOT NULL,          -- 法条原文（多语言）
  plain_summary JSONB NOT NULL,      -- 通俗解读（多语言，300字内）
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  effective_date DATE,
  source_url TEXT,
  source_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laws_country ON laws(country_id);
CREATE INDEX idx_laws_category ON laws(category_id);
CREATE INDEX idx_laws_keywords ON laws USING GIN(keywords);

ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Laws are publicly readable"
  ON laws FOR SELECT USING (true);

-- ======== 人生阶段 ========
CREATE TABLE life_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  age_range INT4RANGE NOT NULL,       -- [18, 35)
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE life_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Life stages are publicly readable"
  ON life_stages FOR SELECT USING (true);

-- ======== 游戏场景 ========
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title JSONB NOT NULL,
  narrative JSONB NOT NULL,          -- 场景叙述（沉浸式故事）
  life_stage_id UUID REFERENCES life_stages(id),
  category_id UUID REFERENCES law_categories(id),
  country_id UUID REFERENCES countries(id),
  region_id UUID REFERENCES regions(id),
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  min_age INT,
  max_age INT,
  trigger_tags TEXT[] DEFAULT '{}',
  image_prompt TEXT,
  cached_image_url TEXT,
  image_status TEXT DEFAULT 'pending',
  is_published BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenarios_country ON scenarios(country_id);
CREATE INDEX idx_scenarios_life_stage ON scenarios(life_stage_id);
CREATE INDEX idx_scenarios_trigger ON scenarios(country_id, life_stage_id, min_age, max_age);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenarios are publicly readable"
  ON scenarios FOR SELECT USING (is_published = true);

-- ======== 场景选项 ========
CREATE TABLE scenario_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  choice_text JSONB NOT NULL,
  consequence_text JSONB NOT NULL,
  stats_effect JSONB NOT NULL,
  legal_outcome JSONB,
  is_legally_correct BOOLEAN DEFAULT FALSE,
  is_best_ending BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_choices_scenario ON scenario_choices(scenario_id, sort_order);

ALTER TABLE scenario_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenario choices are publicly readable"
  ON scenario_choices FOR SELECT USING (true);

-- ======== 场景-法条关联 ========
CREATE TABLE scenario_laws (
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  law_id UUID REFERENCES laws(id) ON DELETE CASCADE,
  relevance TEXT DEFAULT 'direct',
  PRIMARY KEY (scenario_id, law_id)
);

ALTER TABLE scenario_laws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenario-law links are publicly readable"
  ON scenario_laws FOR SELECT USING (true);

-- ======== 游戏存档 ========
CREATE TABLE game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  gender TEXT DEFAULT 'unspecified',
  country_id UUID REFERENCES countries(id),
  region_id UUID REFERENCES regions(id),
  age INT DEFAULT 18,
  life_stage_id UUID REFERENCES life_stages(id),
  stats JSONB DEFAULT '{"health":80,"wealth":50,"knowledge":30,"happiness":70,"legal_awareness":10}',
  completed_scenarios TEXT[] DEFAULT '{}',
  current_storyline TEXT,
  achievements JSONB DEFAULT '[]',
  total_played_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_saves_user ON game_saves(user_id, is_active);

ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saves"
  ON game_saves FOR ALL USING (auth.uid() = user_id);

-- ======== 游玩记录 ========
CREATE TABLE play_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_id UUID REFERENCES game_saves(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id),
  chosen_choice_id UUID REFERENCES scenario_choices(id),
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_history_save ON play_history(save_id);

ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own play history"
  ON play_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM game_saves WHERE id = play_history.save_id AND user_id = auth.uid()
  ));

-- ======== 法律收集 ========
CREATE TABLE law_collections (
  save_id UUID REFERENCES game_saves(id) ON DELETE CASCADE,
  law_id UUID REFERENCES laws(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  read_count INT DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (save_id, law_id)
);

ALTER TABLE law_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own law collections"
  ON law_collections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM game_saves WHERE id = law_collections.save_id AND user_id = auth.uid()
  ));

-- ======== AI 图片缓存 ========
CREATE TABLE image_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id),
  prompt_hash TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  model_used TEXT,
  generation_params JSONB,
  generation_cost DECIMAL(10,6) DEFAULT 0,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_image_cache_hash ON image_cache(prompt_hash);

ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Image cache is publicly readable"
  ON image_cache FOR SELECT USING (true);

-- ======== 成就定义 ========
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title JSONB NOT NULL,
  description JSONB NOT NULL,
  icon TEXT,
  condition_type TEXT NOT NULL,
  condition_params JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are publicly readable"
  ON achievements FOR SELECT USING (true);

-- ======== 用户成就 ========
CREATE TABLE user_achievements (
  save_id UUID REFERENCES game_saves(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (save_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements"
  ON user_achievements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM game_saves WHERE id = user_achievements.save_id AND user_id = auth.uid()
  ));
