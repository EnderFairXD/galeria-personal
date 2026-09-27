import { Album, Asset, AssetField, MediaType, Query } from 'expo-media-library';

export type MediaItem = {
  id: string;
  filename: string | null;
  mediaType: MediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
  creationTime: number | null;
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
    .orderBy({ key: AssetField.CREATION_TIME, ascending: !options.newestFirst })
    .offset(options.offset)
    .limit(options.limit);
}

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
    creationTime: entry.creationTime,
  }));
}

export async function fetchDeviceAlbums(includeVideos: boolean): Promise<DeviceAlbum[]> {
  const albums = await Album.getAll();

  const described = await Promise.all(
    albums.map(async (album) => {
      const [title, firstPage] = await Promise.all([
        album.getTitle(),
        fetchMediaPage({ offset: 0, limit: 1, includeVideos, albumId: album.id }),
      ]);
      const assets = await album.getAssets();

      return {
        id: album.id,
        title,
        count: assets.length,
        cover: firstPage[0] ?? null,
      };
    }),
  );

  return described
    .filter((album) => album.count > 0)
    .sort((a, b) => b.count - a.count);
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
