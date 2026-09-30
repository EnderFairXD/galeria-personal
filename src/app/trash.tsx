import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssetGrid } from '@/components/asset-grid';
import { useSelection } from '@/hooks/use-selection';
import { useSettings } from '@/hooks/use-settings';
import type { MediaItem } from '@/utils/media';
import {
  deleteForever,
  getTrashedItems,
  restoreFromTrash,
  TRASH_RETENTION_DAYS,
  trashUri,
  type TrashedItem,
} from '@/utils/trash';

export default function TrashScreen() {
  const { palette, accentColor } = useSettings();
  const insets = useSafeAreaInsets();
  const selection = useSelection();
  const [entries, setEntries] = useState<TrashedItem[]>([]);

  const load = useCallback(async () => {
    selection.clear();
    setEntries(await getTrashedItems());
  }, [selection]);

  useFocusEffect(
    useCallback(() => {
      getTrashedItems().then(setEntries);
    }, []),
  );

  // El id de cada elemento es la ruta de su copia, que es justo lo que la
  // cuadrícula usa como origen de la imagen. Se agrupan por fecha de borrado,
  // así el encabezado ya dice cuánto les queda.
  const items: MediaItem[] = entries.map((entry) => ({
    id: trashUri(entry),
    filename: entry.filename,
    mediaType: entry.mediaType,
    width: null,
    height: null,
    duration: null,
    date: entry.deletedAt,
  }));

  const selectedEntries = entries.filter((entry) => selection.selected?.has(trashUri(entry)));

  const restore = async () => {
    await restoreFromTrash(selectedEntries);
    load();
  };

  const confirmDeleteForever = () => {
    Alert.alert(
      'Eliminar definitivamente',
      `Se borrarán ${selectedEntries.length} element${selectedEntries.length === 1 ? 'o' : 'os'}. Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteForever(selectedEntries);
            load();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.caption, { color: palette.textSecondary }]}>
        Lo que borras se guarda aquí {TRASH_RETENTION_DAYS} días y luego se elimina solo. Mantén
        pulsado para seleccionar.
      </Text>

      <AssetGrid
        items={items}
        selectedIds={selection.selected ?? undefined}
        onLongPressItem={(item) => selection.start(item.id)}
        onPressItem={(index) => selection.toggle(items[index].id)}
        empty={
          <Text style={[styles.empty, { color: palette.textSecondary }]}>
            La papelera está vacía.
          </Text>
        }
      />

      {selection.active ? (
        <View
          style={[
            styles.bar,
            { backgroundColor: palette.surface, paddingBottom: insets.bottom + 12 },
          ]}>
          <View style={styles.header}>
            <Pressable onPress={selection.clear} hitSlop={12}>
              <Text style={[styles.cancel, { color: palette.textSecondary }]}>✕</Text>
            </Pressable>
            <Text style={[styles.count, { color: palette.text }]}>
              {selectedEntries.length} seleccionad{selectedEntries.length === 1 ? 'a' : 'as'}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={restore}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: accentColor },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.buttonText}>Restaurar</Text>
            </Pressable>

            <Pressable
              onPress={confirmDeleteForever}
              style={({ pressed }) => [styles.button, styles.danger, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>Eliminar ya</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
  },
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
    gap: 8,
  },
  button: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 11,
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
