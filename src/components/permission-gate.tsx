import { usePermissions } from 'expo-media-library';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

export function PermissionGate({ children }: { children: React.ReactNode }) {
  const [permission, requestPermission] = usePermissions();
  const { palette, accentColor } = useSettings();

  if (!permission) return <View style={{ flex: 1, backgroundColor: palette.background }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.text }]}>Acceso a tus fotos</Text>
        <Text style={[styles.body, { color: palette.textSecondary }]}>
          Esta galería lee las fotos y vídeos que ya tienes en el móvil. No copia ni mueve nada:
          solo los muestra y te deja organizarlos en álbumes.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: accentColor },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.buttonText}>
            {permission.canAskAgain ? 'Dar acceso' : 'Reintentar'}
          </Text>
        </Pressable>
        {!permission.canAskAgain ? (
          <Text style={[styles.hint, { color: palette.textSecondary }]}>
            Si no aparece el diálogo, actívalo en Ajustes de Android → Aplicaciones → Galería →
            Permisos.
          </Text>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
  },
});
