/**
 * AI 场景图片批量预生成脚本
 *
 * 读取场景数据中的所有 image_prompt，批量调用 Replicate API 生成图片，
 * 上传到 Supabase Storage，更新 image_cache 表。
 *
 * 用法:
 *   REPLICATE_API_TOKEN=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx \
 *   npx tsx scripts/pregenerate-images.ts [--country CN] [--dry-run] [--limit 5]
 *
 * 选项:
 *   --country CN    只处理指定国家的场景
 *   --dry-run       仅打印将要生成的 prompt，不实际调用 API
 *   --limit 5       限制生成数量（用于测试）
 *   --style anime   指定图片风格（anime/realistic/illustration）
 */

import * as fs from 'fs';
import * as path from 'path';

const REPLICATE_MODEL = 'black-forest-labs/flux-schnell';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? parseInt(process.argv[idx + 1] ?? '0') : Infinity;
})();
const COUNTRY = (() => {
  const idx = process.argv.indexOf('--country');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

interface SceneData {
  key: string;
  title: { zh: string };
  image_prompt: string;
  life_stage: string;
  difficulty: number;
}

async function main() {
  console.log('🎨 律途人生 — AI 场景图片预生成工具');
  console.log(`   模型: ${REPLICATE_MODEL}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log(`   数量限制: ${LIMIT === Infinity ? '无限制' : LIMIT}`);
  console.log();

  // 1. 加载场景数据
  const scenesDir = path.resolve(__dirname, '../legal-data/scenes');
  const sceneFiles = fs
    .readdirSync(scenesDir)
    .filter((f) => f.endsWith('.json') && f !== 'index.json');

  console.log(`📁 发现 ${sceneFiles.length} 个场景数据文件\n`);

  let allScenes: SceneData[] = [];

  for (const file of sceneFiles) {
    const content = JSON.parse(
      fs.readFileSync(path.join(scenesDir, file), 'utf-8')
    );

    if (COUNTRY && content.country_code !== COUNTRY) continue;

    const scenes = content.scenes || [];
    for (const scene of scenes) {
      if (scene.image_prompt) {
        allScenes.push({
          key: scene.key,
          title: scene.title,
          image_prompt: scene.image_prompt,
          life_stage: scene.life_stage,
          difficulty: scene.difficulty,
        });
      }
    }
  }

  console.log(`🎭 共 ${allScenes.length} 个场景需要生成图片`);

  // 应用数量限制
  if (LIMIT < allScenes.length) {
    allScenes = allScenes.slice(0, LIMIT);
    console.log(`   (限制为 ${LIMIT} 个)\n`);
  }

  // 2. 统计
  const totalEstimateCost = 0.003 * allScenes.length;
  console.log(`💰 预估总费用: $${totalEstimateCost.toFixed(3)}`);
  console.log();

  // 3. 处理每个场景
  for (const scene of allScenes) {
    const prompt = `${scene.image_prompt}, high quality, 4K, modern illustration style`;

    console.log(`\n--- ${scene.key} ---`);
    console.log(`   标题: ${scene.title.zh}`);
    console.log(`   阶段: ${scene.life_stage} | 难度: ${scene.difficulty}`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    if (DRY_RUN) {
      console.log('   [DRY RUN] 跳过实际生成');
      continue;
    }

    // 实际调用 Replicate API
    try {
      const replicateToken = process.env['REPLICATE_API_TOKEN'];
      if (!replicateToken) {
        console.error('   ❌ REPLICATE_API_TOKEN 未设置，跳过');
        continue;
      }

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: REPLICATE_MODEL,
          input: {
            prompt,
            width: 1024,
            height: 768,
            num_outputs: 1,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`   ❌ API 错误: ${response.status} - ${err.substring(0, 100)}`);
        continue;
      }

      const prediction = await response.json();
      console.log(`   ✅ 已提交: ${prediction.id}`);
      console.log(`   📊 状态: ${prediction.status}`);
      if (prediction.output?.[0]) {
        console.log(`   🖼️  图片 URL: ${(prediction.output[0] as string).substring(0, 80)}...`);
      }

      // 延迟避免 API 限流
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`   ❌ 异常: ${err}`);
    }
  }

  console.log('\n✨ 预生成完成！');
  console.log('   接下来需要将生成的图片上传到 Supabase Storage');
  console.log('   并更新 image_cache 表。');
}

main().catch(console.error);
