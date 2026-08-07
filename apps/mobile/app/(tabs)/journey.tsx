/**
 * 旅程页面 — 游戏进行中的场景流
 *
 * 展示角色当前状态、上一次选择的分支结果、
 * 以及进入下一个场景的入口
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

export default function JourneyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    characterName,
    characterAge,
    characterStats,
    choiceChain,
    phase,
    currentScenario,
  } = useGameStore();

  const hasStarted = characterName !== '';

  if (!hasStarted) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyText}>还没有开始旅程</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/game/create')}
        >
          <Text style={styles.startButtonText}>开始新游戏</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 角色状态栏 */}
      <View style={styles.statusBar}>
        <Text style={styles.statusName}>{characterName}</Text>
        <Text style={styles.statusAge}>{characterAge} 岁</Text>
      </View>

      {/* 属性概览 */}
      <View style={styles.statsPanel}>
        {Object.entries(characterStats).map(([key, value]) => (
          <View key={key} style={styles.statRow}>
            <Text style={styles.statIcon}>
              {key === 'health' ? '🏥' :
               key === 'wealth' ? '💰' :
               key === 'knowledge' ? '📚' :
               key === 'happiness' ? '😊' : '⚖️'}
            </Text>
            <View style={styles.statBar}>
              <View style={[styles.statFill, { width: `${value}%` }]} />
            </View>
            <Text style={styles.statNum}>{value}</Text>
          </View>
        ))}
      </View>

      {/* 分支历史时间线 */}
      {choiceChain.length > 0 && (
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>人生轨迹</Text>
          {choiceChain.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>
                  第 {index + 1} 次选择 — {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.timelineDesc}>
                  选择了路径 {item.choiceId.slice(0, 8)}...
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 当前场景或下一个场景入口 */}
      {currentScenario ? (
        <View style={styles.activeScenario}>
          <Text style={styles.scenarioLabel}>当前场景</Text>
          <Text style={styles.scenarioTitle}>
            {typeof currentScenario.title === 'object'
              ? (currentScenario.title as Record<string, string>).zh ?? ''
              : ''}
          </Text>
          <TouchableOpacity
            style={styles.enterButton}
            onPress={() => router.push('/game/scenario')}
          >
            <Text style={styles.enterButtonText}>进入场景</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.nextScenario}>
          <Text style={styles.nextScenarioText}>
            准备迎接下一个生活场景...
          </Text>
          <TouchableOpacity
            style={styles.triggerButton}
            onPress={() => router.push('/game/scenario')}
          >
            <Text style={styles.triggerButtonText}>🎲 触发新场景</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#8b8baa', marginBottom: 24 },
  startButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },

  // 状态栏
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusName: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  statusAge: { fontSize: 18, color: '#e94560', fontWeight: '600' },

  // 属性面板
  statsPanel: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: { fontSize: 14, width: 24, textAlign: 'center' },
  statBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4,
  },
  statNum: { fontSize: 13, color: '#8b8baa', width: 28, textAlign: 'right' },

  // 时间线
  timelineSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e94560',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 13, color: '#6c6c8a', marginBottom: 2 },
  timelineDesc: { fontSize: 14, color: '#c0c0d0' },

  // 当前场景
  activeScenario: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  scenarioLabel: { fontSize: 12, color: '#e94560', marginBottom: 4, textTransform: 'uppercase' },
  scenarioTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  enterButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  enterButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

  // 下一个场景
  nextScenario: { alignItems: 'center', marginTop: 24 },
  nextScenarioText: { fontSize: 16, color: '#8b8baa', marginBottom: 16 },
  triggerButton: {
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  triggerButtonText: { fontSize: 18, fontWeight: '600', color: '#e0e0e0' },
});
