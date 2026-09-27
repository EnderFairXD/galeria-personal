import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Accents, Palettes, type AccentName, type Palette } from '@/constants/theme';

const STORAGE_KEY = 'galeria.settings.v1';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type Settings = {
  columns: number;
  themeMode: ThemeMode;
  accent: AccentName;
  newestFirst: boolean;
  includeVideos: boolean;
  showFilenames: boolean;
};

const DEFAULTS: Settings = {
  columns: 3,
  themeMode: 'auto',
  accent: 'indigo',
  newestFirst: true,
  includeVideos: true,
  showFilenames: false,
};

type SettingsContextValue = {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  palette: Palette;
  accentColor: string;
  isDark: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    });
  }, []);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => {
      const next = { ...previous, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const isDark =
      settings.themeMode === 'auto' ? systemScheme === 'dark' : settings.themeMode === 'dark';
    return {
      settings,
      update,
      palette: Palettes[isDark ? 'dark' : 'light'],
      accentColor: Accents[settings.accent],
      isDark,
    };
  }, [settings, systemScheme, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return context;
}
