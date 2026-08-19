/**
 * 场景图片打包脚本（方案 A：图片本地化）
 *
 * 把 picture/ 目录下的场景图片复制到 apps/mobile/assets/images/（重命名为 key.jpg），
 * 并生成 apps/mobile/lib/sceneImages.ts 的 require 映射，让 App 用本地图片（零网络延迟）。
 *
 * 用法: node scripts/build-scene-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const UPLOAD_SCRIPT = path.join(ROOT, 'scripts/upload-scenario-images.mjs');
const PICTURE_DIR = path.join(ROOT, 'picture');
const IMAGES_DIR = path.join(ROOT, 'apps/mobile/assets/images');
const SCENE_IMAGES_TS = path.join(ROOT, 'apps/mobile/lib/sceneImages.ts');

// 1. 从 upload 脚本提取 IMAGE_MAP（key → 中文图片文件名）
const src = fs.readFileSync(UPLOAD_SCRIPT, 'utf8');
const map = {};
for (const m of src.matchAll(/'([a-z]{2}-[a-z]+-\d+)':\s*'([^']+)'/g)) {
  map[m[1]] = m[2];
}

if (Object.keys(map).length === 0) {
  console.error('❌ 未能从 upload-scenario-images.mjs 提取 IMAGE_MAP');
  process.exit(1);
}

// 2. 复制图片到 assets（重命名为 key.jpg）
fs.mkdirSync(IMAGES_DIR, { recursive: true });
let copied = 0;
const missing = [];
for (const [key, filename] of Object.entries(map)) {
  const srcFile = path.join(PICTURE_DIR, filename);
  const dstFile = path.join(IMAGES_DIR, `${key}.jpg`);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, dstFile);
    copied++;
  } else {
    missing.push(`${key} (${filename})`);
  }
}

// 3. 生成 sceneImages.ts（require 映射）
const lines = Object.keys(map).map((k) => `  '${k}': require('../assets/images/${k}.jpg'),`);
const ts = [
  '// 自动生成，勿手改（scripts/build-scene-images.mjs）',
  "import type { ImageSourcePropType } from 'react-native';",
  '',
  'export const SCENE_IMAGES: Record<string, ImageSourcePropType> = {',
  ...lines,
  '};',
  '',
].join('\n');
fs.writeFileSync(SCENE_IMAGES_TS, ts);

console.log(`✅ 复制图片 ${copied} 张到 assets/images/`);
if (missing.length) {
  console.log(`⚠️  缺失 ${missing.length} 张:`);
  for (const m of missing) console.log(`   - ${m}`);
}
console.log(`✅ 生成 sceneImages.ts（${Object.keys(map).length} 个映射）`);
