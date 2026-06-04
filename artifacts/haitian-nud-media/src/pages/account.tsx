import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Shield, Star, Download, LogOut, Ticket, History, Settings as SettingsIcon, Share2, Copy, Check, Bell, Trash2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getWatchHistory, clearWatchHistory, getNotifPrefs, setNotifPrefs, type WatchEntry, type NotifPrefs } from "@/lib/local-store";
import { listMyTickets, createTicket, type SupportTicket } from "@/lib/supabase-db";
import { PwaInstallButton } from "@/components/pwa-install";

export function Account() {
  const { isSignedIn, user, appUser, signOut, isAdmin, refreshUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketPending, setTicketPending] = useState(false);
  const [history, setHistory] = useState<WatchEntry[]>([]);
  const [notifs, setNotifsState] = useState<NotifPrefs>(getNotifPrefs());
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  useEffect(() => {
    if (appUser?.displayName) setDisplayName(appUser.displayName);
  }, [appUser?.displayName]);

  useEffect(() => {
    if (appUser?.id) {
      setIsLoadingTickets(true);
      listMyTickets(appUser.id).then(t => {
        setTickets(t);
        setIsLoadingTickets(false);
      });
    }
  }, [appUser?.id]);

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !appUser?.id) return;
    setTicketPending(true);
    try {
      await createTicket(appUser.id, subject, message);
      setSubject("");
      setMessage("");
      toast.success("Message envoyé au support");
      const updated = await listMyTickets(appUser.id);
      setTickets(updated);
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'envoi");
    } finally {
      setTicketPending(false);
    }
  };

  const referralBase = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/g, "")}`;
  const referralLink = appUser?.id ? `${referralBase}/?ref=${appUser.id}` : referralBase;
  const isFree = appUser?.plan !== "vip";

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Haïtien Nud Média",
          text: "Rejoins-moi sur Haïtien Nud Média — médya ayisyen 100%.",
          url: referralLink,
        });
      } catch { }
    } else {
      copyReferral();
    }
  };

  const updateNotif = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...notifs, [key]: value };
    setNotifsState(next);
    setNotifPrefs(next);
  };

  const saveDisplayName = async () => {
    if (!displayName.trim() || !appUser?.id) return;
    setSavingName(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("users")
        .update({ display_name: displayName.trim() })
        .eq("id", appUser.id);
      if (error) throw error;
      await refreshUser();
      toast.success("Nom mis à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen">
      <h1 className="text-3xl font-serif font-bold mb-8">Mon Compte</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                  <AvatarFallback className="text-2xl bg-accent text-accent-foreground">
                    {(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{appUser?.displayName || "Utilisateur"}</h2>
                <p className="text-muted-foreground text-sm mb-4">{appUser?.email}</p>

                {appUser?.plan === "vip" ? (
                  <Badge variant="secondary" className="bg-gradient-to-r from-primary to-blue-500 text-white border-0 shadow-lg px-3 py-1 mb-2">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Membre VIP
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mb-2">Membre Gratuit</Badge>
                )}

                {isAdmin && (
                  <Link href="/admin" className="w-full mt-4">
                    <Button
                      variant="outline"
                      className="w-full bg-accent/50 border-primary/30 text-primary"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Panneau Admin
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4 flex justify-center">
              <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full">
                <LogOut className="h-4 w-4 mr-2" /> Déconnexion
              </Button>
            </CardFooter>
          </Card>

          <PwaInstallButton variant="card" />
        </div>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="subscription"><Star className="h-4 w-4 mr-1 hidden sm:inline" />Abonnement</TabsTrigger>
              <TabsTrigger value="history"><History className="h-4 w-4 mr-1 hidden sm:inline" />Historique</TabsTrigger>
              <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 mr-1 hidden sm:inline" />Paramètres</TabsTrigger>
              <TabsTrigger value="support"><Ticket className="h-4 w-4 mr-1 hidden sm:inline" />Support</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> Statut VIP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appUser?.plan === "vip" ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium flex justify-between items-center">
                        <span>Abonnement Actif</span>
                        <Badge className="bg-primary text-white">VIP</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Plan</div>
                          <div className="font-semibold">VIP</div>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Expire le</div>
                          <div className="font-semibold">
                            {appUser?.subscriptionEndsAt ? format(new Date(appUser.subscriptionEndsAt), "dd MMMM yyyy", { locale: fr }) : "À vie"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Vous êtes sur le plan Gratuit</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Passez au VIP pour profiter des vidéos sans publicités et des téléchargements illimités.
                      </p>
                      <Link href="/plans">
                        <Button className="bg-primary text-white">Devenir VIP maintenant</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" /> Téléchargements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div>
                      <div className="font-semibold">Quota restant</div>
                      <div className="text-sm text-muted-foreground">3 téléchargements gratuits par compte</div>
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {appUser?.plan === "vip" ? "∞" : (3 - (appUser?.freeDownloadsUsed || 0))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isFree && (
                <Card className="border-primary/30 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" /> Parrainez le site
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Pas encore VIP ? Partagez Haïtien Nud Média avec vos amis et la diaspora.
                    </p>
                    <div className="flex gap-2">
                      <Input value={referralLink} readOnly className="font-mono text-xs bg-background" />
                      <Button variant="outline" size="icon" onClick={copyReferral} title="Copier">
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button onClick={shareReferral} className="w-full bg-primary text-primary-foreground">
                      <Share2 className="h-4 w-4 mr-2" /> Partager le lien
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> Vidéos vues récemment
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => { clearWatchHistory(); setHistory([]); }} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Vider
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                      Aucune vidéo dans l'historique pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((h) => (
                        <Link key={h.id} href={`/watch/${h.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/40 transition-colors">
                          <img src={h.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{h.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Vu {format(new Date(h.watchedAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Nom affiché</Label>
                    <div className="flex gap-2">
                      <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" className="bg-background" />
                      <Button onClick={saveDisplayName} disabled={savingName || !displayName.trim()}>Enregistrer</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={appUser?.email ?? ""} readOnly disabled className="bg-background" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingRow label="Nouvelles vidéos" desc="Recevoir une notification dès qu'une nouvelle vidéo est publiée." checked={notifs.newVideos} onChange={(v) => updateNotif("newVideos", v)} />
                  <SettingRow label="Offres VIP" desc="Promotions et offres spéciales sur les abonnements." checked={notifs.vipOffers} onChange={(v) => updateNotif("vipOffers", v)} />
                  <SettingRow label="Réponses du support" desc="Être averti quand un agent répond à vos demandes." checked={notifs.ticketReplies} onChange={(v) => updateNotif("ticketReplies", v)} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" /> Application mobile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PwaInstallButton variant="card" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Contacter le support</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet</Label>
                      <Input id="subject" placeholder="Ex: Problème d'abonnement" value={subject} onChange={e => setSubject(e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Décrivez votre problème en détail..." rows={4} value={message} onChange={e => setMessage(e.target.value)} className="bg-background resize-none" />
                    </div>
                    <Button type="submit" disabled={ticketPending || !subject || !message}>
                      {ticketPending ? "Envoi..." : "Envoyer la demande"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" /> Mes Demandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoadingTickets ? (
                      <div className="text-center py-4 text-muted-foreground">Chargement...</div>
                    ) : tickets && tickets.length > 0 ? (
                      tickets.map((ticket) => (
                        <div key={ticket.id} className="p-4 border border-border rounded-lg bg-background">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{ticket.subject}</h4>
                            <Badge variant={ticket.status === 'open' ? 'secondary' : ticket.status === 'answered' ? 'default' : 'outline'}>
                              {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'answered' ? 'Répondu' : 'Fermé'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ticket.message}</p>
                          {ticket.reply && (
                            <div className="mt-3 p-3 bg-accent/50 rounded text-sm border border-border/50">
                              <span className="font-semibold text-primary block mb-1">Réponse du support:</span>
                              {ticket.reply}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {format(new Date(ticket.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                        Aucune demande de support pour le moment.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-background">
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
