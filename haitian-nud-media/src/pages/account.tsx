import { useTranslation } from "react-i18next";
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
import { Shield, Star, Download, LogOut, Ticket, History, Settings as SettingsIcon, Share2, Copy, Check, Bell, BellOff, BellRing, Trash2, Smartphone, Radio, Globe, User, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getWatchHistory, clearWatchHistory, type WatchEntry } from "@/lib/local-store";
import { listMyTickets, createTicket, type SupportTicket } from "@/lib/supabase-db";
import { PwaInstallButton } from "@/components/pwa-install";
import { isPushSupported, getPushPermission, subscribeToPush, unsubscribeFromPush, getCurrentSubscription, type PushPermission } from "@/lib/push-notifications";
import { LIVE_ADMIN_EMAIL } from "@/lib/supabase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Account() {
  const { t } = useTranslation();
  const { isSignedIn, appUser, signOut, isAdmin, refreshUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketPending, setTicketPending] = useState(false);
  const [history, setHistory] = useState<WatchEntry[]>([]);
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
    } catch (err: any) {
      toast.error(err?.message || "Erreur d'envoi");
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
          text: "Rejoins-moi sur HAITIAN NUD MEDIA",
          url: referralLink,
        });
      } catch { }
    } else {
      copyReferral();
    }
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
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl min-h-screen space-y-6">
      
      {/* Header Profil & Badge Status (Bento Style) */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-primary/30 shadow-md">
              <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                {(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-serif font-bold">{appUser?.displayName || "Utilisateur"}</h1>
                {appUser?.plan === "vip" ? (
                  <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white border-0 shadow-sm px-2.5 py-0.5 text-xs font-semibold">
                    <Star className="h-3 w-3 mr-1 fill-current" /> VIP
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">{t('account.free_member')}</Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{appUser?.email}</p>

              {/* Raccourcis Administrateur */}
              {(isAdmin || appUser?.email === LIVE_ADMIN_EMAIL) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start">
                  {isAdmin && (
                    <Link href="/admin">
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-primary/5 border-primary/30 text-primary">
                        <Shield className="h-3.5 w-3.5 mr-1" /> Admin
                      </Button>
                    </Link>
                  )}
                  {(appUser?.email === LIVE_ADMIN_EMAIL || isAdmin) && (
                    <Link href="/admin-live">
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20">
                        <Radio className="h-3.5 w-3.5 mr-1 animate-pulse" /> Studio Live
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-end md:self-start"
          >
            <LogOut className="h-4 w-4 mr-2" />{t('nav.logout')}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="subscription" className="w-full">
        <div className="overflow-x-auto no-scrollbar border-b border-border mb-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6 justify-start">
            <TabsTrigger 
              value="subscription" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs md:text-sm font-medium gap-2"
            >
              <Star className="h-4 w-4" />
              {t('account.subscription')}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs md:text-sm font-medium gap-2"
            >
              <History className="h-4 w-4" />
              {t('account.history')}
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs md:text-sm font-medium gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              {t('account.settings')}
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-xs md:text-sm font-medium gap-2"
            >
              <Ticket className="h-4 w-4" />
              {t('account.support')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Subscription */}
        <TabsContent value="subscription" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Statut Offre */}
            <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Statut Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appUser?.plan === "vip" ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium flex justify-between items-center text-sm">
                      <span>{t('account.active_sub')}</span>
                      <Badge className="bg-primary text-white text-[11px]">{t('common.vip')}</Badge>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs flex justify-between items-center">
                      <span className="text-muted-foreground">{t('account.expires_at')}</span>
                      <span className="font-semibold">
                        {appUser?.subscriptionEndsAt ? format(new Date(appUser.subscriptionEndsAt), "dd MMMM yyyy", { locale: fr }) : "À vie"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">{t('account.free_plan_msg')}</p>
                    <Link href="/plans" className="block">
                      <Button className="w-full bg-primary text-white shadow-sm h-9 text-xs font-semibold">
                        {t('account.become_vip_now')}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Téléchargements */}
            <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" /> Quota de Téléchargements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/60">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">{t('account.quota_remaining')}</div>
                    <div className="text-xs text-muted-foreground">{t('account.free_downloads_limit')}</div>
                  </div>
                  <div className="text-3xl font-bold font-mono text-primary">
                    {appUser?.plan === "vip" ? "∞" : (3 - (appUser?.freeDownloadsUsed || 0))}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Parrainage */}
          {isFree && (
            <Card className="border-primary/20 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" /> Parrainez vos proches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Partagez Haïtien Nud Média avec vos amis pour leur faire découvrir la plateforme.
                </p>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="font-mono text-xs bg-muted/30 h-9" />
                  <Button variant="outline" size="sm" onClick={copyReferral} className="h-9 shrink-0">
                    {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={shareReferral} variant="secondary" className="w-full h-9 text-xs font-medium">
                  <Share2 className="h-3.5 w-3.5 mr-2" /> Partager le lien
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: History */}
        <TabsContent value="history">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Historique de lecture
              </CardTitle>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { clearWatchHistory(); setHistory([]); }} className="text-destructive h-8 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Vider
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Aucune vidéo consultée récemment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.map((h) => (
                    <Link key={h.id} href={`/watch/${h.id}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 transition-colors">
                      <img src={h.thumbnailUrl} alt="" className="w-20 h-12 object-cover rounded-md shrink-0 bg-muted" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs line-clamp-1">{h.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(h.watchedAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Settings */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Profil */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-xs">{t('account.display_name')}</Label>
                  <div className="flex gap-2">
                    <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-9 text-xs bg-muted/20" />
                    <Button size="sm" onClick={saveDisplayName} disabled={savingName || !displayName.trim()} className="h-9 text-xs px-3 shrink-0">
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('account.email')}</Label>
                  <Input value={appUser?.email ?? ""} readOnly disabled className="h-9 text-xs bg-muted/40 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Langues */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Langue d'affichage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Choisissez la langue de l'interface pour personnaliser votre navigation.
                </p>
                <LanguageSwitcher />
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PushNotificationCard userId={isAdmin ? "admin" : appUser?.id} />

            <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" /> Application Mobile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Installez l'application sur votre écran d'accueil pour un accès plus rapide.
                </p>
                <PwaInstallButton variant="card" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: Support */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Formulaire */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> {t('account.contact_support')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="subject" className="text-xs">{t('common.subject')}</Label>
                    <Input id="subject" placeholder="Sujet..." value={subject} onChange={e => setSubject(e.target.value)} className="h-9 text-xs bg-muted/20" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="message" className="text-xs">{t('common.message')}</Label>
                    <Textarea id="message" placeholder="Votre message..." rows={4} value={message} onChange={e => setMessage(e.target.value)} className="text-xs bg-muted/20 resize-none" />
                  </div>
                  <Button type="submit" disabled={ticketPending || !subject || !message} className="w-full h-9 text-xs font-semibold">
                    {ticketPending ? "Envoi..." : "Envoyer"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Demandes existantes */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" /> Mes Demandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {isLoadingTickets ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">{t('common.loading')}</div>
                  ) : tickets && tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="p-3 border border-border/60 rounded-xl bg-muted/20 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-xs">{ticket.subject}</h4>
                          <Badge variant={ticket.status === 'open' ? 'secondary' : ticket.status === 'answered' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
                            {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'answered' ? 'Répondu' : 'Fermé'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.message}</p>
                        {ticket.reply && (
                          <div className="p-2 bg-accent/40 rounded-lg text-xs border border-border/40">
                            <span className="font-medium text-primary block mb-0.5">Support :</span>
                            {ticket.reply}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(ticket.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Aucune demande envoyée.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}

function PushNotificationCard({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<PushPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = isPushSupported();

  useEffect(() => {
    if (!supported) return;
    setPermission(getPushPermission());
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, [supported]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setSubscribed(false);
          setPermission(getPushPermission());
          toast.success("Notifications désactivées");
        } else {
          toast.error("Impossible de désactiver");
        }
      } else {
        const ok = await subscribeToPush(userId);
        if (ok) {
          setSubscribed(true);
          setPermission("granted");
          toast.success("Notifications activées !");
        } else if (getPushPermission() === "denied") {
          toast.error("Notifications bloquées dans votre navigateur");
        } else {
          toast.error("Impossible d'activer les notifications");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{t('account.push_not_supported')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Notifications Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {subscribed ? (
              <BellRing className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <div className="font-medium text-xs">
                {subscribed ? "Activées" : "Désactivées"}
              </div>
              <div className="text-[11px] text-muted-foreground line-clamp-1">
                {subscribed ? "Alertes nouveautés" : "Activer pour recevoir les alertes"}
              </div>
            </div>
          </div>
          <Switch
            checked={subscribed}
            onCheckedChange={handleToggle}
            disabled={loading || permission === "denied"}
          />
        </div>
        {permission === "denied" && (
          <p className="text-[11px] text-destructive bg-destructive/10 p-2.5 rounded-lg">
            Autorisez les notifications dans les réglages de votre navigateur.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
