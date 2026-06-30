import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Initialisation unique à l'extérieur du handler pour de meilleures performances sur Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurer les en-têtes CORS pour autoriser les requêtes du frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Gérer la requête de pré-vérification (Preflight) CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Refuser toutes les méthodes qui ne sont pas du POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subscription, userId } = req.body ?? {};

  // Vérification de la présence de l'endpoint essentiel à Web-Push
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription payload" });
  }

  // Vérification des variables d'environnement sur le serveur
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase environment variables are missing on Vercel" });
  }

  try {
    // Initialisation sécurisée du client Supabase pour l'environnement Serverless (sans localStorage)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Extraction sécurisée des clés pour parer aux différences entre navigateurs (Chrome vs Firefox)
    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || null;
    const auth = keys.auth || null;

    // Insertion ou mise à jour (upsert) dans la table de base de données
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: p256dh,
        auth: auth,
        user_id: userId ? String(userId) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    // Si Supabase renvoie une erreur d'insertion
    if (error) {
      console.error("Supabase Database Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    // Tout s'est bien passé !
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    // Capture de tout crash inattendu du script
    console.error("Serverless Function Crash:", err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: err?.message || String(err) 
    });
  }
}