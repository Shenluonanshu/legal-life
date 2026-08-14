const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo 支持：让 Metro 能解析 workspace 包
const config = getDefaultConfig(__dirname);

// 添加 workspace 包的源码目录到 watch 列表
const workspaceRoot = path.resolve(__dirname, '../..');

config.watchFolders = [
  ...(config.watchFolders || []),
  workspaceRoot,
  path.resolve(workspaceRoot, 'packages'),
];

// 让 Metro 能正确解析 monorepo 中的 node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 支持从 workspace 包中导入 .ts/.tsx 文件。
// 注意：必须用追加而非覆盖，否则会丢掉默认的 css 等扩展名，
// 导致 @expo/log-box 的 CSS Modules 无法解析（dev 模式白屏/500）。
config.resolver.sourceExts = [
  ...new Set([...(config.resolver.sourceExts || []), 'ts', 'tsx', 'css']),
];

module.exports = config;
