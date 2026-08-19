/**
 * 场景图片上传 + 关联脚本
 *
 * 读取 picture/ 目录下已生成的场景图片，上传到 Supabase Storage
 * （public bucket），并更新 scenarios 表的 cached_image_url 字段。
 *
 * 用法:
 *   SUPABASE_SERVICE_KEY=xxx node scripts/upload-scenario-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dezccluuxvcwlubqokle.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'scenario-images';
const PICTURE_DIR = path.resolve('picture');

// 场景 key → 本地图片文件名（按标题匹配）
const IMAGE_MAP = {
  'cn-civil-001': '出租屋押金纠纷.jpg',
  'cn-civil-002': '婚前买房.jpg',
  'cn-adult-001': '离婚时房子怎么分.jpg',
  'cn-adult-002': '买房定金的陷阱.jpg',
  'cn-adult-003': '培训班跑路.jpg',
  'cn-adult-004': '职场中年降薪危机.jpg',
  'cn-adult-005': '网络交友的甜蜜陷阱.jpg',
  'cn-mid-001': '谁来赡养父母.jpg',
  'cn-mid-002': '遗产怎么分.jpg',
  'cn-mid-003': '高收益的陷阱.jpg',
  'cn-senior-001': '天价保健品的骗局.jpg',
  'cn-senior-002': '以房养老的骗局.jpg',
  'cn-senior-003': '晚年的遗嘱.jpg',
  'cn-senior-004': '谁来养我.jpg',
  'cn-shop-001': '网购羽绒服.jpg',
  'cn-shop-002': '健身房跑路.jpg',
  'cn-job-001': '离婚时财产怎么分.jpg',
  'cn-job-002': '加班风波.jpg',
  'cn-job-003': '被辞退的风险.jpg',
  'cn-kid-001': '压岁钱归谁.jpg',
  'cn-kid-002': '被欺负之后.jpg',
  'cn-kid-003': '防沉迷的烦恼 .jpg',
  'cn-kid-004': '马路上的选择.jpg',
  'cn-teen-001': '网络欺凌.jpg',
  'cn-teen-002': '偷偷充值的游戏.jpg',
  'cn-teen-003': '网贷的诱惑.jpg',
  'cn-teen-004': '兼职刷单的骗局.jpg',
  'cn-traffic-001': '同学聚会的代价.jpg',
  'cn-traffic-002': '剐蹭之后的选择.jpg',
  'cn-traffic-003': '电动车的代价.jpg',
  'us-job-001': '没有加班费的打工.jpg',
  'us-job-002': '面试中的歧视.jpg',
  'us-shop-001': '货不对板的网购.jpg',
  'us-rent-001': '押金被无理扣光.jpg',
  'us-traffic-001': '朋友要酒驾回家.jpg',
  'us-teen-001': '商店里的诱惑.jpg',
  'eu-data-001': '删除我的数据.jpg',
  'eu-data-002': '不同意就别用.jpg',
  'eu-data-003': '数据泄露了却没通知.jpg',
  'eu-data-004': '带走我的数据.jpg',
  'eu-data-005': '被算法拒绝之后.jpg',
};

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少 SUPABASE_SERVICE_KEY 环境变量');
  process.exit(1);
}

const authHeaders = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
};

async function main() {
  console.log('🎨 场景图片上传 + 关联\n');

  // 1. 创建 public bucket（已存在则忽略）
  const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: BUCKET, public: true }),
  });
  if (bucketRes.ok) {
    console.log(`✅ 创建 bucket: ${BUCKET}`);
  } else {
    const msg = await bucketRes.text();
    console.log(`ℹ️  bucket 已存在或创建失败(${bucketRes.status}): ${msg.slice(0, 80)}`);
  }

  let uploaded = 0;
  const failed = [];

  for (const [key, filename] of Object.entries(IMAGE_MAP)) {
    const filePath = path.join(PICTURE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      failed.push(`${key} — 文件缺失: ${filename}`);
      continue;
    }

    const objectPath = `${key}.jpg`;
    const fileBuffer = fs.readFileSync(filePath);

    // 2. 上传图片到 storage
    const upRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        body: fileBuffer,
      }
    );
    if (!upRes.ok) {
      const err = await upRes.text();
      failed.push(`${key} — 上传失败(${upRes.status}): ${err.slice(0, 80)}`);
      continue;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;

    // 3. 更新 scenarios.cached_image_url
    const updRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scenarios?key=eq.${key}`,
      {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ cached_image_url: publicUrl }),
      }
    );
    if (updRes.ok) {
      uploaded++;
      console.log(`✅ ${key} ← ${filename}`);
    } else {
      const err = await updRes.text();
      failed.push(`${key} — 更新场景失败(${updRes.status}): ${err.slice(0, 80)}`);
    }
  }

  console.log(`\n========== 完成 ==========`);
  console.log(`  上传并关联: ${uploaded} 个`);
  if (failed.length) {
    console.log(`  失败 ${failed.length} 个:`);
    for (const f of failed) console.log(`    - ${f}`);
  }
  console.log(`\n  全部 ${Object.keys(IMAGE_MAP).length} 张场景图已关联`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
