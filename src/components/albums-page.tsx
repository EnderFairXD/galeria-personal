import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AlbumCard, albumSubtitle } from '@/components/album-card';
import { useAlbums } from '@/hooks/use-albums';
import { useSettings } from '@/hooks/use-settings';
import { hideAlbum } from '@/utils/hidden-albums';
import { mediaUri } from '@/utils/media';

export function AlbumsPage() {
  const { palette, accentColor } = useSettings();
  const { width } = useWindowDimensions();
  const { custom, device, hidden, reload } = useAlbums();

  const cardSize = (width - 16 * 2 - 12) / 2;
  const visibleCustom = custom.filter((album) => !hidden.has(album.id));
  const visibleDevice = device.filter((album) => !hidden.has(album.id));
  const hiddenCount = custom.length + device.length - visibleCustom.length - visibleDevice.length;

  const askToHide = (id: string, title: string) => {
    Alert.alert(title, 'Dejará de aparecer aquí. Podrás recuperarlo desde «Álbumes ocultos».', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ocultar álbum',
        onPress: async () => {
          await hideAlbum(id);
          reload();
        },
      },
    ]);
  };

  const openAlbum = (id: string, kind: 'custom' | 'device', title: string) =>
    router.push({ pathname: '/album/[id]', params: { id, kind, title } });

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

      {visibleCustom.length === 0 ? (
        <Text style={[styles.empty, { color: palette.textSecondary }]}>
          Crea un álbum y añade las fotos que quieras. Las fotos no se copian ni se mueven de sitio:
          el álbum solo las agrupa.
        </Text>
      ) : (
        <View style={styles.grid}>
          {visibleCustom.map((album) => (
            <AlbumCard
              key={album.id}
              title={album.name}
              subtitle={albumSubtitle(album.entries.length)}
              coverUri={album.entries[0] ? mediaUri(album.entries[0].id) : null}
              size={cardSize}
              onPress={() => openAlbum(album.id, 'custom', album.name)}
              onLongPress={() => askToHide(album.id, album.name)}
            />
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.deviceSection, { color: palette.text }]}>
        Carpetas del móvil
      </Text>

      <View style={styles.grid}>
        {visibleDevice.map((album) => (
          <AlbumCard
            key={album.id}
            title={album.title}
            subtitle={albumSubtitle(album.count)}
            coverUri={album.cover ? mediaUri(album.cover) : null}
            size={cardSize}
            onPress={() => openAlbum(album.id, 'device', album.title)}
            onLongPress={() => askToHide(album.id, album.title)}
          />
        ))}
      </View>

      <Text style={[styles.hint, { color: palette.textSecondary }]}>
        Mantén pulsado un álbum para ocultarlo.
      </Text>

      {hiddenCount > 0 ? (
        <Pressable
          onPress={() => router.push('/hidden-albums')}
          style={({ pressed }) => [
            styles.hiddenRow,
            { backgroundColor: palette.surface },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.hiddenLabel, { color: palette.text }]}>Álbumes ocultos</Text>
          <Text style={[styles.hiddenCount, { color: palette.textSecondary }]}>
            {hiddenCount} ›
          </Text>
        </Pressable>
      ) : null}
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
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  hiddenLabel: {
    fontWeight: '700',
  },
  hiddenCount: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
