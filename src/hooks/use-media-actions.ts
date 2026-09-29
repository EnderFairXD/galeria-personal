import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import type { MediaItem } from '@/utils/media';
import { setPendingSelection } from '@/utils/pending-selection';
import { moveToTrash, TRASH_RETENTION_DAYS } from '@/utils/trash';

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

      Alert.alert(
        'Mover a la papelera',
        `Se quitará ${label} del móvil. Podrás recuperarlo durante ${TRASH_RETENTION_DAYS} días.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Mover a la papelera',
            style: 'destructive',
            onPress: async () => {
              try {
                await moveToTrash(items);
              } catch {
                // Cancelar el diálogo de borrado de Android lanza excepción: no
                // es un fallo, simplemente las fotos siguen donde estaban.
              }
              onDone();
            },
          },
        ],
      );
    },
    [onDone],
  );

  return { addToAlbum, confirmDelete };
}
