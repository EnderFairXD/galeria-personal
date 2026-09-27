import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetGrid } from '@/components/asset-grid';
import { useMediaAssets } from '@/hooks/use-media-assets';
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
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const deviceAssets = useMediaAssets({ albumId: isCustom ? undefined : id, enabled: !isCustom });

  const items = isCustom ? customItems : deviceAssets.items;

  const loadCustom = useCallback(async () => {
    const album = await getCustomAlbum(id);
    setCustomItems(album ? entriesToMediaItems(album.entries) : []);
  }, [id]);

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

  const removeSelected = async () => {
    if (!selection || selection.size === 0) return;
    await removeFromCustomAlbum(id, [...selection]);
    setSelection(null);
    loadCustom();
  };

  const toggleSelected = (item: MediaItem) => {
    setSelection((previous) => {
      const next = new Set(previous ?? []);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {isCustom ? (
        <View style={styles.toolbar}>
          {selection ? (
            <>
              <Pressable onPress={() => setSelection(null)}>
                <Text style={[styles.toolbarText, { color: palette.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={removeSelected}>
                <Text style={[styles.toolbarText, { color: '#ef4444' }]}>
                  Quitar del álbum ({selection.size})
                </Text>
              </Pressable>
            </>
          ) : (
            <>
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
                <Text style={[styles.toolbarText, { color: palette.text }]}>⋯</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      <AssetGrid
        items={items}
        selectedIds={selection ?? undefined}
        onEndReached={isCustom ? undefined : deviceAssets.loadMore}
        onLongPressItem={isCustom ? toggleSelected : undefined}
        onPressItem={(index) => {
          if (selection) {
            toggleSelected(items[index]);
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
  toolbarText: {
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
