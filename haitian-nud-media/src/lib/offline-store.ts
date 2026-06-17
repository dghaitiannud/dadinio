// Offline video storage using IndexedDB
// Stores video metadata + video blob for offline viewing
// Limit: 5 videos max (100MB each = ~500MB limit)

const DB_NAME = "haitian-nud-offline";
const DB_VERSION = 1;
const STORE_NAME = "videos";
const MAX_OFFLINE_VIDEOS = 5;

interface OfflineVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoBlob: Blob;
  durationSec: number;
  category: string;
  downloadedAt: number;
  sizeBytes: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function listOfflineVideos(): Promise<OfflineVideo[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("Offline store not available:", err);
    return [];
  }
}

export async function getOfflineVideo(id: string): Promise<OfflineVideo | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function saveOfflineVideo(video: Omit<OfflineVideo, "downloadedAt" | "sizeBytes">): Promise<void> {
  const db = await openDB();
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (count >= MAX_OFFLINE_VIDEOS) {
    db.close();
    throw new Error(`Limite atteinte : ${MAX_OFFLINE_VIDEOS} vidéos maximum. Supprimez une vidéo pour en ajouter une autre.`);
  }

  const entry: OfflineVideo = {
    ...video,
    downloadedAt: Date.now(),
    sizeBytes: video.videoBlob.size,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function deleteOfflineVideo(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function downloadAndSaveVideo(
  videoId: string,
  videoUrl: string,
  title: string,
  description: string,
  thumbnailUrl: string,
  durationSec: number,
  category: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const response = await fetch(videoUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Erreur de téléchargement : ${response.status}`);
  }

  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Impossible de lire le flux vidéo");
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }

  const blob = new Blob(chunks as BlobPart[]);
  await saveOfflineVideo({
    id: videoId,
    title,
    description,
    thumbnailUrl,
    videoBlob: blob,
    durationSec,
    category,
  });
}

export function getOfflineVideoUrl(video: OfflineVideo): string {
  return URL.createObjectURL(video.videoBlob);
}

export function revokeOfflineVideoUrl(url: string) {
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export { MAX_OFFLINE_VIDEOS };
export type { OfflineVideo };
