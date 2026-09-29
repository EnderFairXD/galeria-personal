import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

interface AlbumCardProps {
  title: string;
  subtitle: string;
  coverUri: string | null;
  size: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function AlbumCard({
  title,
  subtitle,
  coverUri,
  size,
  onPress,
  onLongPress,
}: AlbumCardProps) {
  const { palette } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [{ width: size }, pressed && styles.pressed]}>
      <View style={[styles.cover, { width: size, height: size, backgroundColor: palette.surface }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} contentFit="cover" style={styles.coverImage} />
        ) : (
          <Text style={[styles.placeholder, { color: palette.textSecondary }]}>🖼</Text>
        )}
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
    </Pressable>
  );
}

export function albumSubtitle(count: number): string {
  return `${count} elemento${count === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
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
  placeholder: {
    fontSize: 28,
  },
  title: {
    marginTop: 6,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
