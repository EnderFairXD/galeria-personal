import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useSettings } from '@/hooks/use-settings';
import { getCustomAlbums, type CustomAlbum } from '@/utils/custom-albums';
import { getHiddenAlbumIds } from '@/utils/hidden-albums';
import { fetchDeviceAlbums, type DeviceAlbum } from '@/utils/media';

interface UseAlbumsResult {
  custom: CustomAlbum[];
  device: DeviceAlbum[];
  hidden: Set<string>;
  reload: () => void;
}

export function useAlbums(): UseAlbumsResult {
  const { settings } = useSettings();
  const [custom, setCustom] = useState<CustomAlbum[]>([]);
  const [device, setDevice] = useState<DeviceAlbum[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [customAlbums, deviceAlbums, hiddenIds] = await Promise.all([
      getCustomAlbums(),
      fetchDeviceAlbums(settings.includeVideos),
      getHiddenAlbumIds(),
    ]);
    setCustom(customAlbums);
    setDevice(deviceAlbums);
    setHidden(new Set(hiddenIds));
  }, [settings.includeVideos]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { custom, device, hidden, reload: load };
}
