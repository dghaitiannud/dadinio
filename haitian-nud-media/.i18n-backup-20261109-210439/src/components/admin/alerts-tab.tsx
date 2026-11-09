import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AlertsTab({ token }: {token: string;}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("Nouvelle vidéo disponible !");
  const [body, setBody] = useState("Une nouvelle vidéo vient d'être publiée.");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{sent: number;total: number;failed: number;} | null>(null);

  const handleSend = async () => {
    if (!title || !body) {
    toast.error("Titre et message requis");
    return;
  }
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("https://api.haitiannud.com/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, body, url, icon: "/logo.jpg" })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Erreur serveur");
      setResult(res);
      toast.success(`${res.sent}/${res.total} envoyées !`);
    } catch (e: any) {toast.error(e?.message || "Erreur");} finally
    {setSending(false);}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> {t("Envoyer un Push")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>{t('common.title')}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>{t('common.message')}</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></div>
          <div className="space-y-2"><Label>Lien</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" /></div>
          <Button onClick={handleSend} disabled={sending} className="w-full">{sending ? t("Envoi...") : t("Envoyer à tous")}</Button>
          {result && <div className="p-3 rounded-lg bg-primary/10 text-sm text-center">✅ {result.sent} {t("envoyées ·")} {result.failed} {t("expirées ·")} {result.total} total</div>}
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Infos</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>Table <code>push_subscriptions</code> {t("requise.")}</p>
        </CardContent>
      </Card>
    </div>);

}