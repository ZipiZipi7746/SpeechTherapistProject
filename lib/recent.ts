/** Recent searches are a per-device convenience (localStorage), not account data. */
export interface RecentSearch { query: string; label: string; at: number }
const KEY = "speechsearch_recent_searches";

export function getRecent(): RecentSearch[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentSearch[]; } catch { return []; }
}

export function addRecent(query: string, label: string) {
  if (!query) return;
  try {
    const list = getRecent().filter((r) => r.query !== query);
    list.unshift({ query, label, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6)));
  } catch { /* storage unavailable */ }
}

export function clearRecent() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
