/**
 * 根布局 — 国际化 + 状态栏 + 路由栈
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="game/create"
          options={{
            headerShown: true,
            headerTitle: '创建角色',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#e0e0e0',
          }}
        />
        <Stack.Screen
          name="game/scenario"
          options={{
            headerShown: true,
            headerTitle: '人生场景',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#e0e0e0',
            gestureEnabled: false, // 防止滑动返回跳过场景
          }}
        />
      </Stack>
    </I18nextProvider>
  );
}
