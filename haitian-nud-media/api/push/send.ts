import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const adminSecretEnv = process.env.PUSH_ADMIN_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // En-têtes CORS obligatoires pour les requêtes du panel d'administration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body, url, icon, adminSecret } = req.body ?? {};

  // Sécurité renforcée : Comparaison nettoyée des espaces invisibles (.trim)
  if (!adminSecretEnv || !adminSecret || adminSecret.trim() !== adminSecretEnv.trim()) {
    return res.status(403).json({ error: "Forbidden - Secret incorrect" });
  }

  if (!title || !body) {
    return res.status(400).json({ error: "title and body required" });
  }

  if (!vapidPublic || !vapidPrivate) {
    return res.status(503).json({ error: "VAPID keys not configured" });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  webpush.setVapidDetails(
    "mailto:dghaitiannud@gmail.com",
    vapidPublic,
    vapidPrivate
  );

  try {
    // Configuration sécurisée sans localStorage pour Vercel Node
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: subs, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (fetchError) throw fetchError;
    if (!subs || subs.length === 0) {
      return res.json({ ok: true, sent: 0, total: 0, failed: 0 });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? "/",
      icon: icon ?? "/logo.jpg",
    });

    let sent = 0;
    const expired: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub: any) => {
        try {
          if (!sub.endpoint) return;
          await webpush.sendNotification(
            { 
              endpoint: sub.endpoint, 
              keys: { p256dh: sub.p256dh, auth: sub.auth } 
            },
            payload
          );
          sent++;
        } catch (err: any) {
          console.warn("push failed for endpoint:", sub.endpoint, err?.statusCode);
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            expired.push(sub.endpoint);
          }
        }
      })
    );

    if (expired.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    return res.json({ ok: true, sent, total: subs.length, failed: expired.length });
  } catch (err: any) {
    console.error("push/send error:", err);
    return res.status(500).json({ error: "Failed to send notifications", details: err?.message });
  }
}