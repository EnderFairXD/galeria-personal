import * as Application from 'expo-application';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Accents, type AccentName } from '@/constants/theme';
import { useSettings, type ThemeMode } from '@/hooks/use-settings';

const COLUMN_OPTIONS = [2, 3, 4, 5];
const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { palette } = useSettings();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { palette, accentColor } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? accentColor : palette.surfaceAlt },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, { color: active ? '#ffffff' : palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { settings, update, palette } = useSettings();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}>
      <Section title="CUADRÍCULA">
        <View style={styles.row}>
          {COLUMN_OPTIONS.map((columns) => (
            <Chip
              key={columns}
              label={`${columns}`}
              active={settings.columns === columns}
              onPress={() => update('columns', columns)}
            />
          ))}
        </View>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>
          Fotos por fila en la cuadrícula.
        </Text>
      </Section>

      <Section title="TEMA">
        <View style={styles.row}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={settings.themeMode === option.value}
              onPress={() => update('themeMode', option.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="COLOR DE ACENTO">
        <View style={styles.row}>
          {(Object.keys(Accents) as AccentName[]).map((accent) => (
            <Pressable
              key={accent}
              onPress={() => update('accent', accent)}
              style={({ pressed }) => [
                styles.swatch,
                { backgroundColor: Accents[accent] },
                settings.accent === accent && { borderColor: palette.text, borderWidth: 3 },
                pressed && styles.pressed,
              ]}
            />
          ))}
        </View>
      </Section>

      <Section title="CONTENIDO">
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: palette.text }]}>Mostrar vídeos</Text>
          <Switch
            value={settings.includeVideos}
            onValueChange={(value) => update('includeVideos', value)}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: palette.text }]}>Más recientes primero</Text>
          <Switch
            value={settings.newestFirst}
            onValueChange={(value) => update('newestFirst', value)}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: palette.text }]}>
            Ver nombre de archivo
          </Text>
          <Switch
            value={settings.showFilenames}
            onValueChange={(value) => update('showFilenames', value)}
          />
        </View>
      </Section>

      <Text style={[styles.version, { color: palette.textSecondary }]}>
        Versión {Application.nativeApplicationVersion ?? '—'}
        {'\n'}Las actualizaciones llegan solas: cuando hay una versión nueva publicada, aparece un
        aviso arriba para instalarla.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 48,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontWeight: '600',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderColor: 'transparent',
    borderWidth: 3,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
  },
  version: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
