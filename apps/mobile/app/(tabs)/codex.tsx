/**
 * 法律图鉴页面 — 展示已收集和未收集的法条
 */
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { LAW_CATEGORIES } from '../../lib/shared';
import { useState } from 'react';

export default function CodexPage() {
  const { t } = useTranslation();
  const { collectedLawIds, characterName } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);

  const hasStarted = characterName !== '';
  const totalCollected = collectedLawIds.length;

  if (!hasStarted) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📖</Text>
        <Text style={styles.emptyText}>{t('codex.empty')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 收集进度 */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>{t('codex.collected')}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(totalCollected * 2, 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{totalCollected} 条</Text>
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
        {LAW_CATEGORIES.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.categoryChip, selectedCategory === idx && styles.categoryActive]}
            onPress={() => setSelectedCategory(idx)}
          >
            <Text style={[styles.categoryText, selectedCategory === idx && styles.categoryTextActive]}>
              {cat.icon} {cat.name.zh}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 法条列表 */}
      <View style={styles.lawList}>
        {LAW_CATEGORIES.filter(
          (_, i) => selectedCategory === null || i === selectedCategory
        ).map((category) => (
          <View key={category.name.zh} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryTitle}>{category.icon} {category.name.zh}</Text>
            </View>

            {/* 示例法条卡片（实际从数据库加载） */}
            <View style={styles.lawPlaceholder}>
              <Text style={styles.lawPlaceholderText}>
                在游戏中遇到相关场景时解锁...
              </Text>
            </View>
          </View>
        ))}
      </View>

      {collectedLawIds.length > 0 && (
        <View style={styles.collectedSection}>
          <Text style={styles.sectionTitle}>已解锁的法条 ({collectedLawIds.length})</Text>
          {collectedLawIds.slice(0, 5).map((id) => (
            <TouchableOpacity
              key={id}
              style={styles.collectedItem}
              onPress={() => setSelectedLaw(selectedLaw === id ? null : id)}
            >
              <Text style={styles.collectedIcon}>✅</Text>
              <View style={styles.collectedInfo}>
                <Text style={styles.collectedName}>法条 #{id.slice(0, 8)}</Text>
                <Text style={styles.collectedDesc}>在场景中发现</Text>
              </View>
              <Text style={styles.collectedArrow}>{selectedLaw === id ? '▼' : '▶'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#8b8baa' },

  progressSection: { marginBottom: 16 },
  progressTitle: { fontSize: 14, color: '#8b8baa', marginBottom: 8 },
  progressBar: {
    height: 8, backgroundColor: '#2a2a4a',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#e94560', borderRadius: 4,
  },
  progressText: { fontSize: 13, color: '#e94560', marginTop: 4, textAlign: 'right' },

  categoryRow: { marginBottom: 16, flexGrow: 0 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1a1a2e',
    marginRight: 8, borderWidth: 1, borderColor: '#2a2a4a',
  },
  categoryActive: { borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,0.1)' },
  categoryText: { fontSize: 13, color: '#8b8baa' },
  categoryTextActive: { color: '#e94560', fontWeight: '600' },

  lawList: { gap: 16 },
  categorySection: { marginBottom: 4 },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, gap: 8,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#e0e0e0' },
  lawPlaceholder: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 16, borderWidth: 1, borderColor: '#2a2a4a',
    borderStyle: 'dashed',
  },
  lawPlaceholderText: { fontSize: 14, color: '#6c6c8a', textAlign: 'center', fontStyle: 'italic' },

  collectedSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 12 },
  collectedItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  collectedIcon: { fontSize: 18, marginRight: 12 },
  collectedInfo: { flex: 1 },
  collectedName: { fontSize: 15, fontWeight: '600', color: '#e0e0e0' },
  collectedDesc: { fontSize: 12, color: '#6c6c8a', marginTop: 2 },
  collectedArrow: { fontSize: 14, color: '#8b8baa' },
});
