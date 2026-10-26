import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
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
import { adminListPhotos, adminCreatePhoto, adminDeletePhoto, type Photo } from "@/lib/supabase-db";
import { CURRENT_YEAR, YEARS } from "./admin-utils";

export function PhotosTab() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [formData, setFormData] = useState({ title: "", description: "", imageUrl: "", isVip: false, published: true });
  const [createPending, setCreatePending] = useState(false);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const buildCategory = () => `${contentType.trim()} ${year}`.trim();

  useEffect(() => { loadPhotos(); }, []);

  const loadPhotos = async () => {
    try { const p = await adminListPhotos(); setPhotos(p); } 
    catch (err) { toast.error("Erreur de chargement"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePending(true);
    try {
      await adminCreatePhoto({ ...formData, category: buildCategory() });
      toast.success("Photo ajoutée !");
      setOpen(false);
      setFormData({ title: "", description: "", imageUrl: "", isVip: false, published: true });
      await loadPhotos();
    } catch (err: any) { toast.error(err?.message || "Erreur"); } 
    finally { setCreatePending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Retirer cette photo ?")) return;
    setDeletePending(id);
    try {
      await adminDeletePhoto(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      toast.success("Photo archivée");
    } catch (err: any) { toast.error(err?.message || "Erreur"); } 
    finally { setDeletePending(null); }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Galerie Photo</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Ajouter une photo</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nouvelle Photo</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Titre</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t('common.category')}</Label><Input required value={contentType} onChange={e => setContentType(e.target.value)} /></div>
                <div className="space-y-2"><Label>Année</Label><Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL de la Photo</Label><Input required value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
              <div className="flex gap-6 mt-2">
                <div className="flex items-center gap-2"><Switch checked={formData.isVip} onCheckedChange={c => setFormData({ ...formData, isVip: c })} /><Label>VIP</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.published} onCheckedChange={c => setFormData({ ...formData, published: c })} /><Label>Publier</Label></div>
              </div>
              <Button type="submit" disabled={createPending} className="w-full mt-4">{createPending ? "Envoi..." : "Ajouter"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Aperçu</TableHead><TableHead>{t('common.title')}</TableHead><TableHead>{t('common.category')}</TableHead><TableHead>Vues</TableHead><TableHead>{t('common.vip')}</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {photos.map((p) => (
              <TableRow key={p.id}>
                <TableCell><img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded border" /></TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.views || 0}</TableCell>
                <TableCell>{p.isVip ? "Oui" : "Non"}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={deletePending === p.id} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}