const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const sameYearFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });
const otherYearFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Clave de agrupación: el día natural, no la etiqueta — dos días distintos
 * nunca deben caer en el mismo grupo aunque se muestren parecidos. */
export function dayKey(creationTime: number | null): string {
  if (!creationTime) return 'sin-fecha';
  const date = new Date(creationTime);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(creationTime: number | null): string {
  if (!creationTime) return 'Sin fecha';

  const date = new Date(creationTime);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysAgo = Math.round((startOfToday.getTime() - startOfDay.getTime()) / MILLISECONDS_PER_DAY);

  if (daysAgo === 0) return 'Hoy';
  if (daysAgo === 1) return 'Ayer';
  if (daysAgo > 1 && daysAgo < 7) return capitalize(weekdayFormatter.format(date));
  if (date.getFullYear() === today.getFullYear()) return capitalize(sameYearFormatter.format(date));
  return capitalize(otherYearFormatter.format(date));
}
