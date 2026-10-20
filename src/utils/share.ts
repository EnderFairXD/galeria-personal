import { MediaType } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { resolveFullUri, type MediaItem } from './media';

/**
 * Abre el menú de compartir de Android (WhatsApp, Drive, correo…).
 *
 * Hay que pasarle la ruta `file://` del archivo, no el `content://` que usamos
 * como id: expo-sharing rechaza cualquier esquema que no sea `file`. Comparte
 * un elemento cada vez, porque mandar varios necesita otro tipo de intent que
 * la librería no expone.
 */
export async function shareMedia(item: MediaItem): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;

  const uri = await resolveFullUri(item.id);

  await Sharing.shareAsync(uri, {
    mimeType: item.mediaType === MediaType.VIDEO ? 'video/*' : 'image/*',
    dialogTitle: 'Compartir',
  });
}
