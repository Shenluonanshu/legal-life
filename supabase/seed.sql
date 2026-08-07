-- ============================================================
-- 律途人生 — 种子数据
-- ============================================================

-- ======== 国家 ========
INSERT INTO countries (code, name, legal_system, currency, default_language, is_active) VALUES
  ('CN', '{"zh":"中国","en":"China"}', 'civil_law', 'CNY', 'zh', true),
  ('US', '{"zh":"美国","en":"United States"}', 'common_law', 'USD', 'en', false),
  ('JP', '{"zh":"日本","en":"Japan"}', 'civil_law', 'JPY', 'ja', false),
  ('KR', '{"zh":"韩国","en":"South Korea"}', 'civil_law', 'KRW', 'ko', false),
  ('DE', '{"zh":"德国","en":"Germany"}', 'civil_law', 'EUR', 'de', false),
  ('FR', '{"zh":"法国","en":"France"}', 'civil_law', 'EUR', 'fr', false);

-- ======== 中国地区 ========
WITH cn AS (SELECT id FROM countries WHERE code = 'CN')
INSERT INTO regions (country_id, name, type, has_special_laws) VALUES
  ((SELECT id FROM cn), '{"zh":"全国通用","en":"National"}', 'national', false),
  ((SELECT id FROM cn), '{"zh":"广东省","en":"Guangdong"}', 'province', true),
  ((SELECT id FROM cn), '{"zh":"北京市","en":"Beijing"}', 'municipality', true),
  ((SELECT id FROM cn), '{"zh":"上海市","en":"Shanghai"}', 'municipality', true);

-- ======== 法律分类 ========
INSERT INTO law_categories (name, icon, color, sort_order) VALUES
  ('{"zh":"宪法与基本权利","en":"Constitution & Rights"}', 'scroll', '#8B0000', 1),
  ('{"zh":"刑法与公共安全","en":"Criminal & Public Safety"}', 'gavel', '#DC2626', 2),
  ('{"zh":"劳动就业","en":"Employment & Labor"}', 'briefcase', '#D97706', 3),
  ('{"zh":"交通法规","en":"Traffic Law"}', 'car', '#059669', 4),
  ('{"zh":"消费者权益","en":"Consumer Rights"}', 'shopping-cart', '#7C3AED', 5),
  ('{"zh":"婚姻家庭","en":"Marriage & Family"}', 'heart', '#DB2777', 6),
  ('{"zh":"网络安全与隐私","en":"Cybersecurity & Privacy"}', 'shield', '#0891B2', 7),
  ('{"zh":"教育法律","en":"Education Law"}', 'book-open', '#4F46E5', 8);

-- ======== 人生阶段 ========
INSERT INTO life_stages (name, age_range, icon, sort_order) VALUES
  ('{"zh":"童年","en":"Childhood"}', '[6,12)', '👶', 1),
  ('{"zh":"少年","en":"Teenager"}', '[13,17)', '🧒', 2),
  ('{"zh":"青年","en":"Young Adult"}', '[18,25)', '🧑', 3),
  ('{"zh":"壮年","en":"Adult"}', '[26,40)', '👨', 4),
  ('{"zh":"中年","en":"Middle Age"}', '[41,60)', '🧔', 5),
  ('{"zh":"老年","en":"Senior"}', '[61,99)', '👴', 6);

-- ======== 初始成就 ========
INSERT INTO achievements (code, title, description, icon, condition_type, condition_params, category) VALUES
  ('first_law', '{"zh":"法律启蒙","en":"Legal Novice"}', '{"zh":"收集第一条法律知识","en":"Collect your first law"}', 'book', 'collect_laws', '{"count":1}', 'collection'),
  ('collect_10', '{"zh":"法律学徒","en":"Law Apprentice"}', '{"zh":"收集10条法律知识","en":"Collect 10 laws"}', 'book-open', 'collect_laws', '{"count":10}', 'collection'),
  ('collect_50', '{"zh":"法学生","en":"Law Student"}', '{"zh":"收集50条法律知识","en":"Collect 50 laws"}', 'graduation-cap', 'collect_laws', '{"count":50}', 'collection'),
  ('first_scenario', '{"zh":"初入社会","en":"First Steps"}', '{"zh":"完成第一个场景","en":"Complete your first scenario"}', 'footprints', 'complete_scenes', '{"count":1}', 'progress'),
  ('complete_10', '{"zh":"阅历丰富","en":"Well Experienced"}', '{"zh":"完成10个场景","en":"Complete 10 scenarios"}', 'compass', 'complete_scenes', '{"count":10}', 'progress'),
  ('lawful_5', '{"zh":"守法公民","en":"Law-Abiding Citizen"}', '{"zh":"连续5次做出合法选择","en":"Make 5 consecutive legal choices"}', 'check-circle', 'legal_streak', '{"count":5}', 'behavior'),
  ('lawful_10', '{"zh":"正义使者","en":"Justice Bringer"}', '{"zh":"连续10次做出合法选择","en":"Make 10 consecutive legal choices"}', 'star', 'legal_streak', '{"count":10}', 'behavior'),
  ('legal_master_cn', '{"zh":"中国通","en":"China Expert"}', '{"zh":"收集全部中国法律知识","en":"Complete Chinese law collection"}', 'flag', 'country_complete', '{"country":"CN"}', 'mastery');
