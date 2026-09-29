import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetGrid } from '@/components/asset-grid';
import { SelectionBar } from '@/components/selection-bar';
import { useMediaActions } from '@/hooks/use-media-actions';
import { useMediaAssets } from '@/hooks/use-media-assets';
import { useSelection } from '@/hooks/use-selection';
import { useSettings } from '@/hooks/use-settings';
import {
  deleteCustomAlbum,
  entriesToMediaItems,
  getCustomAlbum,
  removeFromCustomAlbum,
} from '@/utils/custom-albums';
import type { MediaItem } from '@/utils/media';
import { setViewerItems } from '@/utils/viewer-store';

export default function AlbumScreen() {
  const { id, kind, title } = useLocalSearchParams<{
    id: string;
    kind: 'custom' | 'device';
    title?: string;
  }>();
  const navigation = useNavigation();
  const { palette, accentColor } = useSettings();
  const isCustom = kind === 'custom';

  const [customItems, setCustomItems] = useState<MediaItem[]>([]);
  const selection = useSelection();
  const deviceAssets = useMediaAssets({ albumId: isCustom ? undefined : id, enabled: !isCustom });

  const items = isCustom ? customItems : deviceAssets.items;
  const selectedItems = items.filter((item) => selection.selected?.has(item.id));

  const loadCustom = useCallback(async () => {
    const album = await getCustomAlbum(id);
    setCustomItems(album ? entriesToMediaItems(album.entries) : []);
  }, [id]);

  const refresh = useCallback(() => {
    selection.clear();
    if (isCustom) loadCustom();
    else deviceAssets.reload();
  }, [selection, isCustom, loadCustom, deviceAssets]);

  const { addToAlbum, confirmDelete } = useMediaActions(refresh);

  useFocusEffect(
    useCallback(() => {
      if (isCustom) loadCustom();
    }, [isCustom, loadCustom]),
  );

  useEffect(() => {
    navigation.setOptions({ title: title ?? 'Álbum' });
  }, [navigation, title]);

  const albumOptions = () => {
    Alert.alert(title ?? 'Álbum', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar álbum',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomAlbum(id);
          router.back();
        },
      },
    ]);
  };

  const removeFromAlbum = async () => {
    await removeFromCustomAlbum(id, selectedItems.map((item) => item.id));
    selection.clear();
    loadCustom();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {isCustom && !selection.active ? (
        <View style={styles.toolbar}>
          <Pressable
            onPress={() => router.push({ pathname: '/pick', params: { albumId: id } })}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: accentColor },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.addButtonText}>+ Añadir fotos</Text>
          </Pressable>
          <Pressable onPress={albumOptions} hitSlop={12}>
            <Text style={[styles.options, { color: palette.text }]}>⋯</Text>
          </Pressable>
        </View>
      ) : null}

      <AssetGrid
        items={items}
        selectedIds={selection.selected ?? undefined}
        onEndReached={isCustom ? undefined : deviceAssets.loadMore}
        onLongPressItem={(item) => selection.start(item.id)}
        onPressItem={(index) => {
          if (selection.active) {
            selection.toggle(items[index].id);
            return;
          }
          setViewerItems(items);
          router.push({ pathname: '/viewer', params: { index: String(index) } });
        }}
        empty={
          <Text style={[styles.empty, { color: palette.textSecondary }]}>
            {isCustom
              ? 'Álbum vacío. Pulsa «Añadir fotos» para meter aquí las que quieras.'
              : 'Esta carpeta está vacía.'}
          </Text>
        }
      />

      {selection.active ? (
        <SelectionBar
          count={selectedItems.length}
          onCancel={selection.clear}
          onAddToAlbum={() => addToAlbum(selectedItems)}
          onDelete={() => confirmDelete(selectedItems)}
          extraAction={
            isCustom ? { label: 'Quitar del álbum', onPress: removeFromAlbum } : undefined
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  options: {
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.85,
  },
});
