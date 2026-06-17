import { Router, type IRouter } from "express";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:dghaitiannud@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// GET /api/push/vapid-public-key
router.get("/push/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
// Body: { subscription: PushSubscription, userId?: string }
router.post("/push/subscribe", async (req, res) => {
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
      user_id: userId || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    res.json({ ok: true });
  } catch (err) {
    logger.error(err, "push/subscribe error");
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// POST /api/push/unsubscribe
// Body: { endpoint: string }
router.post("/push/unsubscribe", async (req, res) => {
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
// Body: { title, body, url?, icon?, adminSecret }
router.post("/push/send", async (req, res) => {
  const { title, body, url, icon, adminSecret } = req.body;

  // Simple secret check
  if (adminSecret !== process.env.PUSH_ADMIN_SECRET) {
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
      res.json({ ok: true, sent: 0, total: 0 });
      return;
    }

    const payload = JSON.stringify({ title, body, url: url || "/", icon: icon || "/logo.jpg" });
    let sent = 0;
    const failed: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
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
          // If subscription expired (410 Gone), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            failed.push(sub.endpoint);
          }
        }
      })
    );

    // Cleanup expired subscriptions
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
