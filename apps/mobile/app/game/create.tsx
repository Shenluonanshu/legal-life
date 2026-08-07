/**
 * 角色创建页面
 *
 * 创建角色 → 选择国家/地区 → 分配属性 → 开始游戏
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useGameStore } from '../../stores/gameStore';
import { COUNTRIES, DEFAULT_COUNTRY, STAT_NAMES, generateRandomStats } from '../../lib/shared';
import type { CharacterStats, Gender } from '../../lib/shared';

export default function CreateCharacterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useGameStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [stats, setStats] = useState<CharacterStats>({
    health: 60,
    wealth: 60,
    knowledge: 60,
    happiness: 60,
    legalAwareness: 60,
  });

  const totalPoints = Object.values(stats).reduce((a, b) => a + b, 0);
  const maxPoints = 300;

  const adjustStat = (key: keyof CharacterStats, delta: number) => {
    setStats((prev) => {
      const newValue = Math.max(0, Math.min(100, prev[key] + delta));
      const newStats = { ...prev, [key]: newValue };
      const newTotal = Object.values(newStats).reduce((a, b) => a + b, 0);
      if (newTotal > maxPoints) return prev; // 不能超过总点数
      return newStats;
    });
  };

  const handleRandomize = () => {
    setStats(generateRandomStats(maxPoints));
  };

  const handleStart = () => {
    if (!name.trim()) return;

    store.setCharacterName(name.trim());
    store.setCharacterGender(gender);
    store.setCharacterAge(18);
    store.setCharacterCountry(country);

    // 应用手动分配的属性
    Object.entries(stats).forEach(([key, value]) => {
      store.applyStatChange({ [key]: value - 60 } as Partial<CharacterStats>);
    });

    store.setPhase('playing');
    router.replace('/journey');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 角色名 */}
      <Text style={styles.label}>{t('character.name')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('character.namePlaceholder')}
        placeholderTextColor="#6c6c8a"
        maxLength={12}
      />

      {/* 性别 */}
      <Text style={styles.label}>{t('character.gender')}</Text>
      <View style={styles.genderRow}>
        {(['male', 'female'] as Gender[]).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderButton, gender === g && styles.genderActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
              {g === 'male' ? '👨 男' : '👩 女'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 国家选择 */}
      <Text style={styles.label}>{t('character.country')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryRow}>
        {COUNTRIES.filter((c) => c.isActive).map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.countryButton, country === c.code && styles.countryActive]}
            onPress={() => setCountry(c.code)}
          >
            <Text style={[styles.countryText, country === c.code && styles.countryTextActive]}>
              {c.name.zh}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 属性分配 */}
      <View style={styles.statsSection}>
        <View style={styles.statsHeader}>
          <Text style={styles.label}>{t('character.stats')}</Text>
          <View style={styles.pointsInfo}>
            <Text style={[styles.pointsText, totalPoints > maxPoints && styles.pointsOver]}>
              {totalPoints} / {maxPoints}
            </Text>
            <TouchableOpacity style={styles.randomButton} onPress={handleRandomize}>
              <Text style={styles.randomText}>🎲 {t('character.randomize')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {Object.entries(stats).map(([key, value]) => {
          const statKey = key as keyof CharacterStats;
          const info = STAT_NAMES[statKey];
          return (
            <View key={key} style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={styles.statName}>{info.icon} {info.zh}</Text>
                <Text style={styles.statValue}>{value}</Text>
              </View>
              <View style={styles.statControl}>
                <TouchableOpacity
                  style={styles.statButton}
                  onPress={() => adjustStat(statKey, -5)}
                  disabled={value <= 0}
                >
                  <Text style={styles.statButtonText}>−5</Text>
                </TouchableOpacity>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${value}%` }]} />
                </View>
                <TouchableOpacity
                  style={styles.statButton}
                  onPress={() => adjustStat(statKey, 5)}
                  disabled={totalPoints >= maxPoints}
                >
                  <Text style={styles.statButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* 开始按钮 */}
      <TouchableOpacity
        style={[styles.startButton, !name.trim() && styles.startButtonDisabled]}
        onPress={handleStart}
        disabled={!name.trim()}
      >
        <Text style={styles.startButtonText}>🚀 {t('character.startGame')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20, paddingBottom: 40, gap: 8 },

  label: { fontSize: 16, fontWeight: '600', color: '#e0e0e0', marginTop: 8, marginBottom: 4 },

  input: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#ffffff',
    borderWidth: 1, borderColor: '#2a2a4a',
  },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderButton: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#1a1a2e', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  genderActive: { borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,0.1)' },
  genderText: { fontSize: 16, color: '#8b8baa' },
  genderTextActive: { color: '#e94560', fontWeight: 'bold' },

  countryRow: { marginTop: 4, flexGrow: 0 },
  countryButton: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#1a1a2e',
    marginRight: 8, borderWidth: 1, borderColor: '#2a2a4a',
  },
  countryActive: { borderColor: '#e94560', backgroundColor: 'rgba(233,69,96,0.1)' },
  countryText: { fontSize: 14, color: '#8b8baa' },
  countryTextActive: { color: '#e94560', fontWeight: 'bold' },

  statsSection: { marginTop: 12 },
  statsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  pointsInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointsText: { fontSize: 14, fontWeight: 'bold', color: '#e94560' },
  pointsOver: { color: '#ef4444' },
  randomButton: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, backgroundColor: '#2a2a4a',
  },
  randomText: { fontSize: 13, color: '#c0c0d0' },
  statItem: { marginBottom: 12 },
  statHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 6,
  },
  statName: { fontSize: 14, color: '#e0e0e0' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#e94560' },
  statControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2a2a4a', justifyContent: 'center', alignItems: 'center',
  },
  statButtonText: { fontSize: 16, fontWeight: 'bold', color: '#c0c0d0' },
  statBar: {
    flex: 1, height: 10, backgroundColor: '#2a2a4a',
    borderRadius: 5, overflow: 'hidden',
  },
  statFill: { height: '100%', backgroundColor: '#e94560', borderRadius: 5 },

  startButton: {
    backgroundColor: '#e94560', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 20,
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
});
