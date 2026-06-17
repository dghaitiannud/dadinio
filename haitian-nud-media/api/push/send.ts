import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body, url, icon, adminSecret } = req.body ?? {};

  if (adminSecret !== process.env.PUSH_ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!title || !body) {
    return res.status(400).json({ error: "title and body required" });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

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
    const supabase = createClient(supabaseUrl || 'https://lcfnjxqademkrcocvtlo.supabase.co', supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm5qeHFhZGVta3Jjb2N2dGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3NzU0OCwiZXhwIjoyMDk3MjUzNTQ4fQ.tHEKo3Wt1iCGRGXJcc_JatAFoTdRqsonAqhMXkhzfYk');
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
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          console.warn("push failed:", sub.endpoint, err?.statusCode);
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
    return res.status(500).json({ error: "Failed to send notifications" });
  }
}
