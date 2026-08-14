/**
 * 游戏核心状态管理 (Zustand)
 *
 * 支持分支剧情：每个选择可能导向不同的后续场景，
 * 解锁不同的法律知识，影响不同的属性维度
 */
import { create } from 'zustand';
import type {
  GamePhase,
  GameSave,
  Scenario,
  ScenarioChoice,
  CharacterStats,
  StatsEffect,
  Gender,
} from '../lib/shared';
import {
  DEFAULT_STATS,
  generateRandomStats,
  applyStatsEffect,
  clamp,
} from '../lib/shared';

export interface GameStore {
  // 游戏阶段
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // 角色创建
  characterName: string;
  characterGender: Gender;
  characterAge: number;
  characterCountry: string;
  characterRegion: string | null;
  characterStats: CharacterStats;
  setCharacterName: (name: string) => void;
  setCharacterGender: (gender: Gender) => void;
  setCharacterAge: (age: number) => void;
  setCharacterCountry: (code: string) => void;
  setCharacterRegion: (region: string | null) => void;
  randomizeStats: () => void;
  applyStatChange: (effect: StatsEffect) => void;
  resetCharacter: () => void;

  // 当前场景
  currentScenario: Scenario | null;
  currentChoices: ScenarioChoice[];
  /** 分支历史：记录每次选择的链条 */
  choiceChain: { scenarioId: string; choiceId: string; timestamp: number }[];
  setCurrentScenario: (scenario: Scenario, choices: ScenarioChoice[]) => void;
  makeChoice: (choice: ScenarioChoice) => void;
  clearScenario: () => void;

  // 已完成的场景（用于场景去重）
  completedScenarioIds: string[];
  markScenarioCompleted: (scenarioId: string) => void;

  // 法律收集
  collectedLawIds: string[];
  addCollectedLaw: (lawId: string) => void;
  hasCollected: (lawId: string) => boolean;

  // 存档
  currentSave: GameSave | null;
  saveSlots: (GameSave | null)[];
  setCurrentSave: (save: GameSave | null) => void;
  setSaveSlots: (slots: (GameSave | null)[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  phase: 'main_menu',
  setPhase: (phase) => set({ phase }),

  characterName: '',
  characterGender: 'unspecified',
  characterAge: 18,
  characterCountry: 'CN',
  characterRegion: null,
  characterStats: { ...DEFAULT_STATS },

  setCharacterName: (name) => set({ characterName: name }),
  setCharacterGender: (gender) => set({ characterGender: gender }),
  setCharacterAge: (age) => set({ characterAge: clamp(age, 6, 99) }),
  setCharacterCountry: (code) => set({ characterCountry: code, characterRegion: null }),
  setCharacterRegion: (region) => set({ characterRegion: region }),

  randomizeStats: () => set({ characterStats: generateRandomStats(300) }),

  applyStatChange: (effect) =>
    set((state) => ({
      characterStats: applyStatsEffect(state.characterStats, effect),
    })),

  resetCharacter: () =>
    set({
      characterName: '',
      characterGender: 'unspecified',
      characterAge: 18,
      characterStats: { ...DEFAULT_STATS },
      characterCountry: 'CN',
      characterRegion: null,
    }),

  // 场景状态
  currentScenario: null,
  currentChoices: [],
  choiceChain: [],

  setCurrentScenario: (scenario, choices) =>
    set({
      currentScenario: scenario,
      currentChoices: choices,
      phase: 'scenario_active',
    }),

  /** 做出选择 → 记录分支链，应用属性变化，解锁法律知识 */
  makeChoice: (choice) =>
    set((state) => {
      const newChain = [
        ...state.choiceChain,
        {
          scenarioId: state.currentScenario?.id ?? '',
          choiceId: choice.id,
          timestamp: Date.now(),
        },
      ];

      const newStats = applyStatsEffect(state.characterStats, choice.statsEffect);

      // 从 legalOutcome 中提取解锁的法条 ID
      // 实际项目中，这些 ID 会从后端返回
      const revealedLawIds: string[] = [];

      return {
        choiceChain: newChain,
        characterStats: newStats,
        collectedLawIds: [
          ...state.collectedLawIds,
          ...revealedLawIds.filter((id) => !state.collectedLawIds.includes(id)),
        ],
        phase: 'scenario_result',
      };
    }),

  clearScenario: () =>
    set({
      currentScenario: null,
      currentChoices: [],
    }),

  completedScenarioIds: [],
  markScenarioCompleted: (scenarioId) =>
    set((state) => ({
      completedScenarioIds: state.completedScenarioIds.includes(scenarioId)
        ? state.completedScenarioIds
        : [...state.completedScenarioIds, scenarioId],
    })),

  // 法律收集
  collectedLawIds: [],
  addCollectedLaw: (lawId) =>
    set((state) => ({
      collectedLawIds: state.collectedLawIds.includes(lawId)
        ? state.collectedLawIds
        : [...state.collectedLawIds, lawId],
    })),
  hasCollected: (lawId) => get().collectedLawIds.includes(lawId),

  // 存档
  currentSave: null,
  saveSlots: [null, null, null],
  setCurrentSave: (save) => set({ currentSave: save }),
  setSaveSlots: (slots) => set({ saveSlots: slots }),
}));
