import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/hooks/use-settings';

interface SelectionBarProps {
  count: number;
  onAddToAlbum: () => void;
  onDelete: () => void;
  onCancel: () => void;
  extraAction?: { label: string; onPress: () => void };
}

export function SelectionBar({
  count,
  onAddToAlbum,
  onDelete,
  onCancel,
  extraAction,
}: SelectionBarProps) {
  const { palette, accentColor } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: palette.surface, paddingBottom: insets.bottom + 12 },
      ]}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Text style={[styles.cancel, { color: palette.textSecondary }]}>✕</Text>
        </Pressable>
        <Text style={[styles.count, { color: palette.text }]}>
          {count} seleccionad{count === 1 ? 'a' : 'as'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onAddToAlbum}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: accentColor },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.buttonText}>Añadir a álbum</Text>
        </Pressable>

        {extraAction ? (
          <Pressable
            onPress={extraAction.onPress}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: palette.surfaceAlt },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.buttonText, { color: palette.text }]}>{extraAction.label}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.button,
            styles.danger,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -2 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cancel: {
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
