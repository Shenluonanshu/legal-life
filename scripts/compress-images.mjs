/**
 * 场景图片批量压缩脚本
 *
 * 把 picture/ 目录下的 PNG 原图缩放（宽 800px）并转成 JPEG（质量 82），
 * 大幅减小体积（约 3-4MB → 0.1MB），加快 App 图片加载速度。
 *
 * 用法: node scripts/compress-images.mjs
 * （会覆盖输出同名 .jpg 并删除原 .png）
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PICTURE_DIR = path.resolve('picture');

const files = fs.readdirSync(PICTURE_DIR).filter((f) => f.toLowerCase().endsWith('.png'));

if (files.length === 0) {
  console.log('⚠️  没有找到 .png 文件');
  process.exit(0);
}

console.log(`📦 待压缩 ${files.length} 张图片\n`);

let totalBefore = 0;
let totalAfter = 0;

for (const f of files) {
  const src = path.join(PICTURE_DIR, f);
  const dst = path.join(PICTURE_DIR, f.replace(/\.png$/i, '.jpg'));

  const before = fs.statSync(src).size;
  const info = await sharp(src)
    .resize({ width: 800 })
    .jpeg({ quality: 82 })
    .toFile(dst);

  fs.unlinkSync(src); // 删除原 PNG

  totalBefore += before;
  totalAfter += info.size;
  console.log(`✅ ${f} → ${(info.size / 1024 / 1024).toFixed(2)} MB`);
}

console.log(`\n========== 完成 ==========`);
console.log(`  压缩前: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
console.log(`  压缩后: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
console.log(`  节省: ${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%`);
