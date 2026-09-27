import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { UpdateStatus } from '@/hooks/use-github-update';
import { useSettings } from '@/hooks/use-settings';

interface UpdateBannerProps {
  status: UpdateStatus;
  latestVersion: string | null;
  onPress: () => void;
  onDismiss: () => void;
}

/** Tarjeta flotante abajo: el aviso vivía pegado al borde superior, donde la
 * barra de estado lo tapaba y no se podía pulsar con el pulgar. */
export function UpdateBanner({ status, latestVersion, onPress, onDismiss }: UpdateBannerProps) {
  const { palette, accentColor } = useSettings();
  const insets = useSafeAreaInsets();

  if (status === 'idle') return null;

  const containerStyle = [
    styles.card,
    { backgroundColor: palette.surface, bottom: insets.bottom + 16 },
  ];

  if (status === 'downloading') {
    return (
      <View style={containerStyle}>
        <ActivityIndicator color={accentColor} size="small" />
        <Text style={[styles.title, { color: palette.text }]}>Descargando actualización…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={containerStyle}>
        <Text style={[styles.body, styles.grow, { color: palette.textSecondary }]}>
          No se pudo actualizar. Se reintentará la próxima vez que abras la app.
        </Text>
        <Pressable onPress={onDismiss} hitSlop={12}>
          <Text style={[styles.close, { color: palette.textSecondary }]}>✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={styles.grow}>
        <Text style={[styles.title, { color: palette.text }]}>Nueva versión disponible</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          {latestVersion ?? 'Actualización'} lista para instalar
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: accentColor },
          pressed && styles.pressed,
        ]}>
        <Text style={styles.buttonText}>Actualizar</Text>
      </Pressable>

      <Pressable onPress={onDismiss} hitSlop={12}>
        <Text style={[styles.close, { color: palette.textSecondary }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  grow: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  body: {
    fontSize: 12,
    marginTop: 1,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
