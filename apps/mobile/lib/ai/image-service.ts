/**
 * AI 场景图片服务
 *
 * 三层缓存策略：
 *   L1: 本地 AsyncStorage 缓存（最快）
 *   L2: Supabase Storage CDN（预生成图）
 *   L3: Replicate API 实时生成（兜底）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_CACHE_PREFIX = 'scene_img_';
const IMAGE_CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7天

interface CachedImage {
  url: string;
  cachedAt: number;
  promptHash: string;
}

// ============================================================
// L1: 本地缓存
// ============================================================

/** 生成缓存键 */
function cacheKey(scenarioId: string): string {
  return `${IMAGE_CACHE_PREFIX}${scenarioId}`;
}

/** 从本地缓存获取图片 URL */
async function getLocalCached(scenarioId: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(scenarioId));
    if (!raw) return null;

    const cached: CachedImage = JSON.parse(raw);
    const age = Date.now() - cached.cachedAt;

    if (age > IMAGE_CACHE_EXPIRY_MS) {
      // 缓存过期，异步删除
      AsyncStorage.removeItem(cacheKey(scenarioId)).catch(() => {});
      return null;
    }

    return cached.url;
  } catch {
    return null;
  }
}

/** 保存图片 URL 到本地缓存 */
async function setLocalCached(
  scenarioId: string,
  url: string,
  promptHash: string
): Promise<void> {
  const cached: CachedImage = {
    url,
    cachedAt: Date.now(),
    promptHash,
  };

  await AsyncStorage.setItem(cacheKey(scenarioId), JSON.stringify(cached));
}

// ============================================================
// L2: Supabase CDN 查询
// ============================================================

/** 从 Supabase 查询预生成的图片 */
async function getSupabaseCached(
  scenarioId: string
): Promise<string | null> {
  try {
    // 如果 Supabase 客户端可用（将在连接后使用）
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/image_cache?scenario_id=eq.${scenarioId}&select=image_url&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data?.[0]?.image_url ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// L3: Replicate API 实时生成
// ============================================================

/** 调用 Supabase Edge Function 生成图片 */
async function generateViaEdgeFunction(
  prompt: string,
  scenarioId: string
): Promise<string | null> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          prompt,
          scenario_id: scenarioId,
          width: 1024,
          height: 768,
        }),
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    return result?.image_url ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// 主入口：获取场景图片
// ============================================================

export interface SceneImageResult {
  url: string;
  source: 'local_cache' | 'supabase_cdn' | 'realtime_generated' | 'fallback';
}

/** 获取场景图片（按优先级尝试三层缓存） */
export async function getSceneImage(
  scenarioId: string,
  imagePrompt?: string
): Promise<SceneImageResult> {
  // 1. 检查本地缓存
  const localUrl = await getLocalCached(scenarioId);
  if (localUrl) {
    return { url: localUrl, source: 'local_cache' };
  }

  // 2. 检查 Supabase CDN
  const cdnUrl = await getSupabaseCached(scenarioId);
  if (cdnUrl) {
    // 找到后存入本地缓存
    const hash = await hashPrompt(imagePrompt ?? scenarioId);
    await setLocalCached(scenarioId, cdnUrl, hash);
    return { url: cdnUrl, source: 'supabase_cdn' };
  }

  // 3. 实时生成（仅在有 prompt 时）
  if (imagePrompt) {
    const generatedUrl = await generateViaEdgeFunction(imagePrompt, scenarioId);
    if (generatedUrl) {
      const hash = await hashPrompt(imagePrompt);
      await setLocalCached(scenarioId, generatedUrl, hash);
      return { url: generatedUrl, source: 'realtime_generated' };
    }
  }

  // 4. 降级：返回占位图
  return { url: '', source: 'fallback' };
}

/** 预加载场景图片（适合在场景触发前调用） */
export async function preloadSceneImage(
  scenarioId: string,
  imagePrompt?: string
): Promise<void> {
  // 异步预加载，不阻塞 UI
  getSceneImage(scenarioId, imagePrompt).catch(() => {});
}

/** 清除所有图片缓存（用于存储空间管理） */
export async function clearImageCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageKeys = keys.filter((k) => k.startsWith(IMAGE_CACHE_PREFIX));
    await AsyncStorage.multiRemove(imageKeys);
  } catch {
    // 静默失败
  }
}

/** 获取缓存大小（估算） */
export async function getImageCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const imageKeys = keys.filter((k) => k.startsWith(IMAGE_CACHE_PREFIX));
    return imageKeys.length;
  } catch {
    return 0;
  }
}

// ============================================================
// 工具函数
// ============================================================

/** 简单的 prompt hashing */
async function hashPrompt(prompt: string): Promise<string> {
  // 使用简单的 hash（不依赖 crypto API）
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `h${Math.abs(hash).toString(36)}`;
}
