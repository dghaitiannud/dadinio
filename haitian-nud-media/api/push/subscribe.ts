import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurer les en-têtes CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subscription, userId } = req.body ?? {};

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription payload" });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase environment variables are missing on Vercel" });
  }

  // 🚨 OPTIONNEL : PROTECTION SÉCURITÉ ADMIN (Anti-usurpation)
  // Si quelqu'un essaie d'envoyer userId: "admin" depuis l'extérieur, on peut bloquer
  // ou s'assurer que c'est bien toi. Si tu n'as pas de système d'auth complexe ici,
  // tu peux laisser passer, mais l'idéal est de valider ton propre e-mail par exemple.
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || null;
    const auth = keys.auth || null;

    // Insertion ou mise à jour (upsert)
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: p256dh,
        auth: auth,
        user_id: userId ? String(userId) : null, // 🌟 Stockera "admin" ou l'ID de l'user
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Supabase Database Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Serverless Function Crash:", err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: err?.message || String(err) 
    });
  }
}