export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
};

export const Palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#ffffff',
    surface: '#f2f2f7',
    surfaceAlt: '#e5e5ea',
    text: '#11111a',
    textSecondary: '#6b6b76',
    border: '#d8d8de',
  },
  dark: {
    background: '#0b0b0f',
    surface: '#17171f',
    surfaceAlt: '#22222c',
    text: '#f5f5f7',
    textSecondary: '#9a9aa6',
    border: '#2c2c38',
  },
};

export const Accents = {
  indigo: '#6366f1',
  esmeralda: '#10b981',
  ambar: '#f59e0b',
  rosa: '#ec4899',
  cielo: '#0ea5e9',
} as const;

export type AccentName = keyof typeof Accents;

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
} as const;
