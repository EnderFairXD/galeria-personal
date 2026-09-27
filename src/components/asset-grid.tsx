import { Image } from 'expo-image';
import { MediaType } from 'expo-media-library';
import { useMemo } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useSettings } from '@/hooks/use-settings';
import { dayKey, dayLabel } from '@/utils/dates';
import { formatDuration, mediaUri, type MediaItem } from '@/utils/media';

const GAP = 6;
const EDGE = 6;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 10;

type Row = { key: string; items: MediaItem[] };
type Section = { title: string; data: Row[] };

interface AssetGridProps {
  items: MediaItem[];
  onPressItem: (index: number) => void;
  onLongPressItem?: (item: MediaItem) => void;
  selectedIds?: Set<string>;
  onEndReached?: () => void;
  empty?: React.ReactElement;
}

/** Agrupa por día y trocea cada día en filas de `columns`: SectionList no sabe
 * de columnas, así que una "fila" es el elemento que se renderiza. */
function buildSections(items: MediaItem[], columns: number): Section[] {
  const sections: Section[] = [];
  let currentKey: string | null = null;

  for (const item of items) {
    const key = dayKey(item.creationTime);

    if (key !== currentKey) {
      sections.push({ title: dayLabel(item.creationTime), data: [] });
      currentKey = key;
    }

    const section = sections[sections.length - 1];
    const lastRow = section.data[section.data.length - 1];

    if (lastRow && lastRow.items.length < columns) lastRow.items.push(item);
    else section.data.push({ key: item.id, items: [item] });
  }

  return sections;
}

export function AssetGrid({
  items,
  onPressItem,
  onLongPressItem,
  selectedIds,
  onEndReached,
  empty,
}: AssetGridProps) {
  const { settings, update, accentColor, palette } = useSettings();
  const { width } = useWindowDimensions();
  const columns = settings.columns;

  const size = (width - EDGE * 2 - GAP * (columns - 1)) / columns;
  const sections = useMemo(() => buildSections(items, columns), [items, columns]);
  const indexById = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  );

  // Pellizcar para ver más o menos fotos por fila, como en las galerías al uso:
  // juntar los dedos mete más columnas, separarlos las reduce.
  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate((event) => {
      const target = Math.round(columns / event.scale);
      const clamped = Math.min(Math.max(target, MIN_COLUMNS), MAX_COLUMNS);
      if (clamped !== columns) update('columns', clamped);
    });

  const renderRow = (row: Row) => (
    <View style={styles.row}>
      {row.items.map((item) => {
        const index = indexById.get(item.id) ?? 0;
        const selected = selectedIds?.has(item.id) ?? false;
        const duration = formatDuration(item.duration);

        return (
          <Pressable
            key={item.id}
            onPress={() => onPressItem(index)}
            onLongPress={onLongPressItem ? () => onLongPressItem(item) : undefined}
            style={({ pressed }) => [
              styles.cell,
              { width: size, height: size },
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
                    selected && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <GestureDetector gesture={pinchGesture}>
      <SectionList
        sections={sections}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) => renderRow(item)}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: palette.background }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled
        onEndReached={onEndReached}
        onEndReachedThreshold={1.2}
        ListEmptyComponent={empty}
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={12}
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={styles.content}
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },
  sectionHeader: {
    paddingHorizontal: EDGE + 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: EDGE,
    marginBottom: GAP,
  },
  cell: {
    overflow: 'hidden',
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'flex-end',
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
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
