import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';
import { getCustomAlbums, type CustomAlbum } from '@/utils/custom-albums';
import { fetchDeviceAlbums, mediaUri, type DeviceAlbum } from '@/utils/media';

function AlbumCard({
  title,
  subtitle,
  coverUri,
  size,
  onPress,
}: {
  title: string;
  subtitle: string;
  coverUri: string | null;
  size: number;
  onPress: () => void;
}) {
  const { palette } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width: size }, pressed && styles.pressed]}>
      <View style={[styles.cover, { width: size, height: size, backgroundColor: palette.surface }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} contentFit="cover" style={styles.coverImage} />
        ) : (
          <Text style={[styles.coverPlaceholder, { color: palette.textSecondary }]}>🖼</Text>
        )}
      </View>
      <Text numberOfLines={1} style={[styles.albumTitle, { color: palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.albumSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
    </Pressable>
  );
}

export function AlbumsPage() {
  const { palette, accentColor, settings } = useSettings();
  const { width } = useWindowDimensions();
  const [customAlbums, setCustomAlbums] = useState<CustomAlbum[]>([]);
  const [deviceAlbums, setDeviceAlbums] = useState<DeviceAlbum[]>([]);

  const cardSize = (width - 16 * 2 - 12) / 2;

  useFocusEffect(
    useCallback(() => {
      let ignore = false;

      getCustomAlbums().then((albums) => {
        if (!ignore) setCustomAlbums(albums);
      });
      fetchDeviceAlbums(settings.includeVideos).then((albums) => {
        if (!ignore) setDeviceAlbums(albums);
      });

      return () => {
        ignore = true;
      };
    }, [settings.includeVideos]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Mis álbumes</Text>
        <Pressable
          onPress={() => router.push('/new-album')}
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: accentColor },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.newButtonText}>+ Nuevo</Text>
        </Pressable>
      </View>

      {customAlbums.length === 0 ? (
        <Text style={[styles.empty, { color: palette.textSecondary }]}>
          Crea un álbum y añade las fotos que quieras. Las fotos no se copian ni se mueven de sitio:
          el álbum solo las agrupa.
        </Text>
      ) : (
        <View style={styles.grid}>
          {customAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              title={album.name}
              subtitle={`${album.entries.length} elemento${album.entries.length === 1 ? '' : 's'}`}
              coverUri={album.entries[0] ? mediaUri(album.entries[0].id) : null}
              size={cardSize}
              onPress={() =>
                router.push({
                  pathname: '/album/[id]',
                  params: { id: album.id, kind: 'custom', title: album.name },
                })
              }
            />
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.deviceSection, { color: palette.text }]}>
        Carpetas del móvil
      </Text>

      <View style={styles.grid}>
        {deviceAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            title={album.title}
            subtitle={`${album.count} elemento${album.count === 1 ? '' : 's'}`}
            coverUri={album.cover ? mediaUri(album.cover) : null}
            size={cardSize}
            onPress={() =>
              router.push({
                pathname: '/album/[id]',
                params: { id: album.id, kind: 'device', title: album.title },
              })
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  deviceSection: {
    marginTop: 16,
  },
  newButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  newButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  empty: {
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cover: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    flex: 1,
    width: '100%',
  },
  coverPlaceholder: {
    fontSize: 28,
  },
  albumTitle: {
    marginTop: 6,
    fontWeight: '600',
  },
  albumSubtitle: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
