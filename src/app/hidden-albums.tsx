import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AlbumCard, albumSubtitle } from '@/components/album-card';
import { useAlbums } from '@/hooks/use-albums';
import { useSettings } from '@/hooks/use-settings';
import { unhideAlbum } from '@/utils/hidden-albums';
import { mediaUri } from '@/utils/media';

export default function HiddenAlbumsScreen() {
  const { palette } = useSettings();
  const { width } = useWindowDimensions();
  const { custom, device, hidden, reload } = useAlbums();

  const cardSize = (width - 16 * 2 - 12) / 2;
  const hiddenCustom = custom.filter((album) => hidden.has(album.id));
  const hiddenDevice = device.filter((album) => hidden.has(album.id));

  const askToShow = (id: string, title: string) => {
    Alert.alert(title, 'Volverá a aparecer en la lista de álbumes.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Mostrar álbum',
        onPress: async () => {
          await unhideAlbum(id);
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
      <Text style={[styles.caption, { color: palette.textSecondary }]}>
        Mantén pulsado un álbum para volver a mostrarlo. Ocultar solo lo quita de la lista: las
        fotos siguen en el móvil y se ven desde otras apps.
      </Text>

      <View style={styles.grid}>
        {hiddenCustom.map((album) => (
          <AlbumCard
            key={album.id}
            title={album.name}
            subtitle={albumSubtitle(album.entries.length)}
            coverUri={album.entries[0] ? mediaUri(album.entries[0].id) : null}
            size={cardSize}
            onPress={() => openAlbum(album.id, 'custom', album.name)}
            onLongPress={() => askToShow(album.id, album.name)}
          />
        ))}

        {hiddenDevice.map((album) => (
          <AlbumCard
            key={album.id}
            title={album.title}
            subtitle={albumSubtitle(album.count)}
            coverUri={album.cover ? mediaUri(album.cover) : null}
            size={cardSize}
            onPress={() => openAlbum(album.id, 'device', album.title)}
            onLongPress={() => askToShow(album.id, album.title)}
          />
        ))}
      </View>

      {hiddenCustom.length + hiddenDevice.length === 0 ? (
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          No tienes ningún álbum oculto.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
