import { useCallback, useState } from 'react';

interface UseSelectionResult {
  selected: Set<string> | null;
  active: boolean;
  start: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export function useSelection(): UseSelectionResult {
  const [selected, setSelected] = useState<Set<string> | null>(null);

  const start = useCallback((id: string) => setSelected(new Set([id])), []);

  const toggle = useCallback((id: string) => {
    setSelected((previous) => {
      const next = new Set(previous ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Quedarse en modo selección sin nada elegido deja la pantalla en un
      // estado raro del que solo se sale por el botón de cancelar.
      return next.size === 0 ? null : next;
    });
  }, []);

  const clear = useCallback(() => setSelected(null), []);

  return { selected, active: selected !== null, start, toggle, clear };
}
