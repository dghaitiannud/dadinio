// Web Push Notifications — frontend helpers
// VAPID public key (safe to expose in client)
const VAPID_PUBLIC_KEY = "BAM-Ab_FHCm2P3q0n-DmuqdOyQOuwBOR6LAxbGjc4wbsqU6JN1rvsIAtmlbpCN0s62PjXgMlKUAyBxCO9UIE6FM";

// API routes are Vercel Serverless Functions at /api/push/*
// Same origin — no cross-domain issues
const API_BASE = "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermission(): PushPermission {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermission;
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (!isPushSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  return result as PushPermission;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(userId?: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await requestPushPermission();
  if (permission !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Unsubscribe any existing
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });

    const subJson = sub.toJSON();
    const response = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subJson, userId }),
    });

    return response.ok;
  } catch (err) {
    console.warn("Push subscribe error:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;

    await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
    return true;
  } catch (err) {
    console.warn("Push unsubscribe error:", err);
    return false;
  }
}

export async function sendPushToAll(
  adminSecret: string,
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; total: number; failed: number } | null> {
  try {
    const response = await fetch(`${API_BASE}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, title, body, url }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).error || "Erreur serveur");
    }
    return await response.json();
  } catch (err) {
    console.warn("Push send error:", err);
    return null;
  }
}
