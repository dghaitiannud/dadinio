import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Video as VideoIcon, ImageIcon, DollarSign, Download, Ticket, Trash2, Bell, UserCheck, LayoutTemplate, Crown, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getAdminStats, adminListVideos, adminCreateVideo, adminDeleteVideo,
  adminListPhotos, adminCreatePhoto, adminDeletePhoto,
  adminListUsers, adminBlockUser, adminListTickets, adminReplyTicket,
  getBannerVideo, updateBannerVideo,
  adminListVipRequests, adminProcessVipRequest,
  type Video, type Photo, type AdminUser, type SupportTicket, type AdminStats, type VipRequest
} from "@/lib/supabase-db";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2009 }, (_, i) => String(CURRENT_YEAR - i));

export function Admin() {
  const { appUser, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Accès Refusé</h1>
        <p className="text-muted-foreground mt-2">Vous n'avez pas les droits d'administration.</p>
        <Button className="mt-6" onClick={() => setLocation("/")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        Panneau d'Administration
      </h1>
      <AdminStatsCards />
      <Tabs defaultValue="videos" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="vip" className="text-yellow-500 font-semibold gap-1">
            <Crown className="h-3.5 w-3.5 fill-yellow-500" /> Demandes VIP
          </TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tickets">Messages</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="banner" className="text-primary font-semibold">Bannière</TabsTrigger>
        </TabsList>
        <TabsContent value="videos"><VideosTab /></TabsContent>
        <TabsContent value="photos"><PhotosTab /></TabsContent>
        <TabsContent value="vip"><VipRequestsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="tickets"><TicketsTab /></TabsContent>
        <TabsContent value="alerts"><AdminAlerts /></TabsContent>
        <TabsContent value="banner"><AdminBannerTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(s => setStats(s));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} />
      <StatCard title="Membres VIP" value={stats?.activeVip || 0} icon={DollarSign} color="text-yellow-500" />
      <StatCard title="Vidéos" value={stats?.totalVideos || 0} icon={VideoIcon} />
      <StatCard title="Photos" value={stats?.totalPhotos || 0} icon={ImageIcon} color="text-emerald-500" />
      <StatCard title="Vues" value={stats?.totalViews || 0} icon={Shield} />
      <StatCard title="Téléchargements" value={stats?.totalDownloads || 0} icon={Download} />
      <StatCard title="Tickets" value={stats?.openTickets || 0} icon={Ticket} color="text-destructive" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-primary" }: any) {
  return (
    <Card className="bg-card">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Icon className={`h-6 w-6 mb-2 ${color}`} />
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>
  );
}

function VideosTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [formData, setFormData] = useState({ title: "", description: "", thumbnailUrl: "", videoUrl: "", durationSec: 120, isVip: false, published: true });
  const [createPending, setCreatePending] = useState(false);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const buildCategory = () => `${contentType.trim()} ${year}`.trim();

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    const v = await adminListVideos();
    setVideos(v);
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
      toast.success("Vidéo supprimée");
      await loadVideos();
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Ajouter une vidéo</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouvelle Vidéo</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Input required placeholder="ex: Kompa, Rasin, Trap..." value={contentType} onChange={e => setContentType(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">Catégorie finale : <span className="font-semibold text-foreground">{buildCategory() || "—"}</span></div>
              <div className="space-y-2"><Label>Description</Label><Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL Miniature</Label><Input required value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL Vidéo</Label><Input required value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} /></div>
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead><TableHead>Vues</TableHead><TableHead>VIP</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {videos.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.title}</TableCell>
                <TableCell><span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">{v.category}</span></TableCell>
                <TableCell>{v.views}</TableCell>
                <TableCell>{v.isVip ? "Oui" : "Non"}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} disabled={deletePending === v.id} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PhotosTab() {
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
    const p = await adminListPhotos();
    setPhotos(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePending(true);
    try {
      await adminCreatePhoto({ ...formData, category: buildCategory() });
      toast.success("Photo ajoutée avec succès !");
      setOpen(false);
      setFormData({ title: "", description: "", imageUrl: "", isVip: false, published: true });
      setContentType("");
      setYear(String(CURRENT_YEAR));
      await loadPhotos();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'ajout");
    } finally {
      setCreatePending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Retirer cette photo de la galerie ?")) return;
    setDeletePending(id);
    try {
      await adminDeletePhoto(id);
      toast.success("Photo archivée");
      await loadPhotos();
    } catch (err: any) {
      toast.error(err?.message || "Erreur de suppression");
    } finally {
      setDeletePending(null);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Gestion de la Galerie Photo</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Ajouter une photo</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouvelle Photo</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de l'image</Label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Input required placeholder="ex: Shooting, Model, Event..." value={contentType} onChange={e => setContentType(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">Catégorie finale : <span className="font-semibold text-foreground">{buildCategory() || "—"}</span></div>
              <div className="space-y-2"><Label>Description / Légende</Label><Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>URL de la Photo</Label><Input required value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="Lien Supabase storage ou externe..." /></div>
              <div className="flex gap-6 mt-2">
                <div className="flex items-center gap-2"><Switch checked={formData.isVip} onCheckedChange={c => setFormData({ ...formData, isVip: c })} /><Label>Contenu VIP</Label></div>
                <div className="flex items-center gap-2"><Switch checked={formData.published} onCheckedChange={c => setFormData({ ...formData, published: c })} /><Label>Publier immédiatement</Label></div>
              </div>
              <Button type="submit" disabled={createPending} className="w-full mt-4">{createPending ? "Envoi..." : "Ajouter la photo"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Aperçu</TableHead><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead><TableHead>Vues</TableHead><TableHead>VIP</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {photos.map((p) => (
              <TableRow key={p.id}>
                <TableCell><img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded border" /></TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell><span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">{p.category}</span></TableCell>
                <TableCell>{p.views}</TableCell>
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

/* ====================================================
   COMPOSANT : ONGLET GESTION DES REÇUS ET DEMANDES VIP
   ==================================================== */
function VipRequestsTab() {
  const [requests, setRequests] = useState<VipRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Record<string, string>>({});

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const data = await adminListVipRequests();
      setRequests(data);
    } catch (err) {
      toast.error("Impossible de charger les reçus VIP");
    }
  };

  const handleAction = async (requestId: string, userId: string, action: "approved" | "rejected") => {
    setProcessingId(requestId);
    const duration = parseInt(selectedDuration[requestId] || "30", 10);
    
    try {
      await adminProcessVipRequest(requestId, userId, action, duration);
      toast.success(action === "approved" ? "Abonnement VIP activé avec succès !" : "Demande rejetée");
      await loadRequests();
    } catch (err: any) {
      toast.error(err?.message || "Erreur de traitement");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-500">
          <Crown className="h-5 w-5 fill-yellow-500" /> Validation des paiements VIP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email Utilisateur</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Preuve / Reçu</TableHead>
              <TableHead>Date d'envoi</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Durée Forfait</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune demande VIP enregistrée pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id} className={r.status !== 'pending' ? "opacity-60" : ""}>
                  <TableCell className="font-semibold">{r.userEmail}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${r.paymentMethod === 'moncash' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {r.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative w-12 h-12 rounded border border-border overflow-hidden cursor-pointer group bg-muted">
                          <img src={r.proofUrl} alt="Reçu" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[9px] text-white font-bold">Agrandir</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl bg-background">
                        <DialogHeader>
                          <DialogTitle className="text-sm text-muted-foreground flex items-center justify-between">
                            <span>Preuve envoyée par : {r.userEmail}</span>
                            <a href={r.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                              Ouvrir l'original <ExternalLink className="h-3 w-3" />
                            </a>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 rounded-xl border overflow-hidden bg-black max-h-[70vh] flex justify-center">
                          <img src={r.proofUrl} alt="Reçu grand format" className="max-w-full max-h-[70vh] object-contain" />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(r.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium uppercase ${r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {r.status === 'approved' ? 'Validé' : r.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.status === 'pending' ? (
                      <Select 
                        value={selectedDuration[r.id] || "30"} 
                        onValueChange={(val) => setSelectedDuration({ ...selectedDuration, [r.id]: val })}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-background">
                          <SelectValue placeholder="30 Jours" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Jours</SelectItem>
                          <SelectItem value="90">90 Jours</SelectItem>
                          <SelectItem value="365">1 An (Privilège)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 gap-1"
                          disabled={processingId === r.id}
                          onClick={() => handleAction(r.id, r.userId, 'approved')}
                        >
                          <Check className="h-3.5 w-3.5" /> Accepter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-destructive text-destructive hover:bg-destructive/10 gap-1"
                          disabled={processingId === r.id}
                          onClick={() => handleAction(r.id, r.userId, 'rejected')}
                        >
                          <X className="h-3.5 w-3.5" /> Rejeter
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Traité</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [blockPending, setBlockPending] = useState<string | null>(null);
  const { appUser } = useAuth();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const u = await adminListUsers();
    setUsers(u);
  };

  const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
    if (!appUser) return;
    setBlockPending(id);
    try {
      await adminBlockUser(appUser.id, id, !currentBlocked);
      toast.success(currentBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué");
      await loadUsers();
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'action");
    } finally {
      setBlockPending(null);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Date d'inscription</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={u.blocked ? "opacity-50" : ""}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded text-xs ${u.plan === 'vip' ? 'bg-primary text-white' : 'bg-muted'}`}>{u.plan.toUpperCase()}</span></TableCell>
                <TableCell>{format(new Date(u.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell>{u.blocked ? <span className="text-destructive font-medium">Bloqué</span> : "Actif"}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleToggleBlock(u.id, u.blocked)} disabled={blockPending === u.id} className={u.blocked ? "text-green-500" : "text-destructive"}>{u.blocked ? "Débloquer" : "Bloquer"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyPending, setReplyPending] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    const t = await adminListTickets();
    setTickets(t);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText) return;
    setReplyPending(true);
    try {
      await adminReplyTicket(selectedTicket.id, replyText);
      toast.success("Réponse envoyée");
      setSelectedTicket(null);
      setReplyText("");
      await loadTickets();
    } catch (e: any) {
      toast.error(e?.message || "Erreur de réponse");
    } finally {
      setReplyPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-card">
        <CardHeader><CardTitle>Messages & tickets</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${selectedTicket?.id === t.id ? 'border-primary' : 'border-border'}`}>
                <div className="flex justify-between">
                  <h4 className="font-semibold">{t.subject}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>{t.status}</span>
                </div>
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
              <div><Label className="text-muted-foreground">Message Original</Label><div className="p-3 bg-muted rounded mt-1 text-sm">{selectedTicket.message}</div></div>
              {selectedTicket.reply && <div><Label className="text-muted-foreground">Réponse Précédente</Label><div className="p-3 bg-primary/10 text-primary rounded mt-1 text-sm">{selectedTicket.reply}</div></div>}
              <div className="space-y-2"><Label>Votre Réponse</Label><Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} className="resize-none" /></div>
              <Button onClick={handleReply} disabled={!replyText || replyPending} className="w-full">Envoyer & Fermer</Button>
            </div>
          ) : <div className="text-center py-12 text-muted-foreground">Sélectionnez un ticket pour répondre</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAlerts() {
  const [title, setTitle] = useState("Nouvelle vidéo disponible !");
  const [body, setBody] = useState("Une nouvelle vidéo vient d'être publiée sur Haïtien Nud Média. Viens voir !");
  const [url, setUrl] = useState("/");
  const [secret, setSecret] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number; failed: number } | null>(null);

  const handleSend = async () => {
    if (!title || !body) { toast.error("Titre et message requis"); return; }
    if (!secret) { toast.error("Le secret admin est requis"); return; }
    
    setSending(true);
    setResult(null);
    
    try {
      const response = await fetch("https://api-6rzs.onrender.com/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          url,
          icon: "/logo.jpg",
          adminSecret: secret.trim()
        })
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.details || res.error || "Erreur de validation serveur");
      }

      setResult(res);
      toast.success(`${res.sent}/${res.total} notifications envoyées avec succès !`);
    } catch (e: any) {
      console.error("Erreur push détaillée:", e);
      toast.error(e?.message || "Erreur d'envoi de la notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Envoyer une notification Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Nouvelle vidéo !" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={3} className="resize-none" placeholder="Corps de la notification..." />
          </div>
          <div className="space-y-2">
            <Label>Lien (page à ouvrir)</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="/" />
          </div>
          <div className="space-y-2">
            <Label>Secret admin (PUSH_ADMIN_SECRET)</Label>
            <Input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Votre secret..." />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full bg-primary text-white">
            {sending ? "Envoi en cours..." : "Envoyer à tous les abonnés"}
          </Button>
          {result && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center">
              ✅ {result.sent} envoyées · {result.failed} expirées supprimées · {result.total} total
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="font-semibold text-foreground mb-1">Variables d'environnement requises</div>
            <code className="text-xs block">VAPID_PUBLIC_KEY=BAM-Ab_F...</code>
            <code className="text-xs block">VAPID_PRIVATE_KEY=e6Qt_r7...</code>
            <code className="text-xs block">PUSH_ADMIN_SECRET=ton-secret</code>
            <code className="text-xs block">SUPABASE_URL=https://...</code>
            <code className="text-xs block">SUPABASE_SERVICE_KEY=eyJ...</code>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="font-semibold text-foreground mb-1"> Table Supabase requise</div>
            <p>Table <code>push_subscriptions</code> — créée via le SQL setup.</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background">
            <div className="font-semibold text-foreground mb-1"> Les abonnés</div>
            <p>Les users s'abonnent depuis Compte → Paramètres → Notifications.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminBannerTab() {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => { getBannerVideo().then(res => setUrl(res)); }, []);

  const handleSave = async () => {
    setPending(true);
    try {
      await updateBannerVideo(url);
      toast.success("Vidéo de fond d'accueil mise à jour avec succès !");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setPending(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Voulez-vous retirer la vidéo de fond et restaurer le thème par défaut ?")) return;
    setPending(true);
    try {
      await updateBannerVideo("");
      setUrl("");
      toast.success("Bannière réinitialisée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" /> Configuration de la Vidéo de Fond d'Accueil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="banner-url">URL de la vidéo (.mp4 recommandés)</Label>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              id="banner-url"
              placeholder="https://lcfnjxqademkrcocvtlo.supabase.co/storage/v1/object/public/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-background"
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={pending}>
                {pending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {url && (
                <Button variant="destructive" onClick={handleClear} disabled={pending}>
                  Supprimer
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Collez le lien direct vers le fichier vidéo. Il jouera automatiquement en boucle, en silence, sans contrôles de lecture pour l'utilisateur.
          </p>
        </div>

        {url && (
          <div className="space-y-2">
            <Label>Aperçu du rendu final :</Label>
            <div className="relative w-full aspect-video md:max-w-xl bg-black rounded-xl overflow-hidden border border-border">
              <video
                src={url}
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4">
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold">Aperçu direct</span>
                <h4 className="text-xl font-bold text-white font-serif">HAITIAN NUD</h4>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
