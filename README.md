# ⚖️ 律途人生 (LegalLife)

> 在人生模拟中学习法律知识 — 每一次选择，都是一堂法律课

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61dafb)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-black)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ecf8e)](https://supabase.com/)

**律途人生** 是一款融合普法教育的人生模拟游戏。玩家在游戏中体验从童年到老年的各种生活场景，每个场景都关联该国家/地区真实的法律条款。通过在不同国家/地区的生活体验，玩家能直观感受到法律体系的文化差异。

## ✨ 核心特色

- 🎮 **沉浸式人生模拟** — 文字剧情 + AI 场景图，类《人生重开模拟器》体验
- ⚖️ **真实法律科普** — 每个场景关联真实法条，含原文 + 通俗解读
- 🌍 **跨国法律对比** — 同一场景在不同国家有不同法律结果
- 🔀 **分支剧情** — 不同选择导向不同的人生路径和法律知识
- 📖 **法律图鉴** — 收集式法律知识卡片系统
- 🏆 **成就系统** — 基于法律收集和选择行为的成就
- 📱 **离线可玩** — 核心内容本地缓存，不依赖网络
- 🎨 **AI 场景图片** — Replicate SDXL 生成高质量场景图

## 🚀 快速开始

### 前提条件

- Node.js >= 20
- pnpm >= 9
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)

### 安装

```bash
# 克隆项目
cd D:\Ccode\legal-life

# 安装依赖
pnpm install

# 启动 Expo 开发服务器
cd apps/mobile
npx expo start
```

### 环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填入你的 Supabase 和 Replicate 凭据
```

### 数据库

```bash
# 初始化 Supabase 项目
supabase init
supabase link --project-ref <your-project-ref>

# 执行数据库迁移
supabase db push

# 导入种子数据
supabase db seed
```

## 📁 项目结构

```
legal-life/
├── apps/
│   ├── mobile/          # React Native + Expo 游戏主体
│   └── admin/           # Next.js 管理后台
├── packages/
│   ├── shared/          # 共享类型、常量、工具函数
│   ├── game-engine/     # 平台无关的游戏引擎
│   └── legal-data/      # 法律数据库（YAML/JSON）
├── supabase/
│   ├── migrations/      # 数据库迁移 SQL
│   ├── seed.sql         # 种子数据
│   └── functions/       # Edge Functions
└── scripts/             # 工具脚本
```

## 🗺️ 实施路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | MVP: 中国法律 + 青年场景 | 🚧 开发中 |
| Phase 2 | 美国法律 + 更多场景 | 📋 计划 |
| Phase 3 | 日韩法律 + 全年龄段 | 📋 计划 |
| Phase 4 | 欧盟法律 + AI 实时生成 | 📋 计划 |
| Phase 5 | 社区贡献 + 法律众包 | 📋 计划 |

## 🛠️ 技术栈

- **移动端**: React Native 0.76 + Expo SDK 52 + Expo Router
- **后端服务**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **状态管理**: Zustand v5
- **国际化**: i18next + react-i18next + expo-localization
- **游戏引擎**: 自研 TypeScript 引擎 (`@legal-life/game-engine`)
- **AI 图片**: Replicate API (SDXL / Flux)
- **管理后台**: Next.js 15

## ⚠️ 免责声明

本应用提供的法律信息仅供参考，不构成法律建议。如有具体法律问题，请咨询专业律师。法律条款可能随时间修订，我们会尽力保持更新但不保证时效性。

## 📄 许可

MIT License

---

*Made with ❤️ by shenluonanshu*
