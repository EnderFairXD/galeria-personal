import { Image } from 'expo-image';
import { MediaType } from 'expo-media-library';
import { useEffect, useMemo } from 'react';
import {
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { useSettings } from '@/hooks/use-settings';
import { dayKey, dayLabel } from '@/utils/dates';
import { formatDuration, mediaUri, type MediaItem } from '@/utils/media';

const GAP = 6;
const EDGE = 6;
const MIN_COLUMNS = 1;
const MAX_COLUMNS = 10;

const HEADER_HEIGHT = 44;

type GridRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'row'; key: string; items: MediaItem[] };

interface AssetGridProps {
  items: MediaItem[];
  onPressItem: (index: number) => void;
  onLongPressItem?: (item: MediaItem) => void;
  selectedIds?: Set<string>;
  onEndReached?: () => void;
  empty?: React.ReactElement;
}

/**
 * Aplana la galería en una sola lista de filas, mezclando cabeceras de día y
 * filas de fotos. Con una lista por secciones había que adivinar la altura de
 * cada bloque, y al bajar rápido las posiciones estimadas no cuadraban con las
 * reales y la cuadrícula se descolocaba. Aquí todas las filas tienen una altura
 * conocida de antemano, así que la posición de cada una es exacta.
 */
function buildRows(items: MediaItem[], columns: number): GridRow[] {
  const rows: GridRow[] = [];
  let currentDay: string | null = null;
  let lastRow: Extract<GridRow, { kind: 'row' }> | null = null;

  for (const item of items) {
    const day = dayKey(item.date);

    if (day !== currentDay) {
      rows.push({ kind: 'header', key: `header-${day}`, title: dayLabel(item.date) });
      currentDay = day;
      lastRow = null;
    }

    if (lastRow && lastRow.items.length < columns) {
      lastRow.items.push(item);
    } else {
      lastRow = { kind: 'row', key: item.id, items: [item] };
      rows.push(lastRow);
    }
  }

  return rows;
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
  const rows = useMemo(() => buildRows(items, columns), [items, columns]);
  const indexById = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  );

  const rowHeight = size + GAP;
  const offsets = useMemo(() => {
    const result: { length: number; offset: number }[] = [];
    let offset = 0;

    for (const row of rows) {
      const length = row.kind === 'header' ? HEADER_HEIGHT : rowHeight;
      result.push({ length, offset });
      offset += length;
    }

    return result;
  }, [rows, rowHeight]);

  const stickyIndices = useMemo(
    () =>
      rows.reduce<number[]>((acc, row, position) => {
        if (row.kind === 'header') acc.push(position);
        return acc;
      }, []),
    [rows],
  );

  // Pellizcar para ver más o menos fotos por fila, como en las galerías al uso:
  // juntar los dedos mete más columnas, separarlos las reduce.
  //
  // El número de partida se fija al empezar el gesto. Si se calculara sobre el
  // número actual, cada cambio movería la referencia del propio gesto y se
  // dispararía: de 3 columnas, un pellizco corto saltaba a 1 o a 10 de golpe.
  // El gesto vive en el hilo de animaciones y solo salta a JavaScript cuando el
  // número cambia de verdad. Corriendo entero en JavaScript le costaba arrancar,
  // porque es el mismo hilo que está dibujando las fotos mientras te desplazas.
  const currentColumns = useSharedValue(columns);
  const startColumns = useSharedValue(columns);
  const appliedColumns = useSharedValue(columns);

  useEffect(() => {
    currentColumns.value = columns;
  }, [columns, currentColumns]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startColumns.value = currentColumns.value;
      appliedColumns.value = currentColumns.value;
    })
    .onUpdate((event) => {
      const target = Math.round(startColumns.value / event.scale);
      const clamped = Math.min(Math.max(target, MIN_COLUMNS), MAX_COLUMNS);
      if (clamped !== appliedColumns.value) {
        appliedColumns.value = clamped;
        runOnJS(update)('columns', clamped);
      }
    });

  const renderPhotoRow = (row: Extract<GridRow, { kind: 'row' }>) => (
    <View style={[styles.row, { height: size }]}>
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
            {/* El tamaño va en números y no con flex: así se sabe antes de
                medir el diseño y la foto se decodifica ya reducida. Con flex
                no se conocía a tiempo y cada miniatura entraba en memoria casi
                a resolución original: 148 MB de gráficos solo al abrir, y el
                recolector de basura ahogaba al hilo principal hasta bloquear
                la app. */}
            <Image
              source={{ uri: mediaUri(item) }}
              recyclingKey={item.id}
              contentFit="cover"
              transition={120}
              // Sin caché en memoria: recorriendo miles de fotos se iban
              // acumulando todas las miniaturas vistas hasta agotar el montón
              // de Java, que tiene un techo fijo de 268 MB. En disco se siguen
              // guardando, así que volver atrás tampoco relee del archivo.
              cachePolicy="disk"
              style={{ width: size, height: size }}
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
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <View style={[styles.sectionHeader, { backgroundColor: palette.background }]}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>{item.title}</Text>
            </View>
          ) : (
            renderPhotoRow(item)
          )
        }
        getItemLayout={(_, position) => ({ ...offsets[position], index: position })}
        stickyHeaderIndices={stickyIndices}
        // En Android viene activado por defecto y rompe la app con la nueva
        // arquitectura: intenta insertar una fila en un contenedor que ya ha
        // vaciado y revienta con IndexOutOfBounds desde ReactClippingViewManager.
        removeClippedSubviews={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={1.2}
        ListEmptyComponent={empty}
        windowSize={3}
        initialNumToRender={12}
        maxToRenderPerBatch={6}
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
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
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
