import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminListTickets, adminReplyTicket, type SupportTicket } from "@/lib/supabase-db";

export function TicketsTab({ token }: { token: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyPending, setReplyPending] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try { const t = await adminListTickets(); setTickets(t); } 
    catch (err) { toast.error("Erreur"); }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText) return;
    setReplyPending(true);
    try {
      await adminReplyTicket(selectedTicket.id, replyText);
      toast.success("Réponse envoyée");
      try {
        await fetch("https://api.haitiannud.com/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            title: "📩 Réponse à votre ticket",
            body: `Le support a répondu à : "${selectedTicket.subject}"`,
            url: "/account", icon: "/logo.jpg", targetUserId: selectedTicket.userId
          })
        });
      } catch (pushErr) { console.warn("Échec push:", pushErr); }
      setSelectedTicket(null);
      setReplyText("");
      await loadTickets();
    } catch (e: any) { toast.error(e?.message || "Erreur"); } 
    finally { setReplyPending(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-card">
        <CardHeader><CardTitle>Messages & tickets</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {tickets.map((t) => (
              <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedTicket?.id === t.id ? 'border-primary' : 'border-border'}`}>
                <div className="flex justify-between"><h4 className="font-semibold">{t.subject}</h4><span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>{t.status}</span></div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1 bg-card">
        <CardHeader><CardTitle>Répondre</CardTitle></CardHeader>
        <CardContent>
          {selectedTicket ? (
            <div className="space-y-4">
              <div><Label className="text-muted-foreground">Original</Label><div className="p-3 bg-muted rounded mt-1 text-sm">{selectedTicket.message}</div></div>
              <div className="space-y-2"><Label>Votre Réponse</Label><Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} /></div>
              <Button onClick={handleReply} disabled={!replyText || replyPending} className="w-full">{replyPending ? "Envoi..." : "Envoyer"}</Button>
            </div>
          ) : <div className="text-center py-12 text-muted-foreground">Sélectionnez un ticket</div>}
        </CardContent>
      </Card>
    </div>
  );
}