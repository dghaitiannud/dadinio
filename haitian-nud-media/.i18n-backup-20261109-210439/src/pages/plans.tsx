import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Send, ShieldCheck,
  Smartphone, Upload, Sparkles, LogIn, ArrowRight, FileImage, Crown, BellRing, ShieldAlert, Check, Globe, MapPin, MessageSquare } from
"lucide-react";

import { isPushSupported, getPushPermission, subscribeToPush } from "@/lib/push-notifications";

const COMMUNITY_LINKS = [
{ label: "Group WhatsApp 1", url: "https://chat.whatsapp.com/LOPVxj4kg01Eeol3La0oWC?s=cl&p=a&ilr=4&amv=2", desc: "Groupe WhatsApp VIP 1" },
{ label: "Group WhatsApp 2", url: "https://chat.whatsapp.com/L0pruKgrYrcBTtNJZ1qXpv?s=cl&p=a&ilr=4&amv=2", desc: "Groupe WhatsApp VIP 2" },
{ label: "Canal Telegram", url: "https://t.me/hatiannud_canal", desc: "Canal officiel Telegram" }];


const SUBSCRIPTION_PLANS = [
{ id: "decouverte", name: "Découverte", priceUsd: 6, htg: 750, days: 7, dailyRate: "0.86$" },
{ id: "starter", name: "Starter", priceUsd: 8, htg: 1000, days: 10, dailyRate: "0.80$" },
{ id: "standard", name: "Standard", priceUsd: 11, htg: 1375, days: 15, dailyRate: "0.73$" },
{ id: "avantage", name: "Avantage", priceUsd: 20, htg: 2500, days: 30, dailyRate: "0.67$", popular: true },
{ id: "prolonje", name: "Prolonje", priceUsd: 24, htg: 3000, days: 40, dailyRate: "0.60$" },
{ id: "confort", name: "Confort", priceUsd: 60, htg: 7500, days: 105, dailyRate: "0.571$" },
{ id: "vip_privilege", name: "VIP Privilège", priceUsd: 200, htg: 25000, days: 365, dailyRate: "0.55$" }];


export function Plans() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";
  const supported = isPushSupported();

  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [selectedPlanId, setSelectedPlanId] = useState<string>("avantage");
  const [paymentMethod, setPaymentMethod] = useState<"natcash">("natcash");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushPending, setPushPending] = useState(false);

  // Remonte automatiquement la page tout en haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[3];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSize = 5 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast.error("Le fichier est trop lourd. Maximum 5 Mo autorisé.");
        e.target.value = "";
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Format non supporté. Veuillez envoyer une image (JPG, JPEG ou PNG).");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleActivatePushBeforeSubmit = async () => {
    setPushPending(true);
    try {
      const ok = await subscribeToPush((appUser as any)?.id);
      if (ok) {
        toast.success("Notifications système activées !");
      } else if (getPushPermission() === "denied") {
        toast.error("Veuillez autoriser les notifications dans les paramètres de votre navigateur.");
      } else {
        toast.error("Échec de la souscription aux notifications.");
      }
    } finally {
      setPushPending(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !appUser) {
      toast.error("Veuillez vous connecter pour soumettre votre paiement.");
      return;
    }

    if (!file) {
      toast.error("Veuillez téléverser votre reçu de paiement.");
      return;
    }

    if (supported && getPushPermission() !== "granted") {
      toast.error("Action requise : Veuillez activer les notifications système avant d'envoyer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${(appUser as any).id}-${Date.now()}.${fileExt}`;
      const filePath = `${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage.
      from("vip-proofs").
      upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.
      from("vip-proofs").
      getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("vip_requests").insert({
        user_id: (appUser as any).id,
        user_email: (appUser as any).email,
        payment_method: paymentMethod,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount_usd: selectedPlan.priceUsd,
        duration_days: selectedPlan.days,
        proof_url: publicUrl,
        status: "pending"
      });

      if (dbError) throw dbError;

      try {
        await fetch("https://api.haitiannud.com/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "🚨 Nouveau reçu VIP reçu !",
            body: `L'utilisateur ${(appUser as any).email} a payé ${selectedPlan.priceUsd}$ (${selectedPlan.name} - ${selectedPlan.days}j) via ${paymentMethod.toUpperCase()}.`,
            url: "/admin",
            icon: "/logo.jpg",
            targetUserId: "admin"
          })
        });
      } catch (pushErr) {
        console.error("Échec notification admin:", pushErr);
      }

      toast.success("Preuve de paiement reçue avec succès !");
      setStep('success');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 min-h-screen max-w-5xl">
      {step === 'info' &&
      <div className="space-y-12 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-500/20">
              <Sparkles className="h-4 w-4 fill-yellow-500" /> {t("Espace Membre Premium")}
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
              {isUserVip ? t("Votre Abonnement VIP est Actif") : t("Choisissez votre formule VIP")}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {isUserVip ? t("Merci pour votre confiance ! Vous disposez actuellement d'un accès illimité et sécurisé à l'ensemble de la plateforme.") : t("Profitez d'un accès illimité aux vidéos et photos HD selon la durée de votre choix.")


            }
            </p>
          </div>

          {!isUserVip &&
        <div className="space-y-6">
              <h2 className="text-xl font-bold text-center">{t("Nos Formules d'Abonnement")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SUBSCRIPTION_PLANS.map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ?
                  "border-yellow-500 bg-yellow-500/10 shadow-lg scale-[1.02]" :
                  "border-border bg-card/50 hover:border-primary/40"}`
                  }>
                  
                      {p.popular &&
                  <span className="absolute -top-3 right-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t("Recommandé")}
                        </span>
                  }
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-base">{p.name}</h3>
                          {isSelected && <Check className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="text-2xl font-mono font-bold text-foreground">
                          {p.priceUsd}$ <span className="text-xs font-normal text-muted-foreground">USD</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          ~ {p.htg.toLocaleString()} HTG
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>{t("Durée :")}</span>
                          <span className="font-bold text-foreground">{p.days} jours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Prix par jour :")}</span>
                          <span className="font-mono text-yellow-500">{p.dailyRate}</span>
                        </div>
                      </div>
                    </div>);

            })}
              </div>

              <div className="max-w-md mx-auto text-center pt-4">
                {isSignedIn ?
            <Button onClick={() => setStep('payment')} className="w-full py-6 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl shadow-lg gap-2">
                    {t("S'abonner avec la formule")} {selectedPlan.name} ({selectedPlan.priceUsd}$) <ArrowRight className="h-5 w-5" />
                  </Button> :

            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full py-6 text-base font-bold rounded-xl gap-2">
                    <LogIn className="h-5 w-5" /> {t("Connectez-vous pour vous abonner")}
                  </Button>
            }
              </div>
            </div>
        }

          {isUserVip &&
        <div className="max-w-md mx-auto text-center p-6 bg-gradient-to-b from-yellow-500/10 to-transparent rounded-2xl border border-yellow-500/30 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown className="h-24 w-24 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20 mb-3 shadow-inner">
                <Crown className="h-6 w-6 fill-yellow-500" />
              </div>
              <p className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-1">{t('plans.premium_active')}</p>
              <h3 className="text-xl font-bold mb-2">{t('plans.welcome_vip')}</h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                {t("Votre abonnement est actuellement actif sur ce compte.")}
              </p>
              <Button onClick={() => setLocation("/vip-catalog")} className="w-full py-6 text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl gap-2 shadow-lg">
                {t("Explorer le catalogue privé")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
        }

          <div className="max-w-xl mx-auto border-t pt-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 justify-center">
              <Send className="h-5 w-5 text-primary" /> {t("Rejoindre nos communautés")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COMMUNITY_LINKS.map((link) =>
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 transition-all text-center">
                  <div className="mb-2">
                    <div className="font-semibold text-xs text-foreground">{link.label}</div>
                    <div className="text-[11px] text-muted-foreground">{link.desc}</div>
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs bg-primary text-white gap-1">Rejwenn</Button>
                </a>
            )}
            </div>
          </div>
        </div>
      }

      {step === 'payment' &&
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-serif font-bold">{t('plans.how_to_pay')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Formule choisie :")} <span className="font-bold text-yellow-500">{selectedPlan.name} ({selectedPlan.priceUsd}{t("$ USD / ~")}{selectedPlan.htg} {t("HTG /")} {selectedPlan.days} {t("jours)")}</span>
              </p>
            </div>

            {/* Instruction paiement */}
            <div className="space-y-4">
              {/* Option 1 : Depuis l'étranger (TapTap Send) */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                  <Globe className="h-4 w-4" /> {t("1. Si vous résidez à l'Étranger (TapTap Send)")}
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground pl-2">
                  <p>{t("• Ouvrez l'application")} <strong>{t("TapTap Send")}</strong>.</p>
                  <p>{t("• Sélectionnez")} <strong>{t("Haïti (+509)")}</strong> {t("comme destination.")}</p>
                  <p>{t("• Saisissez le montant exact de la formule :")} <strong className="text-foreground">{selectedPlan.priceUsd} {t("$ USD")}</strong>.</p>
                  <p>{t("• Envoyez sur le compte NatCash :")}</p>
                  <div className="p-3 bg-muted/40 border border-border/60 rounded-lg space-y-1 my-2">
                    <p className="text-xs">{t("Numéro NatCash :")} <span className="font-bold text-foreground font-mono">+509 32 49 24 65</span></p>
                    <p className="text-xs">{t("Nom du compte :")} <span className="font-bold text-foreground">{t("Dafca Saint Vill")}</span></p>
                  </div>
                  <p>{t("• Prenez une capture d'écran claire de votre reçu TapTap Send.")}</p>
                </div>
              </div>

              {/* Option 2 : Depuis Haïti (Dépôt ou Transfert) */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-500">
                  <MapPin className="h-4 w-4" /> {t("2. Si vous résidez en Haïti (Dépôt / Transfert)")}
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground pl-2">
                  <p>{t("• Effectuez simplement un")} <strong>{t("dépôt ou un transfert direct")}</strong> {t("d'un montant de")} <strong className="text-foreground">{selectedPlan.htg} HTG</strong>.</p>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1 my-2">
                    <p className="text-xs">{t("NatCash :")} <span className="font-bold text-emerald-500 font-mono">+509 32 49 24 65</span></p>
                    <p className="text-xs">{t("Nom du compte :")} <span className="font-bold text-foreground">{t("Dafca Saint Vill")}</span></p>
                  </div>
                  <p>{t("• Prenez une capture d'écran ou une photo nette du reçu de confirmation de transfert/dépôt.")}</p>
                </div>
              </div>

              {/* Option 3 : Autre méthode via Telegram */}
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-xs text-sky-400 flex items-center justify-center sm:justify-start gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> {t("Vous préférez un autre moyen de paiement ?")}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t("Contactez-nous directement sur Telegram pour procéder au paiement.")}
                  </p>
                </div>
                <a
                href="https://T.me/dg_haitiannud"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto">
                
                  <Button size="sm" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs gap-1.5 rounded-lg whitespace-nowrap">
                    {t("Écrire sur Telegram")}
                  </Button>
                </a>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setStep('info')} className="text-xs text-muted-foreground hover:text-foreground">
              {t("← Changer de formule")}
            </Button>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-card border-border shadow-xl sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> {t("Transmettre le reçu")}
                </h3>
                
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-yellow-500">{t("Formule :")} {selectedPlan.name}</p>
                    <p>{t("Montant :")} <strong>{selectedPlan.priceUsd}{t("$ USD")}</strong> (~{selectedPlan.htg} {t("HTG)")}</p>
                    <p>{t("Accès :")} <strong>{selectedPlan.days} jours</strong> VIP</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('plans.payment_method_used')}</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-1 gap-3">
                      <div>
                        <RadioGroupItem value="natcash" id="natcash" className="sr-only" />
                        <Label htmlFor="natcash" className="flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-bold text-center border-emerald-500 bg-emerald-500/10 text-emerald-500">NatCash</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof-file" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('plans.screenshot_proof')}</Label>
                    <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-4 bg-background hover:bg-muted/20 transition-all cursor-pointer group">
                      <input type="file" id="proof-file" required accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <FileImage className={`h-8 w-8 mb-2 ${file ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`} />
                      <p className="text-xs font-medium text-center text-foreground max-w-[200px] truncate">{file ? file.name : "Cliquez pour choisir un fichier"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{t('plans.file_limits')}</p>
                    </div>
                  </div>

                  {supported && getPushPermission() !== "granted" ?
                <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-xl space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        ⚠️ <strong>{t('plans.action_required')}</strong> {t("Autorisez les notifications système pour débloquer l'envoi.")}
                      </p>
                      {getPushPermission() === "denied" ?
                  <p className="text-[11px] text-destructive font-bold flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" /> {t("Autorisation bloquée dans le navigateur.")}
                        </p> :

                  <Button type="button" onClick={handleActivatePushBeforeSubmit} disabled={pushPending} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-2 rounded-lg gap-1.5">
                          <BellRing className="h-3.5 w-3.5" /> {pushPending ? t("Activation...") : t("Activer les notifications système")}
                        </Button>
                  }
                    </div> :

                <Button type="submit" disabled={isSubmitting || !file} className="w-full py-5 text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl mt-4">
                      {isSubmitting ? "Sécurisation & Envoi..." : `Envoyer ma preuve (${selectedPlan.priceUsd}$)`}
                    </Button>
                }
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      }

      {step === 'success' &&
      <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-scale-in">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold tracking-tight">{t('plans.thank_you')}</h2>
            <p className="text-sm text-muted-foreground px-4">
              {t("Votre preuve de paiement pour la formule")} <span className="font-bold text-yellow-500">{selectedPlan.name} ({selectedPlan.days} {t("jours)")}</span> {t("a été transmise aux administrateurs.")}
            </p>
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="w-full py-5 rounded-xl text-xs font-semibold">
            {t("Retourner au Catalogue Public")}
          </Button>
        </div>
      }
    </div>);

}