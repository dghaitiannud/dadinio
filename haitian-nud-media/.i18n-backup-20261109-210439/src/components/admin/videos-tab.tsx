import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, UploadCloud, Film, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  adminListVideos,
  adminCreateVideo,
  adminDeleteVideo,
  type Video,
} from "@/lib/supabase-db";
import { CURRENT_YEAR, YEARS } from "./admin-utils";
import { VideoUploader } from "./video-uploader";

const INITIAL_FORM = {
  title: "",
  description: "",
  thumbnailUrl: "",
  videoUrl: "",
  durationSec: 120,
  isVip: false,
  published: true,
};

type FormState = typeof INITIAL_FORM;

export function VideosTab({ token }: { token: string }) {
  const { t } = useTranslation();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [contentType, setContentType] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [createPending, setCreatePending] = useState(false);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const buildCategory = () => `${contentType.trim()} ${year}`.trim();

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const v = await adminListVideos();
      setVideos(v);
    } catch {
      toast.error("Erreur de chargement des vidéos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setContentType("");
    setYear(String(CURRENT_YEAR));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentType.trim()) {
      toast.error("Veuillez renseigner une catégorie");
      return;
    }
    setCreatePending(true);
    try {
      await adminCreateVideo({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        videoUrl: formData.videoUrl.trim(),
        category: buildCategory(),
      });
      toast.success("Vidéo ajoutée avec succès");
      setOpen(false);
      resetForm();
      await loadVideos();
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'ajout");
    } finally {
      setCreatePending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette vidéo ?")) return;
    setDeletePending(id);
    try {
      await adminDeleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vidéo supprimée");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de suppression");
    } finally {
      setDeletePending(null);
    }
  };

  const filteredVideos = searchQuery.trim()
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold leading-tight">
              {t("Gestion des Vidéos")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {videos.length} vidéo{videos.length > 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-lg">
                <UploadCloud className="h-4 w-4" />
                {t("Uploader & Convertir")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("Usine à Vidéo (MP4 → HLS)")}</DialogTitle>
                <DialogDescription className="text-xs">
                  Uploadez un fichier MP4, il sera automatiquement converti en HLS pour le streaming adaptatif.
                </DialogDescription>
              </DialogHeader>
              <VideoUploader
                token={token}
                onUploadSuccess={(url) => {
                  setUploadOpen(false);
                  setFormData((prev) => ({ ...prev, videoUrl: url }));
                  setOpen(true);
                  toast.success("URL HLS prête ! Complétez les informations.");
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-lg shadow-sm">
                <Plus className="h-4 w-4" />
                {t("Ajouter manuellement")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  {t("Nouvelle Vidéo")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Les champs marqués d'un astérisque (*) sont obligatoires.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                {/* Titre */}
                <div className="space-y-1.5">
                  <Label htmlFor="video-title" className="text-sm font-medium">
                    {t("common.title")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="video-title"
                    required
                    placeholder="Ex: Kompa Lakay - Édition 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Catégorie + Année */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="video-category" className="text-sm font-medium">
                      {t("common.category")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="video-category"
                      required
                      placeholder={t("ex: Kompa, Rasin...")}
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("Année")}</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview catégorie finale */}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{t("Catégorie finale :")}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {buildCategory() || "—"}
                  </Badge>
                </div>

                {/* Description (optionnelle) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="video-description" className="text-sm font-medium">
                      Description{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (optionnelle)
                      </span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formData.description.length} caractères
                    </span>
                  </div>
                  <Textarea
                    id="video-description"
                    placeholder="Ajoutez une description, des tags, ou toute information utile..."
                    className="min-h-[100px] resize-y"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Miniature */}
                <div className="space-y-1.5">
                  <Label htmlFor="video-thumb" className="text-sm font-medium">
                    {t("URL Miniature")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="video-thumb"
                    required
                    type="url"
                    placeholder="https://..."
                    value={formData.thumbnailUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnailUrl: e.target.value })
                    }
                  />
                </div>

                {/* URL Vidéo */}
                <div className="space-y-1.5">
                  <Label htmlFor="video-url" className="text-sm font-medium">
                    {t("URL Vidéo (HLS Master)")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="video-url"
                    required
                    type="url"
                    placeholder="https://.../master.m3u8"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                  />
                </div>

                {/* Durée + Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="video-duration" className="text-sm font-medium">
                      {t("Durée (sec)")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="video-duration"
                      type="number"
                      min={1}
                      required
                      value={formData.durationSec}
                      onChange={(e) =>
                        setFormData({ ...formData, durationSec: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-vip" className="text-sm cursor-pointer">
                        {t("Réservé VIP")}
                      </Label>
                      <Switch
                        id="toggle-vip"
                        checked={formData.isVip}
                        onCheckedChange={(c) => setFormData({ ...formData, isVip: c })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-published" className="text-sm cursor-pointer">
                        {t("Publié")}
                      </Label>
                      <Switch
                        id="toggle-published"
                        checked={formData.published}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, published: c })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createPending}
                  className="w-full mt-2 rounded-lg font-semibold shadow-sm"
                >
                  {createPending ? t("Enregistrement...") : t("Enregistrer la vidéo")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Barre de recherche */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre ou catégorie..."
              className="pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              {filteredVideos.length} résultat{filteredVideos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-border/60">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="font-semibold">{t("common.title")}</TableHead>
                  <TableHead className="font-semibold">{t("common.category")}</TableHead>
                  <TableHead className="font-semibold w-24">Vues</TableHead>
                  <TableHead className="font-semibold w-28">{t("common.vip")}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <div className="h-9 animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredVideos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Film className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {searchQuery
                          ? "Aucune vidéo ne correspond à votre recherche."
                          : "Aucune vidéo pour le moment."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVideos.map((v) => (
                    <TableRow key={v.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium max-w-[280px]">
                        <span className="line-clamp-1">{v.title}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium bg-accent/70"
                        >
                          {v.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {v.views.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {v.isVip ? (
                          <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20 text-xs">
                            VIP
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Gratuit</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(v.id)}
                          disabled={deletePending === v.id}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
                          aria-label="Supprimer la vidéo"
                        >
                          {deletePending === v.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
