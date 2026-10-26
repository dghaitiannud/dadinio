import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { adminListVideos, adminCreateVideo, adminDeleteVideo, type Video } from "@/lib/supabase-db";
import { CURRENT_YEAR, YEARS } from "./admin-utils";
import { VideoUploader } from "./video-uploader";

export function VideosTab({ token }: { token: string }) {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [contentType, setContentType] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [formData, setFormData] = useState({ title: "", description: "", thumbnailUrl: "", videoUrl: "", durationSec: 120, isVip: false, published: true });
  const [createPending, setCreatePending] = useState(false);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const buildCategory = () => `${contentType.trim()} ${year}`.trim();

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    try {
      const v = await adminListVideos();
      setVideos(v);
    } catch (err) {
      toast.error("Erreur de chargement des vidéos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePending(true);
    try {
      await adminCreateVideo({ ...formData, category: buildCategory() });
      toast.success("Vidéo ajoutée");
      setOpen(false);
      setFormData({ title: "", description: "", thumbnailUrl: "", videoUrl: "", durationSec: 120, isVip: false, published: true });
      setContentType("");
      setYear(String(CURRENT_YEAR));
      await loadVideos();
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'ajout");
    } finally {
      setCreatePending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette vidéo ?")) return;
    setDeletePending(id);
    try {
      await adminDeleteVideo(id);
      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success("Vidéo supprimée");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de suppression");
    } finally {
      setDeletePending(null);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Gestion des Vidéos</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2"><UploadCloud className="h-4 w-4" /> Uploader & Convertir</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Usine à Vidéo (MP4 → HLS)</DialogTitle></DialogHeader>
              <VideoUploader 
                token={token} 
                onUploadSuccess={(url) => {
                  setUploadOpen(false);
                  setFormData({ ...formData, videoUrl: url });
                  setOpen(true);
                  toast.success("URL HLS prête ! Complétez les informations.");
                }} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Ajouter manuellement</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle Vidéo</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>{t('common.title')}</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('common.category')}</Label><Input required placeholder="ex: Kompa, Rasin..." value={contentType} onChange={e => setContentType(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Année</Label><Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">Catégorie finale : <span className="font-semibold text-foreground">{buildCategory() || "—"}</span></div>
                <div className="space-y-2"><Label>Description</Label><Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>URL Miniature</Label><Input required value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} /></div>
                <div className="space-y-2"><Label>URL Vidéo (HLS Master)</Label><Input required value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Durée (sec)</Label><Input type="number" required value={formData.durationSec} onChange={e => setFormData({ ...formData, durationSec: Number(e.target.value) })} /></div>
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="flex items-center gap-2"><Switch checked={formData.isVip} onCheckedChange={c => setFormData({ ...formData, isVip: c })} /><Label>Réservé VIP</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={formData.published} onCheckedChange={c => setFormData({ ...formData, published: c })} /><Label>Publié</Label></div>
                  </div>
                </div>
                <Button type="submit" disabled={createPending} className="w-full mt-4">{createPending ? "Enregistrement..." : "Enregistrer la vidéo"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto rounded-xl border border-border">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead>{t('common.title')}</TableHead><TableHead>{t('common.category')}</TableHead><TableHead>Vues</TableHead><TableHead>{t('common.vip')}</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {videos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.title}</TableCell>
                    <TableCell><span className="px-2 py-1 bg-accent rounded text-xs">{v.category}</span></TableCell>
                    <TableCell>{v.views}</TableCell>
                    <TableCell>{v.isVip ? "Oui" : "Non"}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} disabled={deletePending === v.id} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}