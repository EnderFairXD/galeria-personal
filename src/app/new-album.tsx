import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';
import { createCustomAlbum } from '@/utils/custom-albums';

export default function NewAlbumScreen() {
  const { palette, accentColor } = useSettings();
  const [name, setName] = useState('');

  const create = async () => {
    const album = await createCustomAlbum(name);
    router.replace({
      pathname: '/album/[id]',
      params: { id: album.id, kind: 'custom', title: album.name },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>Nombre del álbum</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        autoFocus
        placeholder="Vacaciones, familia, recibos…"
        placeholderTextColor={palette.textSecondary}
        style={[
          styles.input,
          { backgroundColor: palette.surface, color: palette.text, borderColor: palette.border },
        ]}
        onSubmitEditing={name.trim() ? create : undefined}
      />

      <Pressable
        disabled={!name.trim()}
        onPress={create}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: name.trim() ? accentColor : palette.surfaceAlt },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.buttonText, { color: name.trim() ? '#ffffff' : palette.textSecondary }]}>
          Crear álbum
        </Text>
      </Pressable>

      <Text style={[styles.hint, { color: palette.textSecondary }]}>
        Los álbumes agrupan fotos que ya tienes: no se copian ni se mueven, y una misma foto puede
        estar en varios álbumes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: {
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
