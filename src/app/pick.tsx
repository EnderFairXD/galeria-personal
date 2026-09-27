import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetGrid } from '@/components/asset-grid';
import { useMediaAssets } from '@/hooks/use-media-assets';
import { useSettings } from '@/hooks/use-settings';
import { addToCustomAlbum } from '@/utils/custom-albums';

export default function PickScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const { palette, accentColor } = useSettings();
  const { items, loadMore } = useMediaAssets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const confirm = async () => {
    await addToCustomAlbum(
      albumId,
      items.filter((item) => selected.has(item.id)),
    );
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <AssetGrid
        items={items}
        selectedIds={selected}
        onEndReached={loadMore}
        onPressItem={(index) => {
          const item = items[index];
          setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(item.id)) next.delete(item.id);
            else next.add(item.id);
            return next;
          });
        }}
      />

      <View style={[styles.footer, { backgroundColor: palette.surface }]}>
        <Text style={[styles.count, { color: palette.textSecondary }]}>
          {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
        </Text>
        <Pressable
          disabled={selected.size === 0}
          onPress={confirm}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: selected.size ? accentColor : palette.surfaceAlt },
            pressed && styles.pressed,
          ]}>
          <Text
            style={[
              styles.buttonText,
              { color: selected.size ? '#ffffff' : palette.textSecondary },
            ]}>
            Añadir al álbum
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  count: {
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
