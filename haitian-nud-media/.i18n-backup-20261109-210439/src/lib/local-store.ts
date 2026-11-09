const HISTORY_KEY = "hnm.watchHistory";
const NOTIF_KEY = "hnm.notifications";

export interface WatchEntry {
  id: string;
  title: string;
  thumbnailUrl: string;
  watchedAt: number;
}

export function getWatchHistory(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushWatchHistory(entry: Omit<WatchEntry, "watchedAt">) {
  try {
    const list = getWatchHistory().filter(e => e.id !== entry.id);
    list.unshift({ ...entry, watchedAt: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    // ignore
  }
}

export function clearWatchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export interface NotifPrefs {
  newVideos: boolean;
  vipOffers: boolean;
  ticketReplies: boolean;
}

const DEFAULT_NOTIFS: NotifPrefs = { newVideos: true, vipOffers: true, ticketReplies: true };

export function getNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) return DEFAULT_NOTIFS;
    return { ...DEFAULT_NOTIFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFS;
  }
}

export function setNotifPrefs(prefs: NotifPrefs) {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
