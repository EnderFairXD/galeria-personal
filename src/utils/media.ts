import { Album, Asset, AssetField, MediaType, Query } from 'expo-media-library';
import { getAlbumsAsync } from 'expo-media-library/legacy';

export type MediaItem = {
  id: string;
  filename: string | null;
  mediaType: MediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
  /** Fecha con la que se ordena y se agrupa. Ver `fetchMediaPage`. */
  date: number | null;
};

export type DeviceAlbum = {
  id: string;
  title: string;
  count: number;
  cover: MediaItem | null;
};

export const PAGE_SIZE = 120;

/**
 * El id de un asset ya es su URI (`content://…` en Android, `ph://…` en iOS), así
 * que sirve como fuente de imagen directamente. Importa porque la alternativa,
 * `asset.getUri()`, es una llamada nativa por foto: con miles de miniaturas el
 * scroll se pararía.
 */
export function mediaUri(item: MediaItem | string): string {
  return typeof item === 'string' ? item : item.id;
}

function buildQuery(options: {
  offset: number;
  limit: number;
  newestFirst: boolean;
  includeVideos: boolean;
  albumId?: string;
}): Query {
  const query = new Query();

  if (options.includeVideos) {
    query.within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO]);
  } else {
    query.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE);
  }

  if (options.albumId) {
    query.album(new Album(options.albumId));
  }

  return query
    .orderBy({ key: AssetField.MODIFICATION_TIME, ascending: !options.newestFirst })
    .offset(options.offset)
    .limit(options.limit);
}

/**
 * Ordena por fecha de modificación, no por `creationTime`: esa es la fecha EXIF
 * (`DATE_TAKEN`) y solo la escriben las cámaras, así que una foto descargada o
 * recibida no la tiene y quedaba sin fecha al final de la lista. La de
 * modificación (`DATE_MODIFIED`) está siempre y es cuando el archivo llegó al
 * móvil, que para una descarga es justo lo que se espera ver; en una foto de la
 * cámara ambas coinciden, porque el archivo se escribe al hacerla.
 */
export async function fetchMediaPage(options: {
  offset: number;
  limit?: number;
  newestFirst?: boolean;
  includeVideos?: boolean;
  albumId?: string;
}): Promise<MediaItem[]> {
  const metadata = await buildQuery({
    offset: options.offset,
    limit: options.limit ?? PAGE_SIZE,
    newestFirst: options.newestFirst ?? true,
    includeVideos: options.includeVideos ?? true,
    albumId: options.albumId,
  }).exeForMetadata();

  return metadata.map((entry) => ({
    id: entry.id,
    filename: entry.filename,
    mediaType: entry.mediaType,
    width: entry.width,
    height: entry.height,
    duration: entry.duration,
    date: entry.modificationTime ?? entry.creationTime,
  }));
}

/**
 * El recuento y el título salen de la API legacy porque los da MediaStore ya
 * contados. Con la API nueva habría que llamar a `album.getAssets()`, que
 * materializa *todos* los assets de *cada* álbum solo para saber cuántos hay:
 * en un móvil con miles de fotos eso agota la memoria y Android cierra la app.
 */
export async function fetchDeviceAlbums(includeVideos: boolean): Promise<DeviceAlbum[]> {
  const albums = await getAlbumsAsync();

  const described = await Promise.all(
    albums.map(async (album) => {
      const cover = await fetchMediaPage({
        offset: 0,
        limit: 1,
        includeVideos,
        albumId: album.id,
      });

      return {
        id: album.id,
        title: album.title,
        count: album.assetCount,
        cover: cover[0] ?? null,
      };
    }),
  );

  return described.filter((album) => album.count > 0).sort((a, b) => b.count - a.count);
}

/** URI a resolución completa, para el visor. */
export async function resolveFullUri(id: string): Promise<string> {
  return new Asset(id).getUri();
}

export async function deleteMedia(ids: string[]): Promise<void> {
  await Asset.delete(ids.map((id) => new Asset(id)));
}

export function formatDuration(milliseconds: number | null): string | null {
  if (!milliseconds) return null;
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

export function monthLabel(creationTime: number | null): string {
  if (!creationTime) return 'Sin fecha';
  const label = monthFormatter.format(new Date(creationTime));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
