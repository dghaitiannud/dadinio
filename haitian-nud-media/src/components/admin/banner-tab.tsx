import { useState, useEffect } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getBannerVideo, updateBannerVideo } from "@/lib/supabase-db";import { useTranslation } from "react-i18next";

export function BannerTab() {const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {getBannerVideo().then((res) => setUrl(res)).catch(console.error);}, []);

  const handleSave = async () => {
    setPending(true);
    try {await updateBannerVideo(url);toast.success("Mise à jour !");}
    catch (e) {toast.error("Erreur");} finally
    {setPending(false);}
  };

  const handleClear = async () => {
    if (!confirm("Retirer la vidéo de fond ?")) return;
    setPending(true);
    try {await updateBannerVideo("");setUrl("");toast.success("Réinitialisé");}
    catch (e) {toast.error("Erreur");} finally
    {setPending(false);}
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-primary" /> {t("Vidéo de Fond (Accueil)")}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("URL .mp4")} className="flex-1" />
          <Button onClick={handleSave} disabled={pending}>{pending ? "..." : "Enregistrer"}</Button>
          {url && <Button variant="destructive" onClick={handleClear} disabled={pending}>Suppr</Button>}
        </div>
        {url &&
        <div className="relative w-full aspect-video max-w-xl bg-black rounded-xl overflow-hidden border">
            <video src={url} autoPlay muted loop playsInline controls={false} className="w-full h-full object-cover pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black flex flex-col justify-end p-4">
              <h4 className="text-xl font-bold text-white">{t("HAITIAN NUD")}</h4>
            </div>
          </div>
        }
      </CardContent>
    </Card>);

}