import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'galeria.hidden-albums.v1';

/** Ocultar es solo cosa de la interfaz: guarda ids para no listarlos. No cifra
 * ni protege nada, las fotos siguen accesibles desde cualquier otra app. */
export async function getHiddenAlbumIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function hideAlbum(id: string): Promise<void> {
  const hidden = await getHiddenAlbumIds();
  if (hidden.includes(id)) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden, id]));
}

export async function unhideAlbum(id: string): Promise<void> {
  const hidden = await getHiddenAlbumIds();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hidden.filter((item) => item !== id)));
}
