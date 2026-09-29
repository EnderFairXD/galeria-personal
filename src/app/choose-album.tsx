import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';
import { addToCustomAlbum, getCustomAlbums, type CustomAlbum } from '@/utils/custom-albums';
import { mediaUri } from '@/utils/media';
import { getPendingSelection } from '@/utils/pending-selection';

export default function ChooseAlbumScreen() {
  const { palette, accentColor } = useSettings();
  const [albums, setAlbums] = useState<CustomAlbum[]>([]);
  const pending = getPendingSelection();

  useEffect(() => {
    getCustomAlbums().then(setAlbums);
  }, []);

  const addTo = async (album: CustomAlbum) => {
    await addToCustomAlbum(album.id, pending);
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}>
      <Text style={[styles.caption, { color: palette.textSecondary }]}>
        {pending.length} element{pending.length === 1 ? 'o' : 'os'} · las fotos no se copian ni se
        mueven de sitio.
      </Text>

      <Pressable
        onPress={() => router.replace({ pathname: '/new-album', params: { addPending: '1' } })}
        style={({ pressed }) => [
          styles.newAlbum,
          { backgroundColor: accentColor },
          pressed && styles.pressed,
        ]}>
        <Text style={styles.newAlbumText}>＋ Crear álbum nuevo</Text>
      </Pressable>

      {albums.map((album) => (
        <Pressable
          key={album.id}
          onPress={() => addTo(album)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: palette.surface },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.cover, { backgroundColor: palette.surfaceAlt }]}>
            {album.entries[0] ? (
              <Image
                source={{ uri: mediaUri(album.entries[0].id) }}
                contentFit="cover"
                style={styles.coverImage}
              />
            ) : null}
          </View>
          <View style={styles.rowBody}>
            <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text }]}>
              {album.name}
            </Text>
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
              {album.entries.length} element{album.entries.length === 1 ? 'o' : 'os'}
            </Text>
          </View>
        </Pressable>
      ))}

      {albums.length === 0 ? (
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          Todavía no tienes álbumes propios. Crea uno y las fotos elegidas entrarán en él.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 48,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
  newAlbum: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 999,
  },
  newAlbumText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
  },
  coverImage: {
    flex: 1,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
