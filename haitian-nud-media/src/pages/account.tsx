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
import { Shield, Star, Download, LogOut, Ticket, History, Settings as SettingsIcon, Share2, Copy, Check, Bell, BellOff, BellRing, Trash2, Smartphone, Radio, Globe } from "lucide-react";
import { toast } from "sonner";
import { getWatchHistory, clearWatchHistory, getNotifPrefs, type WatchEntry, type NotifPrefs } from "@/lib/local-store";
import { listMyTickets, createTicket, type SupportTicket } from "@/lib/supabase-db";
import { PwaInstallButton } from "@/components/pwa-install";
import { isPushSupported, getPushPermission, subscribeToPush, unsubscribeFromPush, getCurrentSubscription, type PushPermission } from "@/lib/push-notifications";
import { LIVE_ADMIN_EMAIL } from "@/lib/supabase";

// 🌐 AJOUTÉ : Importation de ton sélecteur automatique de langue
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Account() {
  const { t } = useTranslation();
  const { isSignedIn, user, appUser, signOut, isAdmin, refreshUser } = useAuth();
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
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen">
      <h1 className="text-3xl font-serif font-bold mb-8">{t('nav.my_account')}</h1>

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
                  <Badge variant="outline" className="mb-2">{t('account.free_member')}</Badge>
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

                {(appUser?.email === LIVE_ADMIN_EMAIL || isAdmin) && (
                  <Link href="/admin-live" className="w-full mt-2">
                    <Button
                      variant="outline"
                      className="w-full bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Studio Diffusion Live
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4 flex justify-center">
              <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full">
                <LogOut className="h-4 w-4 mr-2" />{t('nav.logout')}</Button>
            </CardFooter>
          </Card>

          <PwaInstallButton variant="card" />
        </div>

        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="subscription"><Star className="h-4 w-4 mr-1 hidden sm:inline" />{t('account.subscription')}</TabsTrigger>
              <TabsTrigger value="history"><History className="h-4 w-4 mr-1 hidden sm:inline" />{t('account.history')}</TabsTrigger>
              <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 mr-1 hidden sm:inline" />{t('account.settings')}</TabsTrigger>
              <TabsTrigger value="support"><Ticket className="h-4 w-4 mr-1 hidden sm:inline" />{t('account.support')}</TabsTrigger>
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
                        <span>{t('account.active_sub')}</span>
                        <Badge className="bg-primary text-white">{t('common.vip')}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">{t('account.plan')}</div>
                          <div className="font-semibold">{t('common.vip')}</div>
                        </div>
                        <div className="p-4 bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">{t('account.expires_at')}</div>
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
                      <h3 className="text-lg font-semibold mb-2">{t('account.free_plan_msg')}</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Passez au VIP pour profiter des vidéos sans publicités et des téléchargements illimités.
                      </p>
                      <Link href="/plans">
                        <Button className="bg-primary text-white">{t('account.become_vip_now')}</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />{t('common.downloads')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div>
                      <div className="font-semibold">{t('account.quota_remaining')}</div>
                      <div className="text-sm text-muted-foreground">{t('account.free_downloads_limit')}</div>
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
                  <CardTitle>{t('account.profile')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">{t('account.display_name')}</Label>
                    <div className="flex gap-2">
                      <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" className="bg-background" />
                      <Button onClick={saveDisplayName} disabled={savingName || !displayName.trim()}>{t('common.save')}</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('account.email')}</Label>
                    <Input value={appUser?.email ?? ""} readOnly disabled className="bg-background" />
                  </div>
                </CardContent>
              </Card>

              {/* 🌐 AJOUTÉ : Bloc de Configuration de la Langue */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> Langue de l'application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez votre langue préférée. L'ensemble du catalogue et de l'interface s'adaptera automatiquement.
                  </p>
                  <LanguageSwitcher />
                </CardContent>
              </Card>

              <PushNotificationCard userId={isAdmin ? "admin" : appUser?.id} />

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
                  <CardTitle>{t('account.contact_support')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('common.subject')}</Label>
                      <Input id="subject" placeholder="Ex: Problème d'abonnement" value={subject} onChange={e => setSubject(e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t('common.message')}</Label>
                      <Textarea id="message" placeholder="Décrivez votre problem en détail..." rows={4} value={message} onChange={e => setMessage(e.target.value)} className="bg-background resize-none" />
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
                      <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
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

function PushNotificationCard({ userId }: { userId?: string }) {
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
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('account.push_not_supported')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Notifications Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-background">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {subscribed ? (
              <BellRing className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <div className="font-medium">
                {subscribed ? "Abonné aux notifications" : "Notifications désactivées"}
              </div>
              <div className="text-xs text-muted-foreground">
                {subscribed
                  ? "Vous recevrez des alertes pour les nouvelles vidéos."
                  : "Activez pour ne rien manquer."}
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
          <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
            Les notifications sont bloquées dans votre navigateur. Allez dans les paramètres de votre navigateur pour les autoriser.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
