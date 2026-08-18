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
import { supabase } from './supabase';

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

// 存档同步处理器：由 gameStore 注册，注入本地存档读取与上传逻辑（解耦，避免循环依赖）
type SyncHandler = (saveIds: string[]) => Promise<number>;
let syncHandler: SyncHandler | null = null;

export function registerSyncHandler(handler: SyncHandler): void {
  syncHandler = handler;
}

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

  // 无待同步存档：直接收尾
  if (state.pendingSaves.length === 0) {
    await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    return { success: true, synced, errors };
  }

  // 同步到 Supabase 需要登录用户（game_saves.user_id 关联 auth.users）
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    // 未登录：仅本地持久化，保留待同步队列，登录后自动补同步
    await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
    return { success: true, synced, errors };
  }

  // 已登录：逐条同步待处理存档（处理器由 gameStore 注册）
  if (syncHandler) {
    try {
      synced = await syncHandler(state.pendingSaves);
    } catch {
      errors = state.pendingSaves.length;
    }
  }

  const updated = await getSyncState();
  if (errors === 0) updated.lastSyncSuccess = Date.now();
  await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(updated));
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

  return { success: errors === 0, synced, errors };
}

/** 判断是否应该执行同步（距上次同步超过 5 分钟） */
export async function shouldSync(): Promise<boolean> {
  const FIVE_MINUTES = 5 * 60 * 1000;
  try {
    const raw = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!raw) return true;
    const last = parseInt(raw, 10);
    return Date.now() - last > FIVE_MINUTES;
  } catch {
    return true;
  }
}
