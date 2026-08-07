/**
 * 法律数据校验脚本
 * 检查 YAML 文件格式、必填字段、引用完整性
 *
 * 用法: npx tsx legal-data/scripts/validate.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface LawArticle {
  ref: string;
  ref_en?: string;
  title?: string;
  full_text: string;
  summary: string;
  keywords: string[];
  tags: string[];
  life_stage_tags: string[];
  difficulty: number;
}

interface LawFile {
  law_name: string;
  law_name_en?: string;
  category: string;
  country_code: string;
  effective_date: string;
  last_amended?: string;
  source_url: string;
  source_name: string;
  articles: LawArticle[];
}

const VALID_COUNTRIES = ['CN', 'US', 'JP', 'KR', 'DE', 'FR'];
const VALID_CATEGORIES = [
  'employment',
  'consumer_rights',
  'traffic',
  'criminal',
  'civil',
  'marriage',
  'constitution',
  'cyber_security',
  'education',
  'healthcare',
];
const VALID_LIFE_STAGES = [
  'childhood',
  'teen',
  'young_adult',
  'adult',
  'middle_age',
  'senior',
];

let errors: string[] = [];
let warnings: string[] = [];

function validateLawFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // 简单的格式检查（实际项目中建议使用 YAML 解析库）
  if (!content.includes('law_name:')) {
    errors.push(`${fileName}: 缺少 law_name 字段`);
  }
  if (!content.includes('category:')) {
    errors.push(`${fileName}: 缺少 category 字段`);
  }
  if (!content.includes('country_code:')) {
    errors.push(`${fileName}: 缺少 country_code 字段`);
  }
  if (!content.includes('articles:')) {
    errors.push(`${fileName}: 缺少 articles 列表`);
  }
  if (!content.includes('source_url:')) {
    warnings.push(`${fileName}: 缺少 source_url`);
  }

  // 检查法条引用
  const refMatches = content.match(/ref:\s*"(.*?)"/g);
  if (refMatches) {
    const refs = refMatches.map((m) => {
      const match = m.match(/ref:\s*"(.*?)"/);
      return match?.[1] ?? '';
    });
    const uniqueRefs = new Set(refs);
    if (uniqueRefs.size !== refs.length) {
      errors.push(`${fileName}: 存在重复的法条引用`);
    }
  }

  // 检查难度字段
  const diffMatches = content.match(/difficulty:\s*(\d+)/g);
  if (diffMatches) {
    for (const m of diffMatches) {
      const val = parseInt(m.replace('difficulty:', '').trim());
      if (val < 1 || val > 5) {
        errors.push(`${fileName}: difficulty 值超出范围 (1-5)`);
      }
    }
  }
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 主流程
console.log('🔍 开始校验法律数据...\n');

const dataDir = path.resolve(__dirname, '../cn');
if (!fs.existsSync(dataDir)) {
  console.log('⚠️  中国法律数据目录不存在，跳过校验');
  process.exit(0);
}

const lawFiles = walkDir(dataDir);
console.log(`📁 发现 ${lawFiles.length} 个法律数据文件\n`);

for (const file of lawFiles) {
  validateLawFile(file);
}

// 输出结果
if (errors.length > 0) {
  console.log('❌ 错误:');
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  警告:');
  warnings.forEach((w) => console.log(`  - ${w}`));
  console.log();
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ 所有法律数据文件校验通过！');
} else if (errors.length === 0) {
  console.log('✅ 校验通过（有警告但无错误）');
} else {
  console.log(`❌ 校验失败：${errors.length} 个错误，${warnings.length} 个警告`);
  process.exit(1);
}
