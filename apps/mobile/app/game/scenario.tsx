/**
 * 场景玩法页面 — 游戏核心循环
 *
 * 流程:
 * 1. 展示场景叙述（文字剧情 + AI 场景图）
 * 2. 玩家从 2-4 个选项中做出选择
 * 3. ★ 不同选择导向不同的人生分支 ★
 * 4. 展示后果 + 相关法律知识揭示
 * 5. 属性变化 + 年龄推进 → 继续下一个场景
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { STAT_NAMES, applyStatsEffect } from '../../lib/shared';
import type { CharacterStats, StatsEffect } from '../../lib/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------- 模拟场景数据（实际从 Supabase 加载）----------

interface MockScenario {
  id: string;
  title: string;
  narrative: string;
  imagePrompt: string;
  choices: MockChoice[];
}

interface MockChoice {
  id: string;
  text: string;
  statsEffect: StatsEffect;
  consequenceText: string;
  isLegalCorrect: boolean;
  legalReveal: {
    lawTitle: string;
    articleRef: string;
    summary: string;
    tip: string;
  } | null;
  /** 分支标签：此选择会导向的人生方向 */
  branchTag: string;
}

const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'cn-job-001',
    title: '入职第一天',
    narrative: `今天是你在新公司入职的第一天，心情既兴奋又紧张。\n\nHR 递给你一份厚厚的劳动合同，催促你"快签了吧，大家都一样"。\n\n你翻开合同，发现里面写着试用期 6 个月，但合同期限只写了 1 年。旁边的新同事小声说："我上次就是没看合同，吃了大亏..."\n\n你该怎么办？`,
    imagePrompt: 'A young person sitting at a desk in a modern office, holding a pen, looking at a contract, warm lighting, cinematic',
    choices: [
      {
        id: 'a',
        text: '仔细阅读每一条款，发现试用期不合规，礼貌地指出并要求修改',
        statsEffect: { legalAwareness: 15, knowledge: 5, happiness: 5 },
        consequenceText: 'HR 有些惊讶，但重新打印了合规的合同。你不仅保护了自己的权益，还赢得了同事的尊重。',
        isLegalCorrect: true,
        legalReveal: {
          lawTitle: '劳动合同法',
          articleRef: '第19条',
          summary: '合同期限1年以上不满3年的，试用期不得超过2个月。公司约定6个月试用期是违法的。',
          tip: '现实中遇到这种情况，可以礼貌地指出法条，一般正规公司会立即纠正。如果公司拒绝改正...也许考虑换个雇主。',
        },
        branchTag: '维权达人',
      },
      {
        id: 'b',
        text: '觉得大家都签了应该没问题，直接签字',
        statsEffect: { wealth: 10, happiness: -5, legalAwareness: -5 },
        consequenceText: '你顺利入职了。但3个月后，公司以"试用期不合格"为由延长了你的试用期...',
        isLegalCorrect: false,
        legalReveal: {
          lawTitle: '劳动合同法',
          articleRef: '第19条',
          summary: '同一用人单位与同一劳动者只能约定一次试用期。公司不能随意延长试用期。',
          tip: '不仔细看合同的后果可能几个月后才显现——但为时已晚。记住：签任何文件前都要仔细阅读。',
        },
        branchTag: '随波逐流',
      },
      {
        id: 'c',
        text: '偷偷拍下合同内容，准备回家研究后再签',
        statsEffect: { knowledge: 8, wealth: -5, legalAwareness: 10 },
        consequenceText: 'HR 同意你带回去看。你查到试用期确实违规，第二天带着法条回去谈判，成功修改了合同。',
        isLegalCorrect: true,
        legalReveal: {
          lawTitle: '劳动合同法',
          articleRef: '第10条',
          summary: '已建立劳动关系但未签合同的，应自用工之日起1个月内签订书面合同。',
          tip: '你有权要求充分时间审阅合同。如果公司不给时间——这本身就是红旗信号。',
        },
        branchTag: '谨慎策略',
      },
    ],
  },
  {
    id: 'cn-shop-001',
    title: '网购纠纷',
    narrative: `你在网上花 800 元买了一件羽绒服，收到后发现是明显的假货——充绒量严重不足，标签也是伪造的。\n\n你联系商家要求退货退款，商家说"特价商品概不退换"，然后就不再回复你了。\n\n你的朋友说："算了吧，800块就当买教训了。" 但你不甘心...`,
    imagePrompt: 'A person looking at a low-quality jacket with disappointment, smartphone showing a shopping app, modern Chinese apartment, warm evening light',
    choices: [
      {
        id: 'a',
        text: '收集证据（订单截图、聊天记录、商品照片），向平台投诉并告知"退一赔三"',
        statsEffect: { legalAwareness: 20, wealth: 15, knowledge: 10, happiness: 10 },
        consequenceText: '平台介入后，核实商家存在欺诈行为，不仅退了 800 元，还赔偿了 2400 元！你用自己的法律知识赢得了胜利。',
        isLegalCorrect: true,
        legalReveal: {
          lawTitle: '消费者权益保护法',
          articleRef: '第55条',
          summary: '经营者有欺诈行为的，应退一赔三。增加赔偿金额不足500元的，赔500元。',
          tip: '"退一赔三"是中国消费者保护法中最有力的武器之一。遇到欺诈不要忍气吞声，法律站在你这边。',
        },
        branchTag: '维权斗士',
      },
      {
        id: 'b',
        text: '算了，800块不多，就当买教训了',
        statsEffect: { wealth: -5, happiness: -10, legalAwareness: -5 },
        consequenceText: '你放弃了维权。虽然省了麻烦，但每次想起这件事心里都不舒服。那个商家继续欺骗其他消费者...',
        isLegalCorrect: false,
        legalReveal: {
          lawTitle: '消费者权益保护法',
          articleRef: '第55条',
          summary: '即使损失金额不大，法律也赋予了消费者三倍赔偿的权利。沉默只会纵容更多欺诈。',
          tip: '有时候维权不是为了那几百块钱，而是为了维护市场秩序和自己的尊严。',
        },
        branchTag: '忍气吞声',
      },
      {
        id: 'c',
        text: '在社交媒体曝光商家，号召大家抵制',
        statsEffect: { happiness: 5, legalAwareness: 8, knowledge: 3 },
        consequenceText: '你的帖子引起了很多人的共鸣，商家迫于舆论压力主动退款。不过要小心：曝光要实事求是，不能夸大和虚构。',
        isLegalCorrect: true,
        legalReveal: {
          lawTitle: '民法典',
          articleRef: '第1024条',
          summary: '任何组织或个人不得以侮辱、诽谤等方式侵害他人的名誉权。曝光维权要基于事实，不能捏造。',
          tip: '社交媒体维权是双刃剑——有效但需谨慎。最好的方式是：事实陈述 + 平台投诉 + 12315举报三管齐下。',
        },
        branchTag: '舆论力量',
      },
    ],
  },
];

// ---------- 组件 ----------

type PageState = 'narrative' | 'choosing' | 'result';

export default function ScenarioPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useGameStore();

  const [pageState, setPageState] = useState<PageState>('narrative');
  const [selectedChoice, setSelectedChoice] = useState<MockChoice | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  // 随机选取一个场景（实际项目中根据角色状态从后端获取）
  const scenario = useMemo(() => {
    const idx = Math.floor(Math.random() * MOCK_SCENARIOS.length);
    return MOCK_SCENARIOS[idx]!;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [pageState]);

  // 做出选择
  const handleChoice = (choice: MockChoice) => {
    setSelectedChoice(choice);
    setPageState('result');

    // 应用属性变化
    store.applyStatChange(choice.statsEffect);

    // 记录分支选择到历史
    store.makeChoice({
      id: choice.id,
      scenarioId: scenario.id,
      choiceText: { zh: choice.text, en: choice.text },
      consequenceText: { zh: choice.consequenceText, en: choice.consequenceText },
      statsEffect: choice.statsEffect,
      legalOutcome: choice.legalReveal
        ? { zh: choice.legalReveal.summary, en: choice.legalReveal.summary }
        : null,
      isLegallyCorrect: choice.isLegalCorrect,
      isBestEnding: choice.isLegalCorrect,
      sortOrder: 0,
    });

    // 延迟动画
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  };

  // 继续下一个场景
  const handleContinue = () => {
    router.push('/journey');
  };

  // ======== 场景叙述阶段 ========
  if (pageState === 'narrative') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* AI 场景图占位 */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderEmoji}>🎬</Text>
            <Text style={styles.imagePlaceholderText}>AI 场景图片</Text>
            <Text style={styles.imagePlaceholderHint}>{scenario.imagePrompt.substring(0, 50)}...</Text>
          </View>

          {/* 场景标题 */}
          <Text style={styles.scenarioTitle}>{scenario.title}</Text>

          {/* 场景叙述 */}
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeText}>{scenario.narrative}</Text>
          </View>

          {/* 进入选择 */}
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => {
              setPageState('choosing');
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }).start();
              });
            }}
          >
            <Text style={styles.proceedButtonText}>面对选择 →</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    );
  }

  // ======== 选择阶段 ========
  if (pageState === 'choosing') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.chooseTitle}>{t('scenario.makeChoice')}</Text>
          <Text style={styles.chooseSubtitle}>你的选择将影响人生的走向</Text>

          <View style={styles.choicesContainer}>
            {scenario.choices.map((choice, idx) => (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceCard,
                  choice.isLegalCorrect ? styles.choiceCardLegal : styles.choiceCardRisky,
                ]}
                onPress={() => handleChoice(choice)}
              >
                <View style={styles.choiceHeader}>
                  <Text style={styles.choiceLetter}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                  <Text style={styles.choiceBranchTag}>{choice.branchTag}</Text>
                </View>
                <Text style={styles.choiceText}>{choice.text}</Text>
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
        </Animated.View>
      </ScrollView>
    );
  }

  // ======== 结果阶段 ========
  if (pageState === 'result' && selectedChoice) {
    const { legalReveal, consequenceText, statsEffect, isLegalCorrect, branchTag } =
      selectedChoice;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* 分支标签 */}
          <View style={[styles.branchBadge, isLegalCorrect ? styles.branchLegal : styles.branchRisky]}>
            <Text style={styles.branchBadgeText}>
              {isLegalCorrect ? '✅' : '⚠️'} {branchTag}
            </Text>
          </View>

          {/* 后果叙述 */}
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t('scenario.consequence')}</Text>
            <Text style={styles.resultText}>{consequenceText}</Text>
          </View>

          {/* 属性变化 */}
          <View style={styles.statsChangeCard}>
            <Text style={styles.sectionLabel}>{t('scenario.statsChange')}</Text>
            <View style={styles.statsChangeRow}>
              {Object.entries(statsEffect)
                .filter(([, v]) => v !== 0)
                .map(([key, val]) => {
                  const info = STAT_NAMES[key as keyof CharacterStats];
                  const isPositive = (val ?? 0) > 0;
                  return (
                    <View key={key} style={styles.statChangeItem}>
                      <Text style={styles.statChangeIcon}>{info?.icon}</Text>
                      <Text
                        style={[styles.statChangeValue, isPositive ? styles.textPositive : styles.textNegative]}
                      >
                        {isPositive ? '+' : ''}{val}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>

          {/* ★ 法律知识揭示 —— 核心教育环节 ★ */}
          {legalReveal && (
            <View style={styles.legalCard}>
              <View style={styles.legalHeader}>
                <Text style={styles.legalIcon}>⚖️</Text>
                <View style={styles.legalHeaderText}>
                  <Text style={styles.legalTitle}>{t('scenario.legalReveal')}</Text>
                  <Text style={styles.legalRef}>
                    《{legalReveal.lawTitle}》{legalReveal.articleRef}
                  </Text>
                </View>
              </View>

              <View style={styles.legalSummaryBox}>
                <Text style={styles.legalSummaryLabel}>📝 法条解读</Text>
                <Text style={styles.legalSummaryText}>{legalReveal.summary}</Text>
              </View>

              <View style={styles.legalTipBox}>
                <Text style={styles.legalTipLabel}>💡 生活小贴士</Text>
                <Text style={styles.legalTipText}>{legalReveal.tip}</Text>
              </View>

              <TouchableOpacity style={styles.viewLawButton}>
                <Text style={styles.viewLawText}>📜 {t('scenario.viewFullLaw')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 继续按钮 */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {t('scenario.continue')} →
            </Text>
            <Text style={styles.continueSubtext}>年龄推进 1-2 年，迎接下一个场景</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 16 },

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
  narrativeText: {
    fontSize: 16, color: '#d0d0e0', lineHeight: 26,
  },

  // 进入选择按钮
  proceedButton: {
    backgroundColor: '#e94560', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
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
  choiceBranchTag: {
    fontSize: 12, color: '#8b8baa', fontStyle: 'italic',
    backgroundColor: '#2a2a4a', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
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

  // 法律知识卡片 — 核心
  legalCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, marginBottom: 16,
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
  legalSummaryBox: {
    backgroundColor: 'rgba(233,69,96,0.08)', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  legalSummaryLabel: { fontSize: 13, fontWeight: 'bold', color: '#e94560', marginBottom: 6 },
  legalSummaryText: { fontSize: 14, color: '#d0d0e0', lineHeight: 22 },
  legalTipBox: {
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 10,
    padding: 14, marginBottom: 12,
  },
  legalTipLabel: { fontSize: 13, fontWeight: 'bold', color: '#fbbf24', marginBottom: 6 },
  legalTipText: { fontSize: 14, color: '#d0d0e0', lineHeight: 22 },
  viewLawButton: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#e94560',
  },
  viewLawText: { fontSize: 14, color: '#e94560', fontWeight: '600' },

  // 继续
  continueButton: {
    backgroundColor: '#e94560', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  continueSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
});
