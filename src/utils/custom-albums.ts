import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaType } from 'expo-media-library';

import type { MediaItem } from './media';

const STORAGE_KEY = 'galeria.albums.v1';

export type AlbumEntry = {
  id: string;
  mediaType: MediaType;
  creationTime: number | null;
};

export type CustomAlbum = {
  id: string;
  name: string;
  createdAt: number;
  entries: AlbumEntry[];
};

/**
 * Los álbumes propios son virtuales: guardamos solo las referencias a los assets
 * del sistema. `Album.create` de expo-media-library mueve o copia los archivos
 * reales, que es justo lo que no queremos — las fotos se quedan donde están y
 * pueden estar en varios álbumes a la vez.
 */
export async function getCustomAlbums(): Promise<CustomAlbum[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as CustomAlbum[];
  return parsed.sort((a, b) => b.createdAt - a.createdAt);
}

async function saveAlbums(albums: CustomAlbum[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(albums));
}

export async function getCustomAlbum(id: string): Promise<CustomAlbum | null> {
  const albums = await getCustomAlbums();
  return albums.find((album) => album.id === id) ?? null;
}

export async function createCustomAlbum(name: string): Promise<CustomAlbum> {
  const albums = await getCustomAlbums();
  const album: CustomAlbum = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    createdAt: Date.now(),
    entries: [],
  };
  await saveAlbums([album, ...albums]);
  return album;
}

export async function renameCustomAlbum(id: string, name: string): Promise<void> {
  const albums = await getCustomAlbums();
  await saveAlbums(
    albums.map((album) => (album.id === id ? { ...album, name: name.trim() } : album)),
  );
}

export async function deleteCustomAlbum(id: string): Promise<void> {
  const albums = await getCustomAlbums();
  await saveAlbums(albums.filter((album) => album.id !== id));
}

export async function addToCustomAlbum(id: string, items: MediaItem[]): Promise<void> {
  const albums = await getCustomAlbums();
  await saveAlbums(
    albums.map((album) => {
      if (album.id !== id) return album;
      const existing = new Set(album.entries.map((entry) => entry.id));
      const added = items
        .filter((item) => !existing.has(item.id))
        .map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          creationTime: item.creationTime,
        }));
      return { ...album, entries: [...added, ...album.entries] };
    }),
  );
}

export async function removeFromCustomAlbum(id: string, assetIds: string[]): Promise<void> {
  const albums = await getCustomAlbums();
  const removed = new Set(assetIds);
  await saveAlbums(
    albums.map((album) =>
      album.id === id
        ? { ...album, entries: album.entries.filter((entry) => !removed.has(entry.id)) }
        : album,
    ),
  );
}

/** Quita de todos los álbumes las referencias a assets borrados del dispositivo. */
export async function forgetAssets(assetIds: string[]): Promise<void> {
  const albums = await getCustomAlbums();
  const removed = new Set(assetIds);
  await saveAlbums(
    albums.map((album) => ({
      ...album,
      entries: album.entries.filter((entry) => !removed.has(entry.id)),
    })),
  );
}

/** Ordena por fecha de la foto, no por cuándo se añadió al álbum: la cuadrícula
 * agrupa por día y con el orden de inserción saldrían días repetidos. */
export function entriesToMediaItems(entries: AlbumEntry[]): MediaItem[] {
  return [...entries]
    .sort((a, b) => (b.creationTime ?? 0) - (a.creationTime ?? 0))
    .map((entry) => ({
      id: entry.id,
      filename: null,
      mediaType: entry.mediaType,
      width: null,
      height: null,
      duration: null,
      creationTime: entry.creationTime ?? null,
    }));
}
