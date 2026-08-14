/**
 * 场景玩法页面 — 游戏核心循环（真实数据版）
 *
 * 流程:
 * 1. 从 Supabase 加载符合角色年龄的已发布场景，随机选一个
 * 2. 展示场景叙述 + 选项
 * 3. 玩家做出选择 → 展示后果 + 关联法条原文/解读
 * 4. 属性变化 + 法条收集 → 继续
 *
 * 类型统一用 shared.ts 的 camelCase 类型（gameApi 已做字段映射）。
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { STAT_NAMES } from '../../lib/shared';
import type { CharacterStats, Scenario, ScenarioChoice, Law } from '../../lib/shared';
import {
  fetchCountries,
  fetchScenarios,
  fetchScenarioFull,
  fetchLawDetail,
} from '../../lib/api/gameApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 难度 → 年龄推进年数（整数，保持年龄为整数）
const AGE_ADVANCE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 };

// ---------- 组件 ----------

type PageState = 'narrative' | 'choosing' | 'result';

export default function ScenarioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const characterAge = useGameStore((s) => s.characterAge);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const addCollectedLaw = useGameStore((s) => s.addCollectedLaw);
  const applyStatChange = useGameStore((s) => s.applyStatChange);
  const completedScenarioIds = useGameStore((s) => s.completedScenarioIds);
  const markScenarioCompleted = useGameStore((s) => s.markScenarioCompleted);
  const setCharacterAge = useGameStore((s) => s.setCharacterAge);

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [choices, setChoices] = useState<ScenarioChoice[]>([]);
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const [pageState, setPageState] = useState<PageState>('narrative');
  const [selectedChoice, setSelectedChoice] = useState<ScenarioChoice | null>(null);

  // 加载真实场景
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setFinished(false);

        // 1. 拿 CN 的国家 id
        const countries = await fetchCountries();
        const cn = countries.find((c) => c.code === 'CN');
        if (!cn) throw new Error('未找到中国国家数据');

        // 2. 加载全部已发布场景
        const allScenarios = await fetchScenarios({ countryId: cn.id, limit: 50 });

        // 3. 按年龄宽松过滤 + 排除已完成
        const eligible = allScenarios.filter((s) => {
          if (s.minAge != null && characterAge < s.minAge) return false;
          if (s.maxAge != null && characterAge > s.maxAge) return false;
          if (completedScenarioIds.includes(s.id)) return false;
          return true;
        });

        if (eligible.length === 0) {
          if (cancelled) return;
          // 全部场景已玩完：友好空态而非报错
          setScenario(null);
          setFinished(true);
          return;
        }

        // 4. 随机选一个
        const picked = eligible[Math.floor(Math.random() * eligible.length)]!;

        // 5. 加载场景完整数据（选项 + 关联法条）
        const full = await fetchScenarioFull(picked.id);
        if (!full) throw new Error('场景详情加载失败');

        // 6. 加载关联法条原文
        const lawRows = (await Promise.all(
          full.linkedLawIds.map((id) => fetchLawDetail(id))
        )).filter((l): l is Law => l !== null);

        if (cancelled) return;

        setScenario(full.scenario);
        setChoices(full.choices);
        setLaws(lawRows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '场景加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterAge]);

  // 做出选择
  const handleChoice = (choice: ScenarioChoice) => {
    setSelectedChoice(choice);
    setPageState('result');

    // 应用属性变化
    applyStatChange(choice.statsEffect);

    // 记录选择到 store
    makeChoice(choice);

    // 收集该场景关联的法条
    laws.forEach((l) => addCollectedLaw(l.id));

    // 标记场景已完成 + 推进年龄
    if (scenario) {
      markScenarioCompleted(scenario.id);
      const years = AGE_ADVANCE[scenario.difficulty] ?? 1;
      setCharacterAge(characterAge + years);
    }
  };

  // 继续
  const handleContinue = () => {
    router.push('/journey');
  };

  // 加载中
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>正在加载生活场景...</Text>
      </View>
    );
  }

  // 全部场景已玩完（友好空态）
  if (finished) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>🎉</Text>
        <Text style={styles.errorText}>人生旅程告一段落</Text>
        <Text style={styles.finishedSubtext}>继续成长，迎接新的人生阶段</Text>
        <TouchableOpacity style={styles.proceedButton} onPress={() => router.back()}>
          <Text style={styles.proceedButtonText}>返回旅程</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 加载失败
  if (error || !scenario) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error ?? '场景加载失败'}</Text>
        <TouchableOpacity style={styles.proceedButton} onPress={() => router.back()}>
          <Text style={styles.proceedButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ======== 场景叙述阶段 ========
  if (pageState === 'narrative') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* AI 场景图占位 */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderEmoji}>🎬</Text>
            <Text style={styles.imagePlaceholderText}>AI 场景图片</Text>
            {scenario.imagePrompt ? (
              <Text style={styles.imagePlaceholderHint}>
                {scenario.imagePrompt.substring(0, 50)}...
              </Text>
            ) : null}
          </View>

          {/* 场景标题 */}
          <Text style={styles.scenarioTitle}>{scenario.title.zh}</Text>

          {/* 场景叙述 */}
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeText}>{scenario.narrative.zh}</Text>
          </View>

          {/* 进入选择 */}
          <TouchableOpacity style={styles.proceedButton} onPress={() => setPageState('choosing')}>
            <Text style={styles.proceedButtonText}>面对选择 →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ======== 选择阶段 ========
  if (pageState === 'choosing') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.chooseTitle}>{t('scenario.makeChoice')}</Text>
          <Text style={styles.chooseSubtitle}>你的选择将影响人生的走向</Text>

          <View style={styles.choicesContainer}>
            {choices.map((choice, idx) => (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceCard,
                  choice.isLegallyCorrect ? styles.choiceCardLegal : styles.choiceCardRisky,
                ]}
                onPress={() => handleChoice(choice)}
              >
                <View style={styles.choiceHeader}>
                  <Text style={styles.choiceLetter}>{String.fromCharCode(65 + idx)}</Text>
                </View>
                <Text style={styles.choiceText}>{choice.choiceText.zh}</Text>
                <View style={styles.choiceEffects}>
                  {Object.entries(choice.statsEffect).map(([key, val]) => {
                    const info = STAT_NAMES[key as keyof CharacterStats];
                    const isPositive = (val ?? 0) > 0;
                    return (
                      <Text
                        key={key}
                        style={[styles.effectBadge, isPositive ? styles.effectPositive : styles.effectNegative]}
                      >
                        {info?.icon} {isPositive ? '+' : ''}{val}
                      </Text>
                    );
                  })}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // ======== 结果阶段 ========
  if (pageState === 'result' && selectedChoice) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 结果标签 */}
          <View style={[styles.branchBadge, selectedChoice.isLegallyCorrect ? styles.branchLegal : styles.branchRisky]}>
            <Text style={styles.branchBadgeText}>
              {selectedChoice.isLegallyCorrect ? '✅ 合法选择' : '⚠️ 有风险的选择'}
            </Text>
          </View>

          {/* 后果叙述 */}
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t('scenario.consequence')}</Text>
            <Text style={styles.resultText}>{selectedChoice.consequenceText.zh}</Text>
          </View>

          {/* 属性变化 */}
          <View style={styles.statsChangeCard}>
            <Text style={styles.sectionLabel}>{t('scenario.statsChange')}</Text>
            <View style={styles.statsChangeRow}>
              {Object.entries(selectedChoice.statsEffect)
                .filter(([, v]) => v !== 0)
                .map(([key, val]) => {
                  const info = STAT_NAMES[key as keyof CharacterStats];
                  const isPositive = (val ?? 0) > 0;
                  return (
                    <View key={key} style={styles.statChangeItem}>
                      <Text style={styles.statChangeIcon}>{info?.icon}</Text>
                      <Text style={[styles.statChangeValue, isPositive ? styles.textPositive : styles.textNegative]}>
                        {isPositive ? '+' : ''}{val}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>

          {/* ★ 关联法条 —— 核心教育环节 ★ */}
          {laws.length > 0 && (
            <View style={styles.legalSection}>
              <Text style={styles.legalSectionTitle}>⚖️ 相关法律知识</Text>
              {laws.map((law) => (
                <View key={law.id} style={styles.legalCard}>
                  <View style={styles.legalHeader}>
                    <Text style={styles.legalIcon}>⚖️</Text>
                    <View style={styles.legalHeaderText}>
                      <Text style={styles.legalTitle}>{law.lawName.zh}</Text>
                      <Text style={styles.legalRef}>{law.articleRef}</Text>
                    </View>
                  </View>
                  <View style={styles.legalBody}>
                    <Text style={styles.legalBodyLabel}>📜 法条原文</Text>
                    <Text style={styles.legalBodyText}>{law.fullText.zh}</Text>
                  </View>
                  <View style={styles.legalBody}>
                    <Text style={styles.legalBodyLabel}>📝 通俗解读</Text>
                    <Text style={styles.legalBodyText}>{law.plainSummary.zh}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 继续按钮 */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>{t('scenario.continue')} →</Text>
            <Text style={styles.continueSubtext}>
              时光流逝 {AGE_ADVANCE[scenario.difficulty] ?? 1} 年，迎接下一个生活场景
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 16 },

  centerContainer: {
    flex: 1, backgroundColor: '#0f0f1a',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  loadingText: { fontSize: 14, color: '#8b8baa', marginTop: 12 },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#8b8baa', textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  finishedSubtext: { fontSize: 13, color: '#6c6c8a', textAlign: 'center', marginBottom: 20 },

  // 图片占位
  imagePlaceholder: {
    width: '100%', height: 200,
    backgroundColor: '#1a1a2e', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a4a',
    marginBottom: 16,
  },
  imagePlaceholderEmoji: { fontSize: 48, marginBottom: 8 },
  imagePlaceholderText: { fontSize: 16, color: '#8b8baa', fontWeight: '600' },
  imagePlaceholderHint: { fontSize: 11, color: '#6c6c8a', marginTop: 4, paddingHorizontal: 20, textAlign: 'center' },

  // 场景标题
  scenarioTitle: {
    fontSize: 26, fontWeight: 'bold', color: '#ffffff',
    marginBottom: 16, textAlign: 'center',
  },

  // 叙述卡片
  narrativeCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#2a2a4a',
    marginBottom: 24,
  },
  narrativeText: { fontSize: 16, color: '#d0d0e0', lineHeight: 26 },

  // 进入选择按钮
  proceedButton: {
    backgroundColor: '#e94560', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center', paddingHorizontal: 24,
  },
  proceedButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },

  // 选择标题
  chooseTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#ffffff',
    textAlign: 'center', marginBottom: 8,
  },
  chooseSubtitle: {
    fontSize: 14, color: '#8b8baa', textAlign: 'center',
    marginBottom: 24, fontStyle: 'italic',
  },

  // 选择卡片
  choicesContainer: { gap: 14 },
  choiceCard: {
    borderRadius: 16, padding: 18,
    borderWidth: 1.5, marginBottom: 4,
  },
  choiceCardLegal: { backgroundColor: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.3)' },
  choiceCardRisky: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' },
  choiceHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  choiceLetter: {
    fontSize: 18, fontWeight: 'bold', color: '#e94560',
    backgroundColor: 'rgba(233,69,96,0.15)', width: 32, height: 32,
    borderRadius: 16, textAlign: 'center', lineHeight: 32, overflow: 'hidden',
  },
  choiceText: { fontSize: 15, color: '#e0e0e0', lineHeight: 22, marginBottom: 12 },
  choiceEffects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effectBadge: {
    fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  effectPositive: { backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' },
  effectNegative: { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' },

  // 结果
  branchBadge: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 16,
  },
  branchLegal: { backgroundColor: 'rgba(52,211,153,0.15)' },
  branchRisky: { backgroundColor: 'rgba(239,68,68,0.12)' },
  branchBadgeText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

  resultCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  resultTitle: { fontSize: 14, color: '#8b8baa', marginBottom: 8, textTransform: 'uppercase' },
  resultText: { fontSize: 16, color: '#d0d0e0', lineHeight: 24 },

  // 属性变化
  statsChangeCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  sectionLabel: { fontSize: 13, color: '#8b8baa', marginBottom: 10, textTransform: 'uppercase' },
  statsChangeRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10 },
  statChangeItem: { alignItems: 'center', minWidth: 50 },
  statChangeIcon: { fontSize: 18, marginBottom: 4 },
  statChangeValue: { fontSize: 16, fontWeight: 'bold' },
  textPositive: { color: '#34d399' },
  textNegative: { color: '#ef4444' },

  // 关联法条 — 核心
  legalSection: { marginBottom: 16 },
  legalSectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#e94560',
    marginBottom: 12,
  },
  legalCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, marginBottom: 12,
    borderWidth: 2, borderColor: '#e94560',
  },
  legalHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 10,
  },
  legalIcon: { fontSize: 28 },
  legalHeaderText: { flex: 1 },
  legalTitle: { fontSize: 18, fontWeight: 'bold', color: '#e94560' },
  legalRef: { fontSize: 14, color: '#8b8baa', marginTop: 2 },
  legalBody: { marginBottom: 12 },
  legalBodyLabel: { fontSize: 13, fontWeight: 'bold', color: '#fbbf24', marginBottom: 6 },
  legalBodyText: { fontSize: 14, color: '#d0d0e0', lineHeight: 22 },

  // 继续
  continueButton: {
    backgroundColor: '#e94560', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  continueSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
});
