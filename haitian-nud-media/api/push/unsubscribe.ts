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

  const supabaseUrl = process.env.SUPABASE_URL || 'https://lcfnjxqademkrcocvtlo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm5qeHFhZGVta3Jjb2N2dGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3NzU0OCwiZXhwIjoyMDk3MjUzNTQ4fQ.tHEKo3Wt1iCGRGXJcc_JatAFoTdRqsonAqhMXkhzfYk';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Supabase not configured" });
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
