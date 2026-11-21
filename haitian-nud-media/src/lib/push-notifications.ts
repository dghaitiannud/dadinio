import { supabase } from "@/lib/supabase";

// Web Push Notifications — frontend helpers.
// The Node API is the single source of truth for subscriptions and delivery.
async function fetchVapidPublicKey(): Promise<Uint8Array> {
  const response = await fetch(`${API_BASE}/api/push/vapid-public-key`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve the push public key");
  }

  const payload = await response.json();
  if (typeof payload?.publicKey !== "string" || !payload.publicKey) {
    throw new Error("Push public key is unavailable");
  }

  return urlBase64ToUint8Array(payload.publicKey);
}

function hasMatchingApplicationServerKey(
  subscription: PushSubscription,
  expectedKey: Uint8Array
): boolean {
  const currentKey = subscription.options.applicationServerKey;
  if (!currentKey) return false;

  const currentBytes = new Uint8Array(currentKey);
  return (
    currentBytes.length === expectedKey.length &&
    currentBytes.every((byte, index) => byte === expectedKey[index])
  );
}

const API_BASE = "https://api.haitiannud.com";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export type PushPermission =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

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
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(_userId?: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // A client-supplied userId is not an identity credential.
    // The API associates the subscription using this verified access token.
    if (sessionError || !session?.access_token) return false;

    const permission = await requestPushPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = await fetchVapidPublicKey();
    let subscription = await registration.pushManager.getSubscription();
    let createdSubscription = false;

    // Keep the current endpoint unless the VAPID public key has been rotated.
    if (
      subscription &&
      !hasMatchingApplicationServerKey(subscription, applicationServerKey)
    ) {
      const removalResponse = await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      if (!removalResponse.ok) return false;

      await subscription.unsubscribe();
      subscription = null;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as ArrayBuffer,
      });
      createdSubscription = true;
    }

    const response = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      if (createdSubscription) {
        await subscription.unsubscribe().catch(() => undefined);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Push subscribe error:", error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: "POST",
      headers,
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) return false;

    return await subscription.unsubscribe();
  } catch (error) {
    console.warn("Push unsubscribe error:", error);
    return false;
  }
}

export async function notifyAdminsOfVipRequest(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) return false;

    const response = await fetch(
      `${API_BASE}/api/push/notify-admin-vip`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.warn("VIP admin notification error:", error);
    return false;
  }
}
