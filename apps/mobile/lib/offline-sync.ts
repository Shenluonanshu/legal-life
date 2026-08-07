/**
 * 离线同步管理器
 *
 * 策略：
 *   1. 游戏状态始终先保存在本地（Zustand persist + MMKV）
 *   2. 网络可用时在后台同步到 Supabase
 *   3. 冲突解决：最后写入优先（last-write-wins）
 *   4. 法律数据启动时全量拉取，后续增量更新
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_STATE_KEY = 'sync_state';
const LEGAL_DATA_VERSION_KEY = 'legal_data_version';
const LAST_SYNC_KEY = 'last_sync_timestamp';

interface SyncState {
  pendingSaves: string[];      // 等待同步的存档 ID
  lastSyncAttempt: number;
  lastSyncSuccess: number;
  syncErrors: number;
}

// ============================================================
// 同步状态管理
// ============================================================

/** 获取当前同步状态 */
export async function getSyncState(): Promise<SyncState> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (!raw) return getDefaultSyncState();
    return JSON.parse(raw) as SyncState;
  } catch {
    return getDefaultSyncState();
  }
}

function getDefaultSyncState(): SyncState {
  return {
    pendingSaves: [],
    lastSyncAttempt: 0,
    lastSyncSuccess: 0,
    syncErrors: 0,
  };
}

/** 标记存档需要同步 */
export async function markForSync(saveId: string): Promise<void> {
  const state = await getSyncState();
  if (!state.pendingSaves.includes(saveId)) {
    state.pendingSaves.push(saveId);
  }
  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

/** 标记同步成功 */
export async function markSynced(saveId: string): Promise<void> {
  const state = await getSyncState();
  state.pendingSaves = state.pendingSaves.filter((id) => id !== saveId);
  state.lastSyncSuccess = Date.now();
  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

// ============================================================
// 法律数据版本管理
// ============================================================

/** 获取本地法律数据版本 */
export async function getLocalLegalDataVersion(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LEGAL_DATA_VERSION_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

/** 更新本地法律数据版本 */
export async function setLocalLegalDataVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(LEGAL_DATA_VERSION_KEY, version.toString());
}

/** 检查是否需要更新法律数据 */
export async function checkLegalDataUpdate(): Promise<{
  needsUpdate: boolean;
  remoteVersion: number;
}> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { needsUpdate: false, remoteVersion: 0 };
    }

    const localVersion = await getLocalLegalDataVersion();

    // 查询远程最新版本（通过 updated_at 最大的记录）
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_latest_legal_version`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) return { needsUpdate: false, remoteVersion: 0 };
    const remoteVersion = await response.json();

    return {
      needsUpdate: remoteVersion > localVersion,
      remoteVersion,
    };
  } catch {
    return { needsUpdate: false, remoteVersion: 0 };
  }
}

// ============================================================
// 定时同步
// ============================================================

/** 执行一次同步 */
export async function performSync(): Promise<{
  success: boolean;
  synced: number;
  errors: number;
}> {
  const state = await getSyncState();
  let synced = 0;
  let errors = 0;

  state.lastSyncAttempt = Date.now();

  // 这里会调用 Supabase API 执行实际的同步
  // 由于 Supabase 客户端依赖运行时环境，实际同步逻辑在 gameStore 中实现

  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

  return { success: errors === 0, synced, errors };
}

/** 判断是否应该执行同步 */
export function shouldSync(): boolean {
  // 距上次同步超过 5 分钟才执行
  const FIVE_MINUTES = 5 * 60 * 1000;
  // 通过 LAST_SYNC_KEY 判断
  return true; // 简化：始终尝试同步，实际节流在调用方处理
}
