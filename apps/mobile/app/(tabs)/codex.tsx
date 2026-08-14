/**
 * 法律图鉴页面 — 展示数据库中的真实法条
 *
 * 数据来源: Supabase laws / law_categories 表（经 lib/api/gameApi.ts）
 * 类型统一用 shared.ts 的 camelCase 类型（gameApi 已做字段映射）。
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { fetchCountries, fetchLawCategories, fetchLaws } from '../../lib/api/gameApi';
import { useGameStore } from '../../stores/gameStore';
import type { Law, LawCategory } from '../../lib/shared';

export default function CodexPage() {
  const { t } = useTranslation();
  const collectedLawIds = useGameStore((s) => s.collectedLawIds);

  const [categories, setCategories] = useState<LawCategory[]>([]);
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedLawId, setExpandedLawId] = useState<string | null>(null);

  // 加载真实数据（图鉴是法律百科，无条件加载，不依赖角色）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 拿 CN 的国家 id
        const countries = await fetchCountries();
        const cn = countries.find((c) => c.code === 'CN');
        if (!cn) throw new Error('未找到中国国家数据');

        // 2. 并行加载分类 + 法条
        const [cats, lawResult] = await Promise.all([
          fetchLawCategories(),
          fetchLaws(cn.id, { pageSize: 200 }),
        ]);

        if (cancelled) return;
        setCategories(cats);
        setLaws(lawResult.laws);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 加载中
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>加载法条中...</Text>
      </View>
    );
  }

  // 加载失败
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>⚠️</Text>
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  // 按分类分组
  const visibleCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory)
    : categories;

  const collectedCount = laws.filter((l) => collectedLawIds.includes(l.id)).length;
  const progressPct = laws.length ? Math.round((collectedCount / laws.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 收集进度 */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>已收集 {collectedCount} / {laws.length} 条</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressText}>点击法条查看原文与解读</Text>
      </View>

      {/* 分类筛选 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === null && styles.categoryActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>
            {t('codex.all')}
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.icon} {cat.name.zh}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 法条列表 */}
      <View style={styles.lawList}>
        {visibleCategories.map((cat) => {
          const catLaws = laws.filter((l) => l.categoryId === cat.id);
          if (catLaws.length === 0) return null;

          return (
            <View key={cat.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryTitle}>{cat.icon} {cat.name.zh}</Text>
                <Text style={styles.categoryCount}>{catLaws.length} 条</Text>
              </View>

              {catLaws.map((law) => {
                const expanded = expandedLawId === law.id;
                const collected = collectedLawIds.includes(law.id);
                return (
                  <TouchableOpacity
                    key={law.id}
                    style={[styles.lawCard, collected && styles.lawCardCollected]}
                    onPress={() => setExpandedLawId(expanded ? null : law.id)}
                  >
                    <View style={styles.lawCardHeader}>
                      <Text style={styles.lawName}>{collected ? '✅ ' : ''}{law.lawName.zh}</Text>
                      <Text style={styles.lawArticle}>{law.articleRef}</Text>
                      <Text style={styles.lawArrow}>{expanded ? '▲' : '▼'}</Text>
                    </View>
                    <Text style={styles.lawTitle}>{law.title.zh}</Text>

                    {expanded && (
                      <View style={styles.lawDetail}>
                        <View style={styles.lawDetailSection}>
                          <Text style={styles.lawDetailLabel}>📜 法条原文</Text>
                          <Text style={styles.lawFullText}>{law.fullText.zh}</Text>
                        </View>
                        <View style={styles.lawDetailSection}>
                          <Text style={styles.lawDetailLabel}>📝 通俗解读</Text>
                          <Text style={styles.lawSummary}>{law.plainSummary.zh}</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  emptyContainer: {
    flex: 1, backgroundColor: '#0f0f1a',
    justifyContent: 'center', alignItems: 'center',
  },
  centerContainer: {
    flex: 1, backgroundColor: '#0f0f1a',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#8b8baa', textAlign: 'center', lineHeight: 24 },
  loadingText: { fontSize: 14, color: '#8b8baa', marginTop: 12 },

  progressSection: { marginBottom: 16 },
  progressTitle: { fontSize: 18, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 8 },
  progressBar: {
    height: 8, backgroundColor: '#2a2a4a',
    borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#e94560', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#8b8baa' },

  categoryRow: { marginBottom: 16, flexGrow: 0 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1a1a2e',
    marginRight: 8, borderWidth: 1, borderColor: '#2a2a4a',
  },
  categoryActive: { borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,0.1)' },
  categoryText: { fontSize: 13, color: '#8b8baa' },
  categoryTextActive: { color: '#e94560', fontWeight: '600' },

  lawList: { gap: 20 },
  categorySection: {},
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 8,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#e0e0e0', flex: 1 },
  categoryCount: { fontSize: 12, color: '#6c6c8a' },

  lawCard: {
    backgroundColor: '#1a1a2e', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  lawCardCollected: { borderColor: 'rgba(52,211,153,0.4)' },
  lawCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 6, gap: 8,
  },
  lawName: { fontSize: 13, color: '#e94560', fontWeight: '600', flex: 1 },
  lawArticle: { fontSize: 13, color: '#fbbf24', fontWeight: '600' },
  lawArrow: { fontSize: 12, color: '#8b8baa' },
  lawTitle: { fontSize: 15, color: '#e0e0e0', fontWeight: '600' },

  lawDetail: { marginTop: 10 },
  lawDetailSection: { marginBottom: 10 },
  lawDetailLabel: { fontSize: 13, fontWeight: 'bold', color: '#fbbf24', marginBottom: 6 },
  lawFullText: { fontSize: 14, color: '#e0e0e0', lineHeight: 22 },
  lawSummary: { fontSize: 14, color: '#d0d0e0', lineHeight: 22 },
});
