/**
 * 律途人生 — 法律数据导入 Supabase（真实实现）
 *
 * 读取 legal-data/cn/national/*.yaml 与 legal-data/scenes/*.json，
 * 写入 Supabase 的 laws / scenarios / scenario_choices / scenario_laws 表。
 *
 * 用法:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=xxx \
 *   node legal-data/scripts/import-to-supabase.mjs [--dry-run]
 *
 * --dry-run  只解析并打印将要导入的数据，不实际写入（不需要 service key）。
 *
 * 注意: service_role key 是敏感密钥，仅用于本机导入，切勿提交进 git。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const YAML_DIR = path.join(ROOT, 'legal-data/cn/national');
const SCENES_DIR = path.join(ROOT, 'legal-data/scenes');

const DRY_RUN = process.argv.includes('--dry-run');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ---------- 映射表 ----------

// yaml category slug → 法条 code 缩写
const CATEGORY_ABBREV = {
  employment: 'LABOR',
  consumer_rights: 'CONSUMER',
  traffic: 'TRAFFIC',
  criminal: 'CRIM',
  civil: 'CIVIL',
  education: 'EDU',
  cyber_security: 'CYBER',
};

// yaml category slug → seed.sql 里 law_categories.name.zh
// 注: civil(民法典) 主体为婚姻家庭条款，本轮近似归入「婚姻家庭」，
//     精确的「民法与合同」分类留待内容扩充轮补充。
const CATEGORY_ZH = {
  employment: '劳动就业',
  consumer_rights: '消费者权益',
  traffic: '交通法规',
  criminal: '刑法与公共安全',
  civil: '婚姻家庭',
  education: '教育法律',
  cyber_security: '网络安全与隐私',
};

// 场景 life_stage slug → seed.sql 里 life_stages.name.zh
const LIFE_STAGE_ZH = {
  childhood: '童年',
  teen: '少年',
  young_adult: '青年',
  adult: '壮年',
  middle_age: '中年',
  senior: '老年',
};

// 场景 json 里的旧编号 → 新 code（错位修正）。悬空项不在此表，导入时跳过并警告。
const REVEAL_MAP = {
  'CN-LABOR-001': 'CN-LABOR-001',
  'CN-LABOR-002': 'CN-LABOR-002',
  'CN-LABOR-003': 'CN-LABOR-003',
  'CN-CONSUMER-001': 'CN-CONSUMER-001',
  'CN-CIVIL-002': 'CN-CIVIL-003', // 错位修正：婚前买房→共同财产(第1062条)
  'CN-CRIM-005': 'CN-CRIM-005',
  'CN-EDU-001': 'CN-EDU-001',
  'CN-EDU-003': 'CN-EDU-003',
  'CN-TRAFFIC-001': 'CN-TRAFFIC-001',
};

// 悬空引用（场景引用了，但 yaml 未收录对应法条）——本轮跳过，留待内容扩充
const MISSING_REFS = new Set([
  'CN-LABOR-005', // 加班时间限制（《劳动法》第41条）
  'CN-CONSUMER-004', // 预付卡消费（消保法第53条/预付卡办法）
  'CN-CIVIL-003', // 婚前个人财产（民法典第1063条）
  'CN-CIVIL-004', // 租赁押金（民法典租赁合同章节）
]);

// ---------- REST 封装 ----------

async function rest(method, table, { query = '', body, prefer } = {}) {
  if (DRY_RUN) return null;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY 环境变量');
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table} 失败 (${res.status}): ${text.slice(0, 500)}`);
  }
  const data = await res.json().catch(() => null);
  return data;
}

// 删除一张表的所有行（幂等重导入用）
async function deleteAll(table) {
  return rest('DELETE', table, { query: '?id=not.is.null' });
}

// ---------- 数据解析 ----------

function parseLawYaml(file) {
  const raw = yamlLoad(fs.readFileSync(file, 'utf-8'));
  return raw; // { law_name, law_name_en, category, country_code, effective_date, source_url, source_name, articles[] }
}

function parseSceneJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// ---------- 主流程 ----------

async function main() {
  console.log('📦 律途人生 — 法律数据导入\n');
  if (DRY_RUN) console.log('🧪 DRY-RUN 模式：只解析打印，不写库\n');

  // 1. 解析法条 yaml
  const yamlFiles = fs.readdirSync(YAML_DIR).filter((f) => f.endsWith('.yaml'));
  const lawRows = [];
  for (const file of yamlFiles) {
    const law = parseLawYaml(path.join(YAML_DIR, file));
    const abbrev = CATEGORY_ABBREV[law.category];
    if (!abbrev) {
      console.warn(`  ⚠️  未知 category: ${law.category} (${file})，跳过`);
      continue;
    }
    law.articles.forEach((article, i) => {
      const code = `${law.country_code}-${abbrev}-${String(i + 1).padStart(3, '0')}`;
      lawRows.push({
        code,
        category: law.category,
        law_name: law.law_name,
        law_name_en: law.law_name_en || law.law_name,
        article_ref: article.ref,
        title: article.title || article.ref,
        full_text: article.full_text || '',
        summary: article.summary || '',
        keywords: article.keywords || [],
        tags: article.tags || [],
        effective_date: law.effective_date || null,
        source_url: law.source_url || null,
        source_name: law.source_name || null,
      });
    });
  }
  console.log(`✅ 解析法条: ${lawRows.length} 条`);

  // 2. 解析场景 json
  const sceneFiles = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');
  const sceneRows = [];
  for (const file of sceneFiles) {
    const data = parseSceneJson(path.join(SCENES_DIR, file));
    for (const scene of data.scenes) {
      sceneRows.push({
        key: scene.key,
        category: data.category,
        title_zh: scene.title.zh,
        title_en: scene.title.en,
        narrative_zh: scene.narrative.zh,
        narrative_en: scene.narrative.en,
        life_stage: scene.life_stage,
        min_age: scene.min_age,
        max_age: scene.max_age,
        difficulty: scene.difficulty,
        image_prompt: scene.image_prompt || null,
        choices: scene.choices.map((c, idx) => ({
          id: c.id,
          text_zh: c.text.zh,
          text_en: c.text.en,
          consequence_zh: c.consequence.zh,
          consequence_en: c.consequence.en,
          stats_effect: c.stats_effect,
          is_legally_correct: c.is_legally_correct,
          sort_order: idx,
          laws_revealed: c.laws_revealed || [],
        })),
      });
    }
  }
  const choiceCount = sceneRows.reduce((n, s) => n + s.choices.length, 0);
  console.log(`✅ 解析场景: ${sceneRows.length} 个，选项 ${choiceCount} 个`);

  // 3. DRY-RUN：打印预览后退出
  if (DRY_RUN) {
    console.log('\n--- 法条预览（前 5 条）---');
    for (const l of lawRows.slice(0, 5)) {
      console.log(`  ${l.code} | ${l.law_name} ${l.article_ref} | ${l.title}`);
    }
    console.log('\n--- 场景预览 ---');
    for (const s of sceneRows) {
      console.log(`  ${s.key} | ${s.category} | ${s.title_zh} | ${s.choices.length} 选项`);
    }
    console.log('\n--- 悬空引用检查 ---');
    const used = new Set();
    for (const s of sceneRows) {
      for (const c of s.choices) {
        for (const ref of c.laws_revealed) {
          used.add(ref);
          if (MISSING_REFS.has(ref)) console.warn(`  ⚠️  悬空引用（跳过）: ${ref} (场景 ${s.key})`);
          else if (!REVEAL_MAP[ref]) console.warn(`  ⚠️  未映射引用: ${ref} (场景 ${s.key})`);
        }
      }
    }
    console.log(`\n共 ${used.size} 个不同引用编号，其中悬空 ${[...used].filter((r) => MISSING_REFS.has(r)).length} 个`);
    return;
  }

  // 4. 查询基础表拿 UUID
  const countries = await rest('GET', 'countries', { query: '?select=id,code' });
  const cnId = countries?.find((c) => c.code === 'CN')?.id;
  if (!cnId) throw new Error('找不到 CN 国家记录，请先运行 seed.sql');

  const categories = await rest('GET', 'law_categories', { query: '?select=id,name' });
  const catIdByName = {};
  for (const c of categories || []) {
    catIdByName[c.name?.zh] = c.id;
  }

  const lifeStages = await rest('GET', 'life_stages', { query: '?select=id,name' });
  const stageIdByName = {};
  for (const s of lifeStages || []) {
    stageIdByName[s.name?.zh] = s.id;
  }

  // 5. 清空旧数据（幂等）：先删 scenarios（级联删 choices/laws link），再删 laws
  console.log('\n🧹 清空旧数据...');
  await deleteAll('scenarios');
  await deleteAll('laws');

  // 6. 写入 laws
  console.log('📥 写入法条...');
  const lawPayload = lawRows.map((l) => ({
    code: l.code,
    country_id: cnId,
    category_id: catIdByName[CATEGORY_ZH[l.category]],
    title: { zh: l.title, en: l.title },
    law_name: { zh: l.law_name, en: l.law_name_en },
    article_ref: l.article_ref,
    full_text: { zh: l.full_text, en: l.full_text },
    plain_summary: { zh: l.summary, en: l.summary },
    keywords: l.keywords,
    tags: l.tags,
    effective_date: l.effective_date,
    source_url: l.source_url,
    source_name: l.source_name,
    is_verified: false,
  }));
  const insertedLaws = await rest('POST', 'laws', {
    body: lawPayload,
    prefer: 'return=representation',
  });
  const lawIdByCode = {};
  for (const l of insertedLaws || []) lawIdByCode[l.code] = l.id;
  console.log(`  已写入 ${Object.keys(lawIdByCode).length} 条`);

  // 7. 写入 scenarios + choices + scenario_laws
  console.log('📥 写入场景...');
  let lawLinkCount = 0;
  const skippedRefs = new Set();
  let sceneInserted = 0;
  let choiceInserted = 0;

  for (const s of sceneRows) {
    const categoryId = catIdByName[CATEGORY_ZH[s.category]];
    const lifeStageId = stageIdByName[LIFE_STAGE_ZH[s.life_stage]];
    if (!categoryId) { console.warn(`  ⚠️  场景 ${s.key} 无匹配分类，跳过`); continue; }
    if (!lifeStageId) { console.warn(`  ⚠️  场景 ${s.key} 无匹配人生阶段 ${s.life_stage}，跳过`); continue; }

    const [scenario] = (await rest('POST', 'scenarios', {
      body: [{
        title: { zh: s.title_zh, en: s.title_en },
        narrative: { zh: s.narrative_zh, en: s.narrative_en },
        life_stage_id: lifeStageId,
        category_id: categoryId,
        country_id: cnId,
        region_id: null,
        difficulty: s.difficulty,
        min_age: s.min_age,
        max_age: s.max_age,
        trigger_tags: [],
        image_prompt: s.image_prompt,
        image_status: 'pending',
        is_published: true,
        version: 1,
      }],
      prefer: 'return=representation',
    })) || [];
    if (!scenario?.id) { console.warn(`  ⚠️  场景 ${s.key} 写入失败`); continue; }
    sceneInserted++;

    // 写入选项
    const choicePayload = s.choices.map((c) => ({
      scenario_id: scenario.id,
      choice_text: { zh: c.text_zh, en: c.text_en },
      consequence_text: { zh: c.consequence_zh, en: c.consequence_en },
      stats_effect: c.stats_effect,
      legal_outcome: null,
      is_legally_correct: c.is_legally_correct,
      is_best_ending: c.is_legally_correct,
      sort_order: c.sort_order,
    }));
    const insertedChoices = await rest('POST', 'scenario_choices', {
      body: choicePayload,
      prefer: 'return=representation',
    });
    choiceInserted += (insertedChoices || []).length;

    // 写入场景-法条关联（去重：同一场景多选项可能引用同一法条）
    const linkPayload = [];
    const linkSeen = new Set();
    for (const c of s.choices) {
      for (const ref of c.laws_revealed) {
        if (MISSING_REFS.has(ref)) { skippedRefs.add(ref); continue; }
        const code = REVEAL_MAP[ref];
        if (!code) { skippedRefs.add(ref); continue; }
        const lawId = lawIdByCode[code];
        if (!lawId) { skippedRefs.add(`${ref}->${code}(law缺失)`); continue; }
        const dedupKey = `${scenario.id}:${lawId}`;
        if (linkSeen.has(dedupKey)) continue;
        linkSeen.add(dedupKey);
        linkPayload.push({ scenario_id: scenario.id, law_id: lawId, relevance: 'direct' });
      }
    }
    if (linkPayload.length) {
      await rest('POST', 'scenario_laws', { body: linkPayload });
      lawLinkCount += linkPayload.length;
    }
  }

  // 8. 汇总
  console.log('\n========== 导入完成 ==========');
  console.log(`  法条: ${Object.keys(lawIdByCode).length} 条`);
  console.log(`  场景: ${sceneInserted} 个`);
  console.log(`  选项: ${choiceInserted} 个`);
  console.log(`  场景-法条关联: ${lawLinkCount} 条`);
  if (skippedRefs.size) {
    console.log('\n  ⚠️  跳过以下悬空/未映射引用（留待内容扩充）:');
    for (const r of skippedRefs) console.log(`    - ${r}`);
  } else {
    console.log('\n  ✅ 无悬空引用');
  }
}

main().catch((err) => {
  console.error('\n❌ 导入失败:', err.message);
  process.exit(1);
});
