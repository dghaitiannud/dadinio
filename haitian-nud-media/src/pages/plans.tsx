import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowUpRight, BellRing, Check, Copy, Crown, FileImage,
  Loader2, Lock, ShieldAlert, ShieldCheck, Zap, Hand,
} from "lucide-react";
import { PaymentLogos } from "@/components/payment-logos";
import { cn } from "@/lib/utils";

import { isPushSupported, getPushPermission, subscribeToPush, notifyAdminsOfVipRequest } from "@/lib/push-notifications";

const COMMUNITY_LINKS = [
  { label: "Group WhatsApp 1", url: "https://chat.whatsapp.com/LOPVxj4kg01Eeol3La0oWC?s=cl&p=a&ilr=4&amv=2" },
  { label: "Group WhatsApp 2", url: "https://chat.whatsapp.com/L0pruKgrYrcBTtNJZ1qXpv?s=cl&p=a&ilr=4&amv=2" },
  { label: "Canal Telegram", url: "https://t.me/hatiannud_canal" },
];

// `name` reste en français : c'est la valeur enregistrée en base (vip_requests.plan_name).
// L'affichage passe par t(`plans.name.${id}`).
const SUBSCRIPTION_PLANS = [
  { id: "decouverte", name: "Découverte", priceUsd: 6, htg: 750, days: 7 },
  { id: "starter", name: "Starter", priceUsd: 8, htg: 1000, days: 10 },
  { id: "standard", name: "Standard", priceUsd: 11, htg: 1375, days: 15 },
  { id: "avantage", name: "Avantage", priceUsd: 20, htg: 2500, days: 30, popular: true },
  { id: "prolonje", name: "Prolonje", priceUsd: 24, htg: 3000, days: 40 },
  { id: "confort", name: "Confort", priceUsd: 60, htg: 7500, days: 105 },
  { id: "vip_privilege", name: "VIP Privilège", priceUsd: 200, htg: 25000, days: 365 },
];

type Plan = (typeof SUBSCRIPTION_PLANS)[number];
type Step = "info" | "payment" | "success";
type Method = "auto" | "manual";

const BASE_DAILY = SUBSCRIPTION_PLANS[0].priceUsd / SUBSCRIPTION_PLANS[0].days;
const dailyOf = (p: Plan) => p.priceUsd / p.days;
const savingOf = (p: Plan) => Math.round((1 - dailyOf(p) / BASE_DAILY) * 100);

const NATCASH_NUMBER = "+509 32 49 24 65";
const NATCASH_NAME = "Dafca Saint Vill";

export function Plans() {
  const { t, i18n } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";
  const supported = isPushSupported();

  const [step, setStep] = useState<Step>("info");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("avantage");
  const [method, setMethod] = useState<Method>("auto");
  const [origin, setOrigin] = useState<"abroad" | "haiti">("haiti");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushPending, setPushPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[3];
  const planName = (p: Plan) => t(`plans.name.${p.id}`);
  const fmtDays = (n: number) => t("plans.days_count", { days: n });
  const fmtHtg = (n: number) => `${n.toLocaleString(i18n.language)} HTG`;
  const fmtDaily = (p: Plan) =>
    t("plans.per_day", { price: dailyOf(p).toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });

  const accessUntil = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedPlan.days);
    try {
      return d.toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d.toLocaleDateString();
    }
  }, [selectedPlan.days, i18n.language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error(t("Le fichier est trop lourd. Maximum 5 Mo autorisé."));
        e.target.value = "";
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(t("Format non supporté. Veuillez envoyer une image (JPG, JPEG ou PNG)."));
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleActivatePush = async () => {
    setPushPending(true);
    try {
      const ok = await subscribeToPush((appUser as any)?.id);
      if (ok) {
        toast.success(t("Notifications système activées !"));
      } else if (getPushPermission() === "denied") {
        toast.error(t("Veuillez autoriser les notifications dans les paramètres de votre navigateur."));
      } else {
        toast.error(t("Échec de la souscription aux notifications."));
      }
    } finally {
      setPushPending(false);
    }
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(NATCASH_NUMBER.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponible : le numéro reste lisible à l'écran */
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !appUser) {
      toast.error(t("Veuillez vous connecter pour soumettre votre paiement."));
      return;
    }
    if (!file) {
      toast.error(t("Veuillez téléverser votre reçu de paiement."));
      return;
    }
    if (supported && getPushPermission() !== "granted") {
      toast.error(t("Action requise : Veuillez activer les notifications système avant d'envoyer."));
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${(appUser as any).id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vip-proofs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`);

      const { error: dbError } = await supabase.from("vip_requests").insert({
        user_id: (appUser as any).id,
        user_email: (appUser as any).email,
        payment_method: "natcash",
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount_usd: selectedPlan.priceUsd,
        duration_days: selectedPlan.days,
        proof_url: filePath,
        status: "pending",
      });
      if (dbError) throw dbError;

      try {
        const notified = await notifyAdminsOfVipRequest();
        if (!notified) console.warn("La demande VIP est enregistrée, mais la notification admin n'a pas été envoyée.");
      } catch (pushErr) {
        console.error("Échec notification admin:", pushErr);
      }

      toast.success(t("Preuve de paiement reçue avec succès !"));
      setStep("success");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("Une erreur est survenue lors de l'envoi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPayment = () => {
    if (!isSignedIn) {
      setLocation("/login");
      return;
    }
    setStep("payment");
  };

  const startAutomatic = () => setLocation(`/tranzak-checkout?planId=${selectedPlan.id}`);

  /* ---------- Récapitulatif (commun aux étapes 1 et 2) ---------- */
  const Summary = (
    <aside className="rounded-3xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{t("plans.summary_title")}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl font-semibold tracking-tight">{planName(selectedPlan)}</h3>
        <span className="text-sm text-muted-foreground">{fmtDays(selectedPlan.days)}</span>
      </div>

      <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
        <span className="text-sm text-muted-foreground">{t("plans.total")}</span>
        <div className="text-right">
          <div className="font-serif text-4xl font-semibold leading-none tracking-tight tabular-nums">
            {selectedPlan.priceUsd} <span className="text-xl font-medium text-muted-foreground">$</span>
          </div>
          <div className="mt-1.5 text-sm text-muted-foreground tabular-nums">{fmtHtg(selectedPlan.htg)}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("plans.access_until", { date: accessUntil })}</p>

      <ul className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
        {(["plans.includes_media", "plans.includes_catalog", "plans.includes_community"] as const).map((k) => (
          <li key={k} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2.5} />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );

  const Stepper = (
    <ol className="mb-10 flex items-center gap-3 text-sm">
      {(["info", "payment", "success"] as Step[]).map((s, i) => {
        const labels = { info: "plans.step_plan", payment: "plans.step_payment", success: "plans.step_done" } as const;
        const order = { info: 0, payment: 1, success: 2 };
        const state = order[s] < order[step] ? "done" : s === step ? "current" : "todo";
        return (
          <li key={s} className="flex items-center gap-3" aria-current={state === "current" ? "step" : undefined}>
            {i > 0 && <span className="h-px w-6 bg-border sm:w-10" aria-hidden />}
            <span
              className={cn(
                "flex items-center gap-2",
                state === "current" ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  state === "todo" && "border border-border",
                  state === "current" && "bg-foreground text-background",
                  state === "done" && "bg-amber-400 text-black",
                )}
              >
                {state === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(state !== "current" && "hidden sm:inline")}>{t(labels[s])}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-44 pt-10 md:pb-24 md:pt-16">
      {step !== "success" && Stepper}

      {/* ================= ÉTAPE 1 : FORMULES ================= */}
      {step === "info" && (
        <div className="animate-fade-in">
          {isUserVip ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-black">
                <Crown className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{t("plans.vip_active_title")}</h1>
              <p className="mt-3 text-muted-foreground">{t("plans.vip_active_sub")}</p>
              <Button
                onClick={() => setLocation("/vip-catalog")}
                className="mt-8 h-12 rounded-full bg-amber-400 px-8 text-base font-semibold text-black hover:bg-amber-300"
              >
                {t("Explorer le catalogue privé")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
              <section className="lg:col-span-7">
                <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("plans.hero_title")}</h1>
                <p className="mt-4 max-w-md text-lg text-muted-foreground">{t("plans.hero_sub")}</p>

                <div role="radiogroup" aria-label={t("plans.hero_title")} className="mt-10 space-y-2.5">
                  {SUBSCRIPTION_PLANS.map((p) => {
                    const selected = p.id === selectedPlanId;
                    const saving = savingOf(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={cn(
                          "group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left outline-none transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selected
                            ? "border-amber-400 bg-amber-400/[0.06] ring-1 ring-amber-400"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            selected ? "border-amber-400 bg-amber-400" : "border-muted-foreground/40",
                          )}
                        >
                          {selected && <Check className="h-3 w-3 text-black" strokeWidth={3.5} />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-base font-semibold">{planName(p)}</span>
                            {p.popular && (
                              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
                                {t("plans.most_chosen")}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {fmtDays(p.days)} · {fmtDaily(p)}
                            {saving > 0 && (
                              <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                                {t("plans.save_pct", { pct: saving })}
                              </span>
                            )}
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          <span className="block font-serif text-xl font-semibold tabular-nums">{p.priceUsd} $</span>
                          <span className="block text-xs text-muted-foreground tabular-nums">{fmtHtg(p.htg)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-12">
                  <h2 className="text-sm font-semibold text-muted-foreground">{t("plans.communities_title")}</h2>
                  <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
                    {COMMUNITY_LINKS.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="font-medium">{l.label}</span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-24 space-y-4">
                  {Summary}
                  <Button
                    onClick={goToPayment}
                    className="h-12 w-full rounded-full bg-amber-400 text-base font-semibold text-black hover:bg-amber-300"
                  >
                    {isSignedIn ? t("plans.continue") : t("plans.sign_in_to_continue")}
                  </Button>
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> {t("plans.secure_note")}
                  </p>
                </div>
              </div>

              {/* Barre d'action mobile */}
              <div className="fixed inset-x-0 bottom-[84px] z-40 px-4 lg:hidden">
                <div className="mx-auto flex max-w-md items-center gap-4 rounded-2xl border border-border bg-background/90 p-3 pl-5 shadow-xl backdrop-blur-xl">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{planName(selectedPlan)}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {selectedPlan.priceUsd} $ · {fmtHtg(selectedPlan.htg)}
                    </div>
                  </div>
                  <Button
                    onClick={goToPayment}
                    className="h-11 shrink-0 rounded-full bg-amber-400 px-6 font-semibold text-black hover:bg-amber-300"
                  >
                    {isSignedIn ? t("plans.continue") : t("plans.sign_in_to_continue")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= ÉTAPE 2 : PAIEMENT ================= */}
      {step === "payment" && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={() => setStep("info")}
            className="mb-6 -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ArrowLeft className="h-4 w-4" /> {t("plans.change_plan")}
          </button>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <section className="lg:col-span-7">
              <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{t("plans.pay_title")}</h1>

              <div role="radiogroup" aria-label={t("plans.pay_title")} className="mt-8 space-y-3">
                {/* Automatique — prioritaire */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "auto"}
                  onClick={() => setMethod("auto")}
                  className={cn(
                    "w-full rounded-2xl border p-5 text-left outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    method === "auto"
                      ? "border-amber-400 bg-amber-400/[0.06] ring-1 ring-amber-400"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-black">
                      <Zap className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-semibold">{t("plans.auto_title")}</span>
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
                          {t("plans.recommended")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{t("plans.auto_desc")}</p>
                      <PaymentLogos className="mt-4" />
                    </div>
                  </div>
                </button>

                {/* Manuel */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === "manual"}
                  onClick={() => setMethod("manual")}
                  className={cn(
                    "w-full rounded-2xl border p-5 text-left outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    method === "manual"
                      ? "border-amber-400 bg-amber-400/[0.06] ring-1 ring-amber-400"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                      <Hand className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-base font-semibold">{t("plans.manual_title")}</span>
                      <p className="mt-1 text-sm text-muted-foreground">{t("plans.manual_desc")}</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Détail : automatique */}
              {method === "auto" && (
                <div className="mt-8 animate-fade-in">
                  <ol className="space-y-4">
                    {(["plans.auto_how_1", "plans.auto_how_2", "plans.auto_how_3"] as const).map((k, i) => (
                      <li key={k} className="flex items-start gap-3.5 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{t(k)}</span>
                      </li>
                    ))}
                  </ol>
                  <Button
                    onClick={startAutomatic}
                    className="mt-8 h-12 w-full rounded-full bg-amber-400 text-base font-semibold text-black hover:bg-amber-300 sm:w-auto sm:px-10"
                  >
                    {t("plans.continue_to_payment")}
                  </Button>
                </div>
              )}

              {/* Détail : manuel */}
              {method === "manual" && (
                <form onSubmit={handleManualSubmit} className="mt-8 animate-fade-in space-y-8">
                  <div>
                    <div role="tablist" className="inline-flex rounded-full bg-muted p-1 text-sm">
                      {(["haiti", "abroad"] as const).map((o) => (
                        <button
                          key={o}
                          type="button"
                          role="tab"
                          aria-selected={origin === o}
                          onClick={() => setOrigin(o)}
                          className={cn(
                            "rounded-full px-4 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                            origin === o ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {o === "haiti" ? t("plans.manual_haiti") : t("plans.manual_abroad")}
                        </button>
                      ))}
                    </div>

                    <ol className="mt-5 space-y-3 text-sm">
                      {(origin === "abroad"
                        ? [
                            t("plans.abroad_step1"),
                            t("plans.abroad_step2", { amount: selectedPlan.priceUsd }),
                            t("plans.abroad_step3"),
                          ]
                        : [
                            t("plans.haiti_step1", { amount: selectedPlan.htg.toLocaleString(i18n.language) }),
                            t("plans.haiti_step2"),
                          ]
                      ).map((txt, i) => (
                        <li key={txt} className="flex items-start gap-3.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{txt}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">{t("plans.account_number")}</div>
                          <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{NATCASH_NUMBER}</div>
                        </div>
                        <button
                          type="button"
                          onClick={copyNumber}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? t("plans.copied") : t("plans.copy")}
                        </button>
                      </div>
                      <div className="mt-3 border-t border-border pt-3 text-sm">
                        <span className="text-muted-foreground">{t("plans.account_name")} : </span>
                        <span className="font-medium">{NATCASH_NAME}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold">{t("plans.receipt_title")}</h2>
                    <label
                      htmlFor="proof-file"
                      className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-amber-400 hover:bg-muted/30"
                    >
                      <FileImage className={cn("h-7 w-7", file ? "text-amber-500" : "text-muted-foreground")} />
                      <span className="mt-3 max-w-[260px] truncate text-sm font-medium">
                        {file ? file.name : t("plans.choose_file")}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">{t("plans.file_hint")}</span>
                      <input
                        id="proof-file"
                        type="file"
                        required
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {supported && getPushPermission() !== "granted" ? (
                    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.06] p-4">
                      <p className="flex items-start gap-2 text-sm">
                        <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        {t("plans.notif_needed")}
                      </p>
                      {getPushPermission() === "denied" ? (
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
                          <ShieldAlert className="h-4 w-4" /> {t("Autorisation bloquée dans le navigateur.")}
                        </p>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleActivatePush}
                          disabled={pushPending}
                          variant="outline"
                          className="mt-3 h-10 rounded-full"
                        >
                          {pushPending ? t("Activation...") : t("Activer les notifications système")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !file}
                      className="h-12 w-full rounded-full bg-amber-400 text-base font-semibold text-black hover:bg-amber-300 disabled:opacity-40 sm:w-auto sm:px-10"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("plans.sending")}
                        </>
                      ) : (
                        t("plans.send_receipt")
                      )}
                    </Button>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {t("Vous préférez un autre moyen de paiement ?")}{" "}
                    <a
                      href="https://T.me/dg_haitiannud"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {t("Écrire sur Telegram")}
                    </a>
                  </p>
                </form>
              )}
            </section>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">{Summary}</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ÉTAPE 3 : CONFIRMATION ================= */}
      {step === "success" && (
        <div className="mx-auto max-w-md animate-scale-in py-16 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("plans.success_title")}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("plans.success_desc", { plan: planName(selectedPlan), days: selectedPlan.days })}
          </p>
          <Button onClick={() => setLocation("/")} variant="outline" className="mt-8 h-11 rounded-full px-8">
            {t("plans.back_home")}
          </Button>
        </div>
      )}
    </div>
  );
}
