import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { UpdateBanner } from '@/components/update-banner';
import { useGithubUpdate } from '@/hooks/use-github-update';
import { SettingsProvider, useSettings } from '@/hooks/use-settings';

function Navigation() {
  const { palette, isDark } = useSettings();
  const { status, latestVersion, applyUpdate } = useGithubUpdate();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <UpdateBanner status={status} latestVersion={latestVersion} onPress={applyUpdate} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.background },
          headerTitleStyle: { color: palette.text },
          headerTintColor: palette.text,
          contentStyle: { backgroundColor: palette.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="viewer" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="new-album" options={{ presentation: 'modal', title: 'Nuevo álbum' }} />
        <Stack.Screen name="pick" options={{ title: 'Elegir fotos' }} />
        <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <Navigation />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
