import { Image } from 'expo-image';
import { MediaType } from 'expo-media-library';
import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { useSettings } from '@/hooks/use-settings';
import { formatDuration, mediaUri, type MediaItem } from '@/utils/media';

const GAP = 2;

interface AssetGridProps {
  items: MediaItem[];
  onPressItem: (index: number) => void;
  onLongPressItem?: (item: MediaItem) => void;
  selectedIds?: Set<string>;
  onEndReached?: () => void;
  header?: React.ReactElement;
  empty?: React.ReactElement;
}

export function AssetGrid({
  items,
  onPressItem,
  onLongPressItem,
  selectedIds,
  onEndReached,
  header,
  empty,
}: AssetGridProps) {
  const { settings, accentColor, palette } = useSettings();
  const { width } = useWindowDimensions();
  const columns = settings.columns;
  const size = useMemo(
    () => (width - GAP * (columns - 1)) / columns,
    [width, columns],
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<MediaItem>) => {
    const selected = selectedIds?.has(item.id) ?? false;
    const duration = formatDuration(item.duration);

    return (
      <Pressable
        onPress={() => onPressItem(index)}
        onLongPress={onLongPressItem ? () => onLongPressItem(item) : undefined}
        style={({ pressed }) => [
          { width: size, height: size, marginRight: (index + 1) % columns === 0 ? 0 : GAP },
          styles.cell,
          pressed && styles.pressed,
        ]}>
        <Image
          source={{ uri: mediaUri(item) }}
          recyclingKey={item.id}
          contentFit="cover"
          transition={120}
          style={styles.image}
        />

        {item.mediaType === MediaType.VIDEO ? (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>{duration ? `▶ ${duration}` : '▶'}</Text>
          </View>
        ) : null}

        {settings.showFilenames && item.filename ? (
          <Text numberOfLines={1} style={styles.filename}>
            {item.filename}
          </Text>
        ) : null}

        {selectedIds ? (
          <View
            style={[
              styles.selectionRing,
              selected && { borderColor: accentColor, borderWidth: 3 },
            ]}>
            <View
              style={[
                styles.checkbox,
                { borderColor: '#ffffff' },
                selected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </View>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <FlatList
      key={columns}
      data={items}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={1.2}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      removeClippedSubviews
      windowSize={7}
      initialNumToRender={columns * 8}
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },
  row: {
    marginBottom: GAP,
  },
  cell: {
    overflow: 'hidden',
    backgroundColor: '#1c1c22',
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    flex: 1,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  videoBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  filename: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    color: '#ffffff',
    fontSize: 9,
    paddingHorizontal: 3,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  selectionRing: {
    position: 'absolute',
    inset: 0,
    borderColor: 'transparent',
    borderWidth: 0,
    alignItems: 'flex-end',
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
});
