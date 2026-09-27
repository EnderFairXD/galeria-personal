import type { MediaItem } from './media';

let items: MediaItem[] = [];

/** El visor recibe la lista por aquí en vez de por params de ruta: serializar
 * cientos de assets en la URL sería lento y hay un límite de tamaño. */
export function setViewerItems(next: MediaItem[]): void {
  items = next;
}

export function getViewerItems(): MediaItem[] {
  return items;
}
