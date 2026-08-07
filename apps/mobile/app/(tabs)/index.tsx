/**
 * 首页 — 游戏主菜单
 */
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useGameStore } from '../../stores/gameStore';

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { phase, currentSave, characterName, characterStats } = useGameStore();

  const hasActiveGame = phase !== 'main_menu' && characterName !== '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 标题区域 */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⚖️</Text>
        <Text style={styles.heroTitle}>{t('app.name')}</Text>
        <Text style={styles.heroTagline}>{t('app.tagline')}</Text>
      </View>

      {/* 当前角色状态 */}
      {hasActiveGame && (
        <View style={styles.characterCard}>
          <Text style={styles.characterName}>{characterName}</Text>
          <View style={styles.statsRow}>
            {Object.entries(characterStats).map(([key, value]) => (
              <View key={key} style={styles.statItem}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>
                  {key === 'health' ? '🏥' :
                   key === 'wealth' ? '💰' :
                   key === 'knowledge' ? '📚' :
                   key === 'happiness' ? '😊' : '⚖️'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={styles.actions}>
        {hasActiveGame ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/journey')}
            >
              <Text style={styles.primaryButtonText}>{t('home.continueGame')}</Text>
              <Text style={styles.buttonSubtext}>继续你的法律探索之旅</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/game/create')}
            >
              <Text style={styles.secondaryButtonText}>{t('home.newGame')}</Text>
              <Text style={styles.buttonSubtext}>开启一段全新的人生</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/game/create')}
          >
            <Text style={styles.primaryButtonText}>{t('home.newGame')}</Text>
            <Text style={styles.buttonSubtext}>{t('home.noSave')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={() => router.push('/codex')}
        >
          <Text style={styles.tertiaryButtonText}>📖 浏览法律图鉴</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 16,
    color: '#8b8baa',
    textAlign: 'center',
  },
  characterCard: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  characterName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#e94560',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#2a2a4a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c0c0d0',
  },
  tertiaryButton: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    fontSize: 16,
    color: '#8b8baa',
  },
  buttonSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});
