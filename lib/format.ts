export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
