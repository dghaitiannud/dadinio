import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function AdsTab({ token }: { token: string }) {
  const [ads, setAds] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", type: "pre-roll", trigger: 0, skip: 5, resolution: "720p", clickUrl: "", language: "fr" });
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");

  const loadAds = async () => {
    const { data } = await supabase.from('video_ads').select('*').order('created_at', { ascending: false });
    setAds(data || []);
  };

  useEffect(() => { loadAds(); }, []);

  const handleUpload = async () => {
    if (!file || !form.title) return toast.error("Titre et fichier requis");

    const jobId = crypto.randomUUID();
    setStatus("uploading");
    setProgress(0);
    setMessage("Connexion...");

    const es = new EventSource(`https://api.haitiannud.com/api/upload-progress/${jobId}?token=${token}`);

    es.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data.percent);
      setMessage(data.message);
      if (data.step === "transcode" || data.step === "upload") setStatus("processing");
    });

    es.addEventListener("complete", async (e) => {
      const data = JSON.parse(e.data);
      es.close();

      await supabase.from("video_ads").insert({
        title: form.title,
        ad_video_url: data.url,
        ad_type: form.type,
        trigger_seconds: form.trigger,
        skip_after: form.skip,
        resolution: form.resolution,
        click_url: form.clickUrl || null,
        language: form.language,
      });

      toast.success("Pub ajoutée avec succès !");
      setStatus("idle");
      setFile(null);
      setForm({ title: "", type: "pre-roll", trigger: 0, skip: 5, resolution: "720p", clickUrl: "", language: "fr" });
      loadAds();
    });

    es.addEventListener("error", (e: any) => {
      if (e.data) {
        toast.error(JSON.parse(e.data).message);
        setStatus("idle");
        es.close();
      }
    });

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", form.title);
    formData.append("resolution", form.resolution);
    formData.append("jobId", jobId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.haitiannud.com/api/upload-ad");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setProgress(Math.round(pct * 0.1));
        setMessage(`Envoi... (${pct}%)`);
      }
    };

    xhr.onload = () => {
      if (xhr.status !== 200) {
        toast.error("Erreur lors de l'envoi");
        setStatus("idle");
      }
    };
    xhr.send(formData);
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Gestion des Publicités</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Titre de la campagne</Label><Input placeholder="Promo VIP" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="space-y-2"><Label>Langue de la pub</Label>
            <Select value={form.language} onValueChange={v => setForm({...form, language: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem><SelectItem value="ht">Kreyòl</SelectItem>
                <SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Résolution</Label>
            <Select value={form.resolution} onValueChange={v => setForm({...form, resolution: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="720p">720p</SelectItem><SelectItem value="1080p">1080p</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Type de pub</Label>
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="pre-roll">Pre-roll</SelectItem><SelectItem value="mid-roll">Mid-roll</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Déclencher à (sec)</Label><Input type="number" value={form.trigger} onChange={e => setForm({...form, trigger: Number(e.target.value)})} /></div>
          <div className="space-y-2"><Label>Skip après (sec)</Label><Input type="number" value={form.skip} onChange={e => setForm({...form, skip: Number(e.target.value)})} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Lien (En savoir plus)</Label><Input placeholder="https://haitiannud.com/plans" value={form.clickUrl} onChange={e => setForm({...form, clickUrl: e.target.value})} /></div>
        </div>

        <div className="border-t pt-4">
          <Label>Fichier vidéo (MP4)</Label>
          <Input type="file" accept="video/mp4" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2" disabled={status !== "idle"} />
          {status !== "idle" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">{message}</p>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden"><div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          <Button onClick={handleUpload} disabled={status !== "idle" || !file} className="w-full mt-4">{status === "idle" ? "Uploader la pub" : "Traitement..."}</Button>
        </div>

        <div className="space-y-2 mt-6">
          <h3 className="font-bold text-sm">Pubs existantes</h3>
          {ads.map(ad => (
            <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
              <div>
                <p className="font-bold text-sm">{ad.title} <span className="text-xs text-muted-foreground">({ad.language})</span></p>
                <p className="text-xs text-muted-foreground">{ad.ad_type} - {ad.resolution} - Skip: {ad.skip_after}s</p>
              </div>
              <Button variant="destructive" size="sm" onClick={async () => { await supabase.from('video_ads').delete().eq('id', ad.id); loadAds(); }}>Suppr</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}