import type { MediaItem } from './media';

let items: MediaItem[] = [];

/** Las fotos elegidas viajan por aquí hasta la pantalla que elige álbum, igual
 * que en el visor: no caben cientos de ids en los params de una ruta. */
export function setPendingSelection(next: MediaItem[]): void {
  items = next;
}

export function getPendingSelection(): MediaItem[] {
  return items;
}
