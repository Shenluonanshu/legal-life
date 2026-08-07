/**
 * 标签栏布局
 */
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={styles.iconEmoji}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e0e0e0',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2a2a4a',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#6c6c8a',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerTitle: t('app.name'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: t('tabs.journey'),
          headerTitle: t('tabs.journey'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="codex"
        options={{
          title: t('tabs.codex'),
          headerTitle: t('codex.title'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerTitle: t('tabs.profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
  },
  iconEmoji: {
    fontSize: 20,
  },
});
