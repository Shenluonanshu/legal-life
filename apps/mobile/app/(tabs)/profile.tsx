/**
 * 个人页面 — 设置与信息
 */
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../stores/gameStore';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { characterName, characterAge, characterCountry, collectedLawIds, choiceChain } =
    useGameStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 角色信息 */}
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {characterName ? characterName[0]?.toUpperCase() ?? '?' : '?'}
          </Text>
        </View>
        <Text style={styles.nameText}>{characterName || '未创建角色'}</Text>
        {characterName ? (
          <Text style={styles.infoText}>
            {characterAge} 岁 · 中国
          </Text>
        ) : null}
      </View>

      {/* 统计 */}
      {characterName && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>游戏统计</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>{collectedLawIds.length}</Text>
              <Text style={styles.statDesc}>已收集法条</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>{choiceChain.length}</Text>
              <Text style={styles.statDesc}>做出选择</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statNumber}>{Math.max(0, characterAge - 18)}</Text>
              <Text style={styles.statDesc}>人生年份</Text>
            </View>
          </View>
        </View>
      )}

      {/* 设置 */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>设置</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>🌐</Text>
          <Text style={styles.settingText}>语言 / Language</Text>
          <Text style={styles.settingValue}>中文</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>🔊</Text>
          <Text style={styles.settingText}>音效</Text>
          <Text style={styles.settingValue}>开启</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingIcon}>ℹ️</Text>
          <Text style={styles.settingText}>关于律途人生</Text>
          <Text style={styles.settingValue}>v0.1.0</Text>
        </TouchableOpacity>
      </View>

      {/* 免责声明 */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ 本应用提供的法律信息仅供参考，不构成法律建议。{'\n'}
          如有具体法律问题，请咨询专业律师。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 16, gap: 16 },

  card: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  infoText: { fontSize: 14, color: '#8b8baa' },

  statsCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#2a2a4a',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 16 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statCell: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#e94560' },
  statDesc: { fontSize: 12, color: '#8b8baa', marginTop: 4 },

  settingsCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: '#2a2a4a',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4a',
  },
  settingIcon: { fontSize: 18, marginRight: 12 },
  settingText: { flex: 1, fontSize: 16, color: '#e0e0e0' },
  settingValue: { fontSize: 14, color: '#8b8baa' },

  disclaimer: {
    backgroundColor: 'rgba(233,69,96,0.08)', borderRadius: 12,
    padding: 14, marginTop: 8,
  },
  disclaimerText: { fontSize: 12, color: '#8b8baa', lineHeight: 18, textAlign: 'center' },
});
