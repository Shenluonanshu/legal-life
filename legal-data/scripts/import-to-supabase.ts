/**
 * 法律数据导入 Supabase 脚本
 * 读取 YAML 文件，解析法条，写入 Supabase 数据库
 *
 * 用法: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx tsx legal-data/scripts/import-to-supabase.ts
 */

// 这是一个模板脚本，实际使用需要安装依赖:
// npm install @supabase/supabase-js js-yaml
//
// 核心逻辑:
// 1. 遍历 legal-data/data/ 目录下的所有 .yaml 文件
// 2. 解析每个文件的法条内容
// 3. 查找 country_id, category_id 对应的 UUID
// 4. Upsert 法条到 laws 表

const USAGE = `
使用方法:
  SUPABASE_URL=https://xxx.supabase.co \\
  SUPABASE_SERVICE_KEY=xxx \\
  npx tsx legal-data/scripts/import-to-supabase.ts [--dry-run] [--country CN]

选项:
  --dry-run    仅打印将要导入的数据，不实际写入
  --country CN  只导入指定国家的数据（默认全部）
`;

console.log('📦 律途人生 — 法律数据导入工具');
console.log(USAGE);

// 检查环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未设置');
  console.log('   请设置环境变量后重试。');
  console.log('   (在 Supabase 实际创建之前，此脚本处于待命模式)');
  process.exit(0);
}

// TODO: 实际导入逻辑在 Supabase 项目创建后实现
console.log('✅ 环境变量已配置，准备导入...');
console.log('   (导入逻辑将在 Supabase 项目就绪后激活)');
