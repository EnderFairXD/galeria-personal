import { addListener } from 'expo-media-library';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSettings } from '@/hooks/use-settings';
import { fetchMediaPage, PAGE_SIZE, type MediaItem } from '@/utils/media';

interface UseMediaAssetsResult {
  items: MediaItem[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/** Carga la galería por páginas y se resincroniza cuando el sistema avisa de
 * cambios (foto nueva de la cámara, borrado desde otra app…). */
export function useMediaAssets(options: { albumId?: string; enabled?: boolean } = {}): UseMediaAssetsResult {
  const { albumId, enabled = true } = options;
  const { settings } = useSettings();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const load = useCallback(
    async (offset: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const page = await fetchMediaPage({
        offset,
        albumId,
        newestFirst: settings.newestFirst,
        includeVideos: settings.includeVideos,
      });

      // Hay que descartar repetidas al encadenar páginas. Android guarda la
      // fecha de modificación en segundos, así que un lote descargado de golpe
      // comparte fecha exacta; entre empatadas el orden no es estable de una
      // consulta a otra, y la misma foto volvía a salir en la página siguiente.
      // Dos elementos con el mismo id rompen la lista justo en ese punto.
      setItems((previous) => {
        if (offset === 0) return page;
        const known = new Set(previous.map((item) => item.id));
        return [...previous, ...page.filter((item) => !known.has(item.id))];
      });
      setHasMore(page.length === PAGE_SIZE);
      setLoading(false);
      loadingRef.current = false;
    },
    [albumId, settings.newestFirst, settings.includeVideos],
  );

  const reload = useCallback(() => {
    loadingRef.current = false;
    load(0);
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = addListener(() => reload());
    return () => subscription.remove();
  }, [enabled, reload]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    load(items.length);
  }, [hasMore, items.length, load]);

  return { items, loading, hasMore, loadMore, reload };
}
