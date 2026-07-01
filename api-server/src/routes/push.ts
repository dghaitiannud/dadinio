import { Router, type IRouter, type Request, type Response } from "express";
import webpush from "web-push";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const env = (globalThis as any).process?.env || {};

const VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY || "";
const SUPABASE_URL = env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || "";
const PUSH_ADMIN_SECRET = env.PUSH_ADMIN_SECRET || "";

const SUPABASE_REST_URL = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:dghaitiannud@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

function getSupabaseHeaders() {
  return {
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    apikey: SUPABASE_SERVICE_KEY,
    "Content-Type": "application/json",
  };
}

async function supabaseRequest(path: string, init: any = {}) {
  const fetchFn = (globalThis as any).fetch;
  if (!fetchFn) {
    throw new Error("Fetch is not available in this environment");
  }

  const response = await fetchFn(`${SUPABASE_REST_URL}${path}`, {
    ...init,
    headers: {
      ...getSupabaseHeaders(),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getSupabase() {
  return {
    from: (table: string) => {
      const basePath = `/${encodeURIComponent(table)}`;

      return {
        upsert: async (row: any, options: any = {}) => {
          const params = options.onConflict ? `?on_conflict=${encodeURIComponent(options.onConflict)}` : "";
          return supabaseRequest(`${basePath}${params}`, {
            method: "POST",
            body: JSON.stringify(row),
          });
        },
        select: async (select: string) => {
          return supabaseRequest(`${basePath}?select=${encodeURIComponent(select)}`);
        },
        delete: () => {
          return {
            eq: async (column: string, value: any) => {
              const encoded = encodeURIComponent(String(value));
              return supabaseRequest(`${basePath}?${encodeURIComponent(column)}=eq.${encoded}`, {
                method: "DELETE",
              });
            },
            in: async (column: string, values: any[]) => {
              const encodedValues = values.map((value) => encodeURIComponent(String(value))).join(",");
              return supabaseRequest(`${basePath}?${encodeURIComponent(column)}=in.(${encodedValues})`, {
                method: "DELETE",
              });
            },
          };
        },
      };
    },
  };
}

// GET /api/push/vapid-public-key
router.get("/push/vapid-public-key", (_req: Request, res: Response) => {
  if (!VAPID_PUBLIC_KEY) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post("/push/subscribe", async (req: Request, res: Response) => {
  const { subscription, userId } = req.body;
  if (!subscription?.endpoint) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }

  try {
    const supabase = getSupabase();
    await supabase.from("push_subscriptions").upsert({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      user_id: userId ? String(userId) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    res.json({ ok: true });
  } catch (err) {
    logger.error(err, "push/subscribe error");
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// POST /api/push/unsubscribe
router.post("/push/unsubscribe", async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "endpoint required" });
    return;
  }
  try {
    const supabase = getSupabase();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    res.json({ ok: true });
  } catch (err) {
    logger.error(err, "push/unsubscribe error");
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

// POST /api/push/send
router.post("/push/send", async (req: Request, res: Response) => {
  const { title, body, url, icon, adminSecret } = req.body;

  // 🔴 BLOC DE DÉBOGAGE POUR EXPRESS API-SERVER LOGS
  console.log("=== EXPRESS BACKEND PUSH DEBUG ===");
  console.log("Secret reçu (adminSecret) :", adminSecret ? `"${adminSecret}"` : "VIDE");
  console.log("Secret attendu (PUSH_ADMIN_SECRET) :", PUSH_ADMIN_SECRET ? `"${PUSH_ADMIN_SECRET}"` : "VIDE");
  console.log("==================================");

  // Comparaison propre nettoyée des espaces
  if (!PUSH_ADMIN_SECRET || !adminSecret || adminSecret.trim() !== PUSH_ADMIN_SECRET.trim()) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (!title || !body) {
    res.status(400).json({ error: "title and body required" });
    return;
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    res.status(503).json({ error: "Push not configured" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data: subs } = await supabase.from("push_subscriptions").select("*");
    if (!subs || subs.length === 0) {
      res.json({ ok: true, sent: 0, total: 0, failed: 0 });
      return;
    }

    const payload = JSON.stringify({ title, body, url: url || "/", icon: icon || "/logo.jpg" });
    let sent = 0;
    const failed: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
          if (!sub.endpoint) return;
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          logger.warn({ endpoint: sub.endpoint, err: err.message }, "Failed to send push");
          if (err.statusCode === 410 || err.statusCode === 404) {
            failed.push(sub.endpoint);
          }
        }
      })
    );

    if (failed.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", failed);
    }

    logger.info({ sent, total: subs.length, failed: failed.length }, "Push notifications sent");
    res.json({ ok: true, sent, total: subs.length, failed: failed.length });
  } catch (err) {
    logger.error(err, "push/send error");
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

export default router;