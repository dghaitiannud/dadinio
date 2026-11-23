import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import { Shield, Star, LogOut, Share2, Copy, Check, BellOff, BellRing, Trash2, Radio } from "lucide-react";
import { toast } from "sonner";
import { getWatchHistory, clearWatchHistory, type WatchEntry } from "@/lib/local-store";
import { listMyTickets, createTicket, type SupportTicket } from "@/lib/supabase-db";
import { PwaInstallButton } from "@/components/pwa-install";
import { isPushSupported, getPushPermission, subscribeToPush, unsubscribeFromPush, getCurrentSubscription, type PushPermission } from "@/lib/push-notifications";
import { supabase, LIVE_ADMIN_EMAIL } from "@/lib/supabase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export function Account() {
  const dateLocale = useDateLocale();
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
      listMyTickets(appUser.id).then((t) => {
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
      toast.success(t("Message envoyé au support"));
      const updated = await listMyTickets(appUser.id);
      setTickets(updated);
    } catch (err: any) {
      toast.error(err?.message || t("Erreur d'envoi"));
    } finally {
      setTicketPending(false);
    }
  };

  const referralBase = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/g, "")}`;
  const referralLink = appUser?.id ? `${referralBase}/?ref=${appUser.id}` : referralBase;

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t("Lien copié"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("Impossible de copier"));
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Haïtien Nud Média",
          text: "Rejoins-moi sur HAITIAN NUD MEDIA",
          url: referralLink
        });
      } catch {}
    } else {
      copyReferral();
    }
  };

  const saveDisplayName = async () => {
    if (!displayName.trim() || !appUser?.id) return;
    setSavingName(true);
    try {
      const { error } = await supabase.
      from("users").
      update({ display_name: displayName.trim() }).
      eq("id", appUser.id);
      if (error) throw error;
      await refreshUser();
      toast.success(t("Nom mis à jour"));
    } catch (err: any) {
      toast.error(err?.message || t("Erreur"));
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  const isVip = appUser?.plan === "vip";
  const endsAt = appUser?.subscriptionEndsAt ? new Date(appUser.subscriptionEndsAt) : null;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000)) : null;
  const initial = (appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase();

  const tabClass =
    "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400";
  const groupClass = "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card";
  const groupTitle = "mb-2 px-1 text-sm font-semibold text-muted-foreground";

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 pb-28 pt-10 md:pt-14">
      {/* Profil */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar className={cn("h-16 w-16 md:h-20 md:w-20", isVip && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background")}>
            <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate font-serif text-2xl font-semibold tracking-tight md:text-3xl">
                {appUser?.displayName || t("Utilisateur")}
              </h1>
              {isVip ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-black">
                  <Star className="h-3 w-3 fill-current" /> VIP
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {t("account.free_member")}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{appUser?.email}</p>
            {(isAdmin || appUser?.email === LIVE_ADMIN_EMAIL) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                {isAdmin && (
                  <Link href="/admin" className="inline-flex items-center gap-1.5 text-foreground underline-offset-4 hover:underline">
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
                <Link href="/admin-live" className="inline-flex items-center gap-1.5 text-red-500 underline-offset-4 hover:underline">
                  <Radio className="h-3.5 w-3.5" /> {t("Studio Live")}
                </Link>
              </div>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={handleLogout} className="h-10 w-full rounded-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav.logout")}
        </Button>
      </header>

      {/* Abonnement : le bloc principal de la page */}
      <section
        className={cn(
          "mt-10 rounded-3xl border p-6 md:p-8",
          isVip ? "border-amber-400/50 bg-amber-400/[0.05]" : "border-border bg-card",
        )}
      >
        {isVip ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("account.active_sub")}</p>
              <p className="mt-1 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                {daysLeft !== null ? t("account.days_left", { days: daysLeft }) : t("À vie")}
              </p>
              {endsAt && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("account.expires_at")} {format(endsAt, t("date.long"), { locale: dateLocale })}
                </p>
              )}
            </div>
            <Link href="/plans">
              <Button className="h-11 w-full rounded-full bg-amber-400 px-7 font-semibold text-black hover:bg-amber-300 sm:w-auto">
                {t("account.extend")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("account.quota_remaining")}</p>
              <p className="mt-1 font-serif text-4xl font-semibold tabular-nums tracking-tight">
                {Math.max(0, 3 - (appUser?.freeDownloadsUsed || 0))}
                <span className="ml-1 text-xl font-medium text-muted-foreground">/ 3</span>
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("account.free_plan_msg")}</p>
            </div>
            <Link href="/plans">
              <Button className="h-11 w-full rounded-full bg-amber-400 px-7 font-semibold text-black hover:bg-amber-300 sm:w-auto">
                {t("account.become_vip_now")}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <Tabs defaultValue="history" className="mt-10 w-full">
        <div className="-mx-5 overflow-x-auto px-5 no-scrollbar">
          <TabsList className="h-auto w-max gap-1 rounded-full bg-muted p-1">
            <TabsTrigger value="history" className={tabClass}>{t("account.history")}</TabsTrigger>
            <TabsTrigger value="settings" className={tabClass}>{t("account.settings")}</TabsTrigger>
            <TabsTrigger value="support" className={tabClass}>{t("account.support")}</TabsTrigger>
          </TabsList>
        </div>

        {/* Historique */}
        <TabsContent value="history" className="mt-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-muted-foreground">{t("Historique de lecture")}</h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => { clearWatchHistory(); setHistory([]); }}
                className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("Vider")}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
              {t("Aucune vidéo consultée récemment.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/watch/${h.id}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-border p-2.5 transition-colors hover:border-foreground/30"
                >
                  <img src={h.thumbnailUrl} alt="" className="h-14 w-24 shrink-0 rounded-lg bg-muted object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">{h.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(h.watchedAt), t("date.datetime"), { locale: dateLocale })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Réglages */}
        <TabsContent value="settings" className="mt-8 space-y-9">
          <div>
            <h2 className={groupTitle}>{t("Profil")}</h2>
            <div className={groupClass}>
              <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
                <Label htmlFor="display-name" className="w-32 shrink-0 text-sm text-muted-foreground">
                  {t("account.display_name")}
                </Label>
                <div className="flex flex-1 gap-2">
                  <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10 bg-background" />
                  <Button onClick={saveDisplayName} disabled={savingName || !displayName.trim()} className="h-10 rounded-full px-5">
                    {t("common.save")}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
                <Label className="w-32 shrink-0 text-sm text-muted-foreground">{t("account.email")}</Label>
                <span className="truncate text-sm">{appUser?.email}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className={groupTitle}>{t("Langue d'affichage")}</h2>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("Choisissez la langue de l'interface pour personnaliser votre navigation.")}
              </p>
              <LanguageSwitcher />
            </div>
          </div>

          <div>
            <h2 className={groupTitle}>{t("Notifications Push")}</h2>
            <PushNotificationCard userId={isAdmin ? "admin" : appUser?.id} />
          </div>

          <div>
            <h2 className={groupTitle}>{t("Application Mobile")}</h2>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("Installez l'application sur votre écran d'accueil pour un accès plus rapide.")}
              </p>
              <PwaInstallButton variant="card" />
            </div>
          </div>

          {!isVip && (
            <div>
              <h2 className={groupTitle}>{t("Parrainez vos proches")}</h2>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("Partagez Haïtien Nud Média avec vos amis pour leur faire découvrir la plateforme.")}
                </p>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="h-10 bg-background font-mono text-xs" />
                  <Button variant="outline" onClick={copyReferral} aria-label={t("Lien copié")} className="h-10 w-10 shrink-0 rounded-full p-0">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={shareReferral} variant="secondary" className="mt-3 h-10 w-full rounded-full">
                  <Share2 className="mr-2 h-4 w-4" /> {t("Partager le lien")}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Support */}
        <TabsContent value="support" className="mt-8 grid grid-cols-1 gap-9 md:grid-cols-2 md:gap-8">
          <div>
            <h2 className={groupTitle}>{t("account.contact_support")}</h2>
            <form onSubmit={handleSupportSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-sm text-muted-foreground">{t("common.subject")}</Label>
                <Input id="subject" placeholder={t("Sujet...")} value={subject} onChange={(e) => setSubject(e.target.value)} className="h-10 bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm text-muted-foreground">{t("common.message")}</Label>
                <Textarea id="message" placeholder={t("Votre message...")} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="resize-none bg-background" />
              </div>
              <Button type="submit" disabled={ticketPending || !subject || !message} className="h-11 w-full rounded-full font-semibold">
                {ticketPending ? t("Envoi...") : t("Envoyer")}
              </Button>
            </form>
          </div>

          <div>
            <h2 className={groupTitle}>{t("Mes Demandes")}</h2>
            <div className="max-h-[420px] space-y-3 overflow-y-auto">
              {isLoadingTickets ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold">{ticket.subject}</h3>
                      <Badge
                        variant={ticket.status === "open" ? "secondary" : ticket.status === "answered" ? "default" : "outline"}
                        className="shrink-0 rounded-full text-[11px]"
                      >
                        {ticket.status === "open" ? t("Ouvert") : ticket.status === "answered" ? t("Répondu") : t("Fermé")}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.message}</p>
                    {ticket.reply && (
                      <div className="rounded-xl bg-muted/60 p-3 text-sm">
                        <span className="mb-0.5 block font-medium">{t("Support :")}</span>
                        {ticket.reply}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(ticket.createdAt), t("date.datetime"), { locale: dateLocale })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
                  {t("Aucune demande envoyée.")}
                </div>
              )}
            </div>
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
          toast.success(t("Notifications désactivées"));
        } else {
          toast.error(t("Impossible de désactiver"));
        }
      } else {
        const ok = await subscribeToPush(userId);
        if (ok) {
          setSubscribed(true);
          setPermission("granted");
          toast.success(t("Notifications activées !"));
        } else if (getPushPermission() === "denied") {
          toast.error(t("Notifications bloquées dans votre navigateur"));
        } else {
          toast.error(t("Impossible d'activer les notifications"));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">{t("account.push_not_supported")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {subscribed ? (
              <BellRing className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <div className="text-sm font-medium">{subscribed ? t("Activées") : t("Désactivées")}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {subscribed ? t("Alertes nouveautés") : t("Activer pour recevoir les alertes")}
              </div>
            </div>
          </div>
          <Switch checked={subscribed} onCheckedChange={handleToggle} disabled={loading || permission === "denied"} />
        </div>
        {permission === "denied" && (
          <p className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            {t("Autorisez les notifications dans les réglages de votre navigateur.")}
          </p>
        )}
      </div>
    </div>
  );
}
