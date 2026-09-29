import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { forgetAssets } from '@/utils/custom-albums';
import { deleteMedia, type MediaItem } from '@/utils/media';
import { setPendingSelection } from '@/utils/pending-selection';

interface UseMediaActionsResult {
  addToAlbum: (items: MediaItem[]) => void;
  confirmDelete: (items: MediaItem[]) => void;
}

/** Acciones compartidas por todas las cuadrículas con selección múltiple. */
export function useMediaActions(onDone: () => void): UseMediaActionsResult {
  const addToAlbum = useCallback(
    (items: MediaItem[]) => {
      setPendingSelection(items);
      onDone();
      router.push('/choose-album');
    },
    [onDone],
  );

  const confirmDelete = useCallback(
    (items: MediaItem[]) => {
      const label =
        items.length === 1 ? 'este elemento' : `estos ${items.length} elementos`;

      Alert.alert('Eliminar', `¿Eliminar ${label} del dispositivo?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ids = items.map((item) => item.id);
            await deleteMedia(ids);
            // Si no, los álbumes propios guardarían referencias a fotos que ya no existen.
            await forgetAssets(ids);
            onDone();
          },
        },
      ]);
    },
    [onDone],
  );

  return { addToAlbum, confirmDelete };
}
