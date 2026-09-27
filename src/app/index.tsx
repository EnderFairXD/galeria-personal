import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlbumsPage } from '@/components/albums-page';
import { AssetGrid } from '@/components/asset-grid';
import { PermissionGate } from '@/components/permission-gate';
import { UpdateBanner } from '@/components/update-banner';
import { useGithubUpdate } from '@/hooks/use-github-update';
import { useMediaAssets } from '@/hooks/use-media-assets';
import { useSettings } from '@/hooks/use-settings';
import { setViewerItems } from '@/utils/viewer-store';

const TABS = ['Fotos', 'Álbumes'];

function PhotosPage() {
  const { items, loadMore } = useMediaAssets();
  const { palette } = useSettings();

  return (
    <AssetGrid
      items={items}
      onEndReached={loadMore}
      onPressItem={(index) => {
        setViewerItems(items);
        router.push({ pathname: '/viewer', params: { index: String(index) } });
      }}
      empty={
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          No hay fotos ni vídeos en este móvil.
        </Text>
      }
    />
  );
}

export default function HomeScreen() {
  const { palette, accentColor } = useSettings();
  const { status, latestVersion, applyUpdate, dismissUpdate } = useGithubUpdate();
  const [page, setPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  return (
    <PermissionGate>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.tabs}>
            {TABS.map((label, index) => (
              <Pressable key={label} onPress={() => pagerRef.current?.setPage(index)}>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: page === index ? palette.text : palette.textSecondary },
                  ]}>
                  {label}
                </Text>
                <View
                  style={[
                    styles.tabUnderline,
                    { backgroundColor: page === index ? accentColor : 'transparent' },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.gear, { color: palette.text }]}>⚙</Text>
          </Pressable>
        </View>

        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(event) => setPage(event.nativeEvent.position)}>
          <View key="fotos" style={styles.page}>
            <PhotosPage />
          </View>
          <View key="albumes" style={styles.page}>
            <AlbumsPage />
          </View>
        </PagerView>

        <UpdateBanner
          status={status}
          latestVersion={latestVersion}
          onPress={applyUpdate}
          onDismiss={dismissUpdate}
        />
      </SafeAreaView>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 20,
  },
  tabLabel: {
    fontSize: 26,
    fontWeight: '800',
  },
  tabUnderline: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  gear: {
    fontSize: 24,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 64,
  },
  pressed: {
    opacity: 0.6,
  },
});
