import { MediaType } from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoPage } from '@/components/video-page';
import { ZoomableImage } from '@/components/zoomable-image';
import { mediaUri, monthLabel } from '@/utils/media';
import { moveToTrash, TRASH_RETENTION_DAYS } from '@/utils/trash';
import { getViewerItems } from '@/utils/viewer-store';

export default function ViewerScreen() {
  const params = useLocalSearchParams<{ index?: string }>();
  const [items, setItems] = useState(getViewerItems);
  const [index, setIndex] = useState(() => Number(params.index ?? 0));
  const [chromeVisible, setChromeVisible] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  const current = items[index];

  useEffect(() => {
    if (!current) router.back();
  }, [current]);

  if (!current) return null;

  const confirmDelete = () => {
    Alert.alert(
      'Mover a la papelera',
      `Se quitará del móvil. Podrás recuperarlo durante ${TRASH_RETENTION_DAYS} días.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover a la papelera',
          style: 'destructive',
          onPress: async () => {
            try {
              await moveToTrash([current]);
            } catch {
              // Diálogo de borrado cancelado: la foto se queda y seguimos en el visor.
              return;
            }

            const remaining = items.filter((item) => item.id !== current.id);
            if (remaining.length === 0) {
              router.back();
              return;
            }
            setItems(remaining);
            setIndex(Math.min(index, remaining.length - 1));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pager}
        initialPage={index}
        scrollEnabled={!zoomed}
        onPageSelected={(event) => {
          setIndex(event.nativeEvent.position);
          setZoomed(false);
        }}>
        {items.map((item, itemIndex) => (
          <View key={item.id} style={styles.page}>
            {item.mediaType === MediaType.VIDEO ? (
              <VideoPage uri={mediaUri(item)} active={itemIndex === index} />
            ) : (
              <ZoomableImage
                uri={mediaUri(item)}
                onTap={() => setChromeVisible((visible) => !visible)}
                onZoomChange={setZoomed}
              />
            )}
          </View>
        ))}
      </PagerView>

      {chromeVisible ? (
        <SafeAreaView style={styles.topBar} edges={['top']}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.action}>✕</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {current.filename ?? monthLabel(current.date)}
          </Text>
          <Pressable onPress={confirmDelete} hitSlop={12}>
            <Text style={styles.action}>🗑</Text>
          </Pressable>
        </SafeAreaView>
      ) : null}

      {chromeVisible ? (
        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <Text style={styles.counter}>
            {index + 1} / {items.length}
          </Text>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  action: {
    color: '#ffffff',
    fontSize: 20,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  counter: {
    color: '#ffffff',
    fontSize: 12,
  },
});
