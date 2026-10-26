import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { endpoint } = req.body ?? {};

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase environment variables are missing on Vercel" });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("push/unsubscribe error:", err);
    return res.status(500).json({ error: "Failed to remove subscription" });
  }
}