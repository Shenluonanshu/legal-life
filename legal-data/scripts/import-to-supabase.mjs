/**
 * 律途人生 — 法律数据导入 Supabase（多国支持）
 *
 * 遍历 legal-data/{国家}/ 目录，读取 national/*.yaml 与 scenes/*.json，
 * 写入 Supabase 的 laws / scenarios / scenario_choices / scenario_laws 表。
 *
 * 目录结构:
 *   legal-data/
 *     cn/national/*.yaml  cn/scenes/*.json
 *     us/national/*.yaml  us/scenes/*.json
 *     eu/national/*.yaml  eu/scenes/*.json
 *
 * 用法:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=xxx \
 *   node legal-data/scripts/import-to-supabase.mjs [--dry-run] [--country CN,US]
 *
 * --dry-run  只解析并打印将要导入的数据，不实际写入（不需要 service key）。
 * --country CN,US  只处理指定国家（逗号分隔），默认处理所有国家。
 *
 * 注意: service_role key 是敏感密钥，仅用于本机导入，切勿提交进 git。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DATA_ROOT = path.join(ROOT, 'legal-data');

const DRY_RUN = process.argv.includes('--dry-run');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const COUNTRY_FILTER = (() => {
  const idx = process.argv.indexOf('--country');
  return idx >= 0 ? process.argv[idx + 1].split(',').map((s) => s.trim()) : null;
})();

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

// yaml category slug → law_categories.name.zh
const CATEGORY_ZH = {
  employment: '劳动就业',
  consumer_rights: '消费者权益',
  traffic: '交通法规',
  criminal: '刑法与公共安全',
  civil: '婚姻家庭',
  education: '教育法律',
  cyber_security: '网络安全与隐私',
};

// 场景 life_stage slug → life_stages.name.zh
const LIFE_STAGE_ZH = {
  childhood: '童年',
  teen: '少年',
  young_adult: '青年',
  adult: '壮年',
  middle_age: '中年',
  senior: '老年',
};

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

/** 列出所有国家目录 */
function listCountryDirs() {
  const dirs = fs.readdirSync(DATA_ROOT).filter((d) => {
    if (d === 'scripts') return false;
    const p = path.join(DATA_ROOT, d);
    return fs.statSync(p).isDirectory();
  });
  if (COUNTRY_FILTER) {
    return dirs.filter((d) => COUNTRY_FILTER.includes(d));
  }
  return dirs;
}

function parseLawYaml(file) {
  return yamlLoad(fs.readFileSync(file, 'utf-8'));
}

function parseSceneJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// ---------- 主流程 ----------

async function main() {
  console.log('📦 律途人生 — 法律数据导入（多国）\n');
  if (DRY_RUN) console.log('🧪 DRY-RUN 模式：只解析打印，不写库\n');

  const countryDirs = listCountryDirs();
  console.log(`🌍 处理国家: ${countryDirs.join(', ')}\n`);

  // 1. 解析所有国家的法条与场景
  const lawRows = [];
  const sceneRows = [];
  for (const cc of countryDirs) {
    const nationalDir = path.join(DATA_ROOT, cc, 'national');
    const scenesDir = path.join(DATA_ROOT, cc, 'scenes');

    // 法条
    if (fs.existsSync(nationalDir)) {
      const yamlFiles = fs.readdirSync(nationalDir).filter((f) => f.endsWith('.yaml'));
      for (const file of yamlFiles) {
        const law = parseLawYaml(path.join(nationalDir, file));
        const abbrev = CATEGORY_ABBREV[law.category];
        if (!abbrev) {
          console.warn(`  ⚠️  未知 category: ${law.category} (${cc}/${file})，跳过`);
          continue;
        }
        law.articles.forEach((article, i) => {
          lawRows.push({
            code: `${law.country_code}-${abbrev}-${String(i + 1).padStart(3, '0')}`,
            country_code: law.country_code,
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
    }

    // 场景
    if (fs.existsSync(scenesDir)) {
      const sceneFiles = fs.readdirSync(scenesDir).filter((f) => f.endsWith('.json') && f !== 'index.json');
      for (const file of sceneFiles) {
        const data = parseSceneJson(path.join(scenesDir, file));
        for (const scene of data.scenes) {
          sceneRows.push({
            key: scene.key,
            country_code: data.country_code,
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
              branch_tag: c.branch_tag || null,
              next_scene_hint: c.next_scene_hint || null,
              next_scene_key: c.next_scene_key || null,
            })),
          });
        }
      }
    }
  }

  const choiceCount = sceneRows.reduce((n, s) => n + s.choices.length, 0);
  console.log(`✅ 解析法条: ${lawRows.length} 条`);
  console.log(`✅ 解析场景: ${sceneRows.length} 个，选项 ${choiceCount} 个`);

  // 2. DRY-RUN：打印预览后退出
  if (DRY_RUN) {
    console.log('\n--- 法条预览（前 8 条）---');
    for (const l of lawRows.slice(0, 8)) {
      console.log(`  ${l.code} | ${l.law_name} ${l.article_ref} | ${l.title}`);
    }
    console.log('\n--- 场景预览 ---');
    for (const s of sceneRows) {
      console.log(`  ${s.key} | ${s.country_code} | ${s.title_zh} | ${s.choices.length} 选项`);
    }
    console.log('\n--- 悬空引用检查 ---');
    const lawCodes = new Set(lawRows.map((l) => l.code));
    const used = new Set();
    let missing = 0;
    for (const s of sceneRows) {
      for (const c of s.choices) {
        for (const ref of c.laws_revealed) {
          used.add(ref);
          if (!lawCodes.has(ref)) {
            console.warn(`  ⚠️  悬空引用: ${ref} (场景 ${s.key})`);
            missing++;
          }
        }
      }
    }
    console.log(`\n共 ${used.size} 个不同引用编号，其中悬空 ${missing} 个`);
    return;
  }

  // 3. 查询基础表拿 UUID
  const countries = await rest('GET', 'countries', { query: '?select=id,code,is_active' });
  const countryIdByCode = {};
  const countryActiveByCode = {};
  for (const c of countries || []) {
    countryIdByCode[c.code] = c.id;
    countryActiveByCode[c.code] = c.is_active;
  }

  // 确保数据涉及的国家都存在且激活
  const dataCountryCodes = new Set([...lawRows.map((l) => l.country_code), ...sceneRows.map((s) => s.country_code)]);
  for (const cc of dataCountryCodes) {
    if (!countryIdByCode[cc]) {
      const inserted = await rest('POST', 'countries', {
        body: [{
          code: cc,
          name: { zh: cc === 'US' ? '美国' : cc === 'EU' ? '欧盟' : cc, en: cc },
          legal_system: cc === 'US' ? 'common_law' : 'civil_law',
          currency: cc === 'US' ? 'USD' : cc === 'EU' ? 'EUR' : null,
          default_language: 'en',
          is_active: true,
        }],
        prefer: 'return=representation',
      });
      if (inserted?.[0]?.id) countryIdByCode[cc] = inserted[0].id;
      console.log(`  ➕ 新增国家: ${cc}`);
    } else if (countryActiveByCode[cc] === false) {
      await rest('PATCH', 'countries', { query: `?code=eq.${cc}`, body: { is_active: true } });
      console.log(`  ✅ 激活国家: ${cc}`);
    }
  }

  const categories = await rest('GET', 'law_categories', { query: '?select=id,name' });
  const catIdByName = {};
  for (const c of categories || []) catIdByName[c.name?.zh] = c.id;

  const lifeStages = await rest('GET', 'life_stages', { query: '?select=id,name' });
  const stageIdByName = {};
  for (const s of lifeStages || []) stageIdByName[s.name?.zh] = s.id;

  // 4. 清空旧数据（幂等）：先删 scenarios（级联删 choices/laws link），再删 laws
  console.log('\n🧹 清空旧数据...');
  await deleteAll('scenarios');
  await deleteAll('laws');

  // 5. 写入 laws
  console.log('📥 写入法条...');
  const lawPayload = lawRows.map((l) => ({
    code: l.code,
    country_id: countryIdByCode[l.country_code],
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
  const insertedLaws = await rest('POST', 'laws', { body: lawPayload, prefer: 'return=representation' });
  const lawIdByCode = {};
  for (const l of insertedLaws || []) lawIdByCode[l.code] = l.id;
  console.log(`  已写入 ${Object.keys(lawIdByCode).length} 条`);

  // 6. 写入 scenarios + choices + scenario_laws
  console.log('📥 写入场景...');
  let lawLinkCount = 0;
  const skippedRefs = new Set();
  let sceneInserted = 0;
  let choiceInserted = 0;

  for (const s of sceneRows) {
    const categoryId = catIdByName[CATEGORY_ZH[s.category]];
    const lifeStageId = stageIdByName[LIFE_STAGE_ZH[s.life_stage]];
    const countryId = countryIdByCode[s.country_code];
    if (!categoryId) { console.warn(`  ⚠️  场景 ${s.key} 无匹配分类，跳过`); continue; }
    if (!lifeStageId) { console.warn(`  ⚠️  场景 ${s.key} 无匹配人生阶段 ${s.life_stage}，跳过`); continue; }
    if (!countryId) { console.warn(`  ⚠️  场景 ${s.key} 无匹配国家 ${s.country_code}，跳过`); continue; }

    const [scenario] = (await rest('POST', 'scenarios', {
      body: [{
        key: s.key,
        title: { zh: s.title_zh, en: s.title_en },
        narrative: { zh: s.narrative_zh, en: s.narrative_en },
        life_stage_id: lifeStageId,
        category_id: categoryId,
        country_id: countryId,
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

    const choicePayload = s.choices.map((c) => ({
      scenario_id: scenario.id,
      choice_text: { zh: c.text_zh, en: c.text_en },
      consequence_text: { zh: c.consequence_zh, en: c.consequence_en },
      stats_effect: c.stats_effect,
      legal_outcome: null,
      is_legally_correct: c.is_legally_correct,
      is_best_ending: c.is_legally_correct,
      sort_order: c.sort_order,
      branch_tag: c.branch_tag,
      next_scene_hint: c.next_scene_hint,
      next_scene_key: c.next_scene_key,
    }));
    const insertedChoices = await rest('POST', 'scenario_choices', {
      body: choicePayload,
      prefer: 'return=representation',
    });
    choiceInserted += (insertedChoices || []).length;

    const linkPayload = [];
    const linkSeen = new Set();
    for (const c of s.choices) {
      for (const ref of c.laws_revealed) {
        const lawId = lawIdByCode[ref];
        if (!lawId) { skippedRefs.add(ref); continue; }
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

  // 7. 汇总
  console.log('\n========== 导入完成 ==========');
  console.log(`  法条: ${Object.keys(lawIdByCode).length} 条`);
  console.log(`  场景: ${sceneInserted} 个`);
  console.log(`  选项: ${choiceInserted} 个`);
  console.log(`  场景-法条关联: ${lawLinkCount} 条`);
  if (skippedRefs.size) {
    console.log('\n  ⚠️  跳过以下悬空引用（留待内容扩充）:');
    for (const r of skippedRefs) console.log(`    - ${r}`);
  } else {
    console.log('\n  ✅ 无悬空引用');
  }
}

main().catch((err) => {
  console.error('\n❌ 导入失败:', err.message);
  process.exit(1);
});
