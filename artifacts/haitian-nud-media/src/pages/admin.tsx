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
import { Shield, Users, Video as VideoIcon, DollarSign, Download, Ticket, Trash2, Bell, MessageSquare, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getAdminStats, adminListVideos, adminCreateVideo, adminDeleteVideo,
  adminListUsers, adminBlockUser, adminListTickets, adminReplyTicket,
  type Video, type AdminUser, type SupportTicket, type AdminStats
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
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tickets">Messages</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>
        <TabsContent value="videos"><VideosTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="tickets"><TicketsTab /></TabsContent>
        <TabsContent value="alerts"><AdminAlerts /></TabsContent>
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} />
      <StatCard title="Membres VIP" value={stats?.activeVip || 0} icon={DollarSign} color="text-yellow-500" />
      <StatCard title="Vidéos" value={stats?.totalVideos || 0} icon={VideoIcon} />
      <StatCard title="Vues" value={stats?.totalViews || 0} icon={Shield} />
      <StatCard title="Téléchargements" value={stats?.totalDownloads || 0} icon={Download} />
      <StatCard title="Tickets Ouverts" value={stats?.openTickets || 0} icon={Ticket} color="text-destructive" />
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

  useEffect(() => {
    loadVideos();
  }, []);

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

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [blockPending, setBlockPending] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const u = await adminListUsers();
    setUsers(u);
  };

  const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
    setBlockPending(id);
    try {
      await adminBlockUser(id, !currentBlocked);
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

  useEffect(() => {
    loadTickets();
  }, []);

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
  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold">Nouveaux messages</div>
            <div className="text-sm text-muted-foreground">Les tickets et messages utilisateurs arrivent ici.</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <UserCheck className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold">Accès admin par email</div>
            <div className="text-sm text-muted-foreground">Seul l'email dghaitiannud@gmail.com a accès au panneau admin.</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold">Support actif</div>
            <div className="text-sm text-muted-foreground">Les messages users sont visibles et répondables depuis le panel.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
