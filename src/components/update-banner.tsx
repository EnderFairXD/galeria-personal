import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { UpdateStatus } from '@/hooks/use-github-update';

interface UpdateBannerProps {
  status: UpdateStatus;
  latestVersion: string | null;
  onPress: () => void;
}

export function UpdateBanner({ status, latestVersion, onPress }: UpdateBannerProps) {
  if (status === 'idle') return null;

  if (status === 'downloading') {
    return (
      <View style={[styles.banner, styles.info]}>
        <ActivityIndicator color="#fff" size="small" />
        <Text style={styles.text}>Descargando actualización…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.banner, styles.error]}>
        <Text style={[styles.text, styles.centered]}>
          No se pudo actualizar. Se volverá a intentar la próxima vez.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, styles.info, styles.spread, pressed && styles.pressed]}>
      <Text style={styles.text}>✨ Versión {latestVersion ?? 'nueva'} disponible</Text>
      <Text style={[styles.text, styles.underline]}>Actualizar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  spread: {
    justifyContent: 'space-between',
  },
  info: {
    backgroundColor: '#4f46e5',
  },
  error: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
  centered: {
    textAlign: 'center',
  },
  underline: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
