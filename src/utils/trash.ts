import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Asset, type MediaType } from 'expo-media-library';

import { forgetAssets } from './custom-albums';
import { deleteMedia, resolveFullUri, type MediaItem } from './media';

const STORAGE_KEY = 'galeria.trash.v1';
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type TrashedItem = {
  fileName: string;
  filename: string | null;
  mediaType: MediaType;
  deletedAt: number;
};

export const TRASH_RETENTION_DAYS = RETENTION_DAYS;

/**
 * La papelera guarda una copia del archivo en el almacenamiento privado de la
 * app y borra el original del móvil, así que la foto desaparece de verdad del
 * resto de apps. A cambio sigue ocupando espacio hasta que caduca, y el borrado
 * definitivo no necesita confirmación de Android porque ya es un archivo nuestro.
 */
function trashDirectory(): Directory {
  const directory = new Directory(Paths.document, 'papelera');
  if (!directory.exists) directory.create();
  return directory;
}

async function readEntries(): Promise<TrashedItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const entries = raw ? (JSON.parse(raw) as TrashedItem[]) : [];
  return entries.sort((a, b) => b.deletedAt - a.deletedAt);
}

async function saveEntries(entries: TrashedItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function extensionFor(item: MediaItem, uri: string): string {
  const source = item.filename ?? uri;
  const dot = source.lastIndexOf('.');
  return dot > -1 ? source.slice(dot) : '';
}

export async function moveToTrash(items: MediaItem[]): Promise<void> {
  const directory = trashDirectory();
  const copied: TrashedItem[] = [];

  for (const item of items) {
    const sourceUri = await resolveFullUri(item.id);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensionFor(item, sourceUri)}`;
    await new File(sourceUri).copy(new File(directory, fileName));
    copied.push({
      fileName,
      filename: item.filename,
      mediaType: item.mediaType,
      deletedAt: Date.now(),
    });
  }

  try {
    await deleteMedia(items.map((item) => item.id));
  } catch (error) {
    // Android pide confirmación para borrar; si se cancela, no dejamos copias
    // huérfanas ocupando espacio con el original aún en el móvil.
    for (const entry of copied) {
      const file = new File(directory, entry.fileName);
      if (file.exists) file.delete();
    }
    throw error;
  }

  await saveEntries([...copied, ...(await readEntries())]);
  await forgetAssets(items.map((item) => item.id));
}

async function dropEntries(entries: TrashedItem[]): Promise<void> {
  const directory = trashDirectory();
  const dropped = new Set(entries.map((entry) => entry.fileName));

  for (const entry of entries) {
    const file = new File(directory, entry.fileName);
    if (file.exists) file.delete();
  }

  const remaining = (await readEntries()).filter((entry) => !dropped.has(entry.fileName));
  await saveEntries(remaining);
}

export async function purgeExpired(): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;
  const expired = (await readEntries()).filter((entry) => entry.deletedAt < cutoff);
  if (expired.length > 0) await dropEntries(expired);
}

export async function getTrashedItems(): Promise<TrashedItem[]> {
  await purgeExpired();
  return readEntries();
}

export async function restoreFromTrash(entries: TrashedItem[]): Promise<void> {
  const directory = trashDirectory();

  for (const entry of entries) {
    const file = new File(directory, entry.fileName);
    if (file.exists) await Asset.create(file.uri);
  }

  await dropEntries(entries);
}

export async function deleteForever(entries: TrashedItem[]): Promise<void> {
  await dropEntries(entries);
}

export function trashUri(entry: TrashedItem): string {
  return new File(trashDirectory(), entry.fileName).uri;
}

export function daysLeft(entry: TrashedItem): number {
  return Math.max(0, Math.ceil((entry.deletedAt + RETENTION_MS - Date.now()) / (24 * 60 * 60 * 1000)));
}
