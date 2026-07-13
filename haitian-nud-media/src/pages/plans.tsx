import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Send, Star, CheckCircle2, ShieldCheck, DollarSign, 
  Smartphone, Upload, Sparkles, LogIn, ArrowRight, FileImage, Crown, BellRing, ShieldAlert
} from "lucide-react";

// Utilisation de tes fonctions d'alertes push natives
import { isPushSupported, getPushPermission, subscribeToPush } from "@/lib/push-notifications";

const TELEGRAM_LINKS = [
  { label: "Groupe 1", url: "https://t.me/+R3geXsW7ZL8zNTM5", desc: "Groupe principal" },
  { label: "Groupe 2", url: "https://t.me/+UXtFEcF2Dw8zNGYx", desc: "Groupe secondaire" },
  { label: "Canal 1", url: "https://t.me/hatiannud_canal", desc: "Canal officiel" },
  { label: "Canal 2", url: "https://t.me/fans_haitian_nud", desc: "Canal communauté" },
];

export function Plans() {
  const { t } = useTranslation();
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  const isUserVip = isSignedIn && appUser && (appUser as any).plan === "vip";
  const supported = isPushSupported();

  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<"moncash" | "natcash">("moncash");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushPending, setPushPending] = useState(false);

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

    // Protection : Bloquer si le navigateur supporte le push mais que l'utilisateur n'a pas encore validé
    if (supported && getPushPermission() !== "granted") {
      toast.error("Action requise : Veuillez activer les notifications système avant d'envoyer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${(appUser as any).id}-${Date.now()}.${fileExt}`;
      const filePath = `${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vip-proofs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from("vip-proofs")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("vip_requests").insert({
        user_id: (appUser as any).id,
        user_email: (appUser as any).email,
        payment_method: paymentMethod,
        proof_url: publicUrl,
        status: "pending"
      });

      if (dbError) throw dbError;

      try {
        await fetch("https://api-6rzs.onrender.com/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "🚨 Nouveau reçu VIP reçu !",
            body: `L'utilisateur ${(appUser as any).email} a envoyé une preuve via ${paymentMethod.toUpperCase()}.`,
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
    <div className="container mx-auto px-4 py-8 md:py-16 min-h-screen max-w-4xl">
      {step === 'info' && (
        <div className="space-y-12 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-500/20">
              <Sparkles className="h-4 w-4 fill-yellow-500" /> Espace Membre Premium
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
              {isUserVip ? "Votre Abonnement VIP est Actif" : "Découvrez tous les avantages d'un abonnement VIP"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {isUserVip 
                ? "Merci pour votre confiance ! Vous disposez actuellement d'un accès illimité et sécurisé à l'ensemble de la plateforme."
                : "En devenant membre VIP de Haitian Nud, vous bénéficierez d'un accès exclusif et illimité à l'intégralité de notre contenu privé."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{t('plans.vip_desc_1')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{t('plans.vip_desc_2')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{t('plans.vip_desc_3')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{t('plans.vip_desc_4')}</p>
              </CardContent>
            </Card>
          </div>

          {isUserVip ? (
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
                Votre abonnement est actuellement actif sur ce compte. Vous n'avez plus besoin d'effectuer de virement. Profitez pleinement des galeries et vidéos HD !
              </p>
              <Button onClick={() => setLocation("/vip-catalog")} className="w-full py-6 text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl gap-2 shadow-lg">
                Explorer le catalogue privé <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center p-6 bg-secondary/30 rounded-2xl border border-border">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold text-yellow-500">{t('plans.sub_1_month')}</p>
              <div className="text-3xl font-bold font-mono text-primary my-2 flex items-center justify-center gap-1">
                <DollarSign className="h-7 w-7 text-yellow-500" /> 20 USD <span className="text-muted-foreground text-sm font-normal">ou</span> 2 500 HTG
              </div>
              <p className="text-xs text-muted-foreground mb-6">{t('plans.priority_access')}</p>
              {isSignedIn ? (
                <Button onClick={() => setStep('payment')} className="w-full py-6 text-base font-bold rounded-xl shadow-lg gap-2">{t('account.become_vip_now')}<ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button onClick={() => setLocation("/login")} variant="outline" className="w-full py-6 text-base font-bold rounded-xl gap-2">
                  <LogIn className="h-5 w-5" /> Connectez-vous pour vous abonner
                </Button>
              )}
            </div>
          )}

          <div className="max-w-xl mx-auto border-t pt-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 justify-center">
              <Send className="h-5 w-5 text-primary" /> Rejoindre nos groupes & canaux Telegram
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TELEGRAM_LINKS.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 transition-all">
                  <div>
                    <div className="font-semibold text-xs text-foreground">{link.label}</div>
                    <div className="text-[11px] text-muted-foreground">{link.desc}</div>
                  </div>
                  <Button size="sm" className="h-8 text-xs bg-primary text-white gap-1">Rejwenn</Button>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-serif font-bold">{t('plans.how_to_pay')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('plans.pay_method_desc')}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                <Smartphone className="h-4 w-4" /> Étapes du paiement via l'application (TapTap Send)
              </h3>
              <div className="space-y-3 text-xs text-muted-foreground max-h-[50vh] overflow-y-auto pr-2">
                <p><span className="font-semibold text-foreground text-primary">Étape 1 :</span> Téléchargez l'application TapTap Send depuis l'App Store ou le Google Play Store.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 2 :</span> Cliquez sur « S'inscrire » ou sur le logo Google.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 3 :</span> Saisissez vos nom et prénom.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 4 :</span> Saisissez votre numéro de téléphone et le code de confirmation reçu par SMS.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 5 :</span> Sélectionnez le pays de destination (Haïti +509).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 6 :</span> Saisissez le montant (20 $).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 7 :</span> Ajoutez le nom du destinataire du paiement selon votre choix :</p>
                <div className="pl-4 border-l-2 border-primary/30 py-1 space-y-1 my-2 bg-muted/30 rounded-r-md">
                  <p>• Si vous choisissez <span className="font-bold text-foreground">MonCash</span>, utilisez le numéro MonCash indiqué sur le site et le nom associé.</p>
                  <p>• Si vous choisissez <span className="font-bold text-foreground">NatCash</span>, utilisez le numéro NatCash indiqué sur le site et le nom fourni.</p>
                </div>
                <p>{t('plans.step_7_next')}</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 8 :</span> Saisissez votre adresse e-mail (@email.com).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 9 :</span> Saisissez les informations de contact demandées et cliquez sur « Enregistrer ».</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 10 :</span> Vérifiez toutes les informations et cliquez sur « Envoyer ».</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setStep('info')} className="text-xs text-muted-foreground hover:text-foreground">
              ← Retour aux avantages
            </Button>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-card border-border shadow-xl sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Transmettre le reçu
                </h3>
                
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('plans.payment_method_used')}</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-3">
                      <div>
                        <RadioGroupItem value="moncash" id="moncash" className="sr-only" />
                        <Label htmlFor="moncash" className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-bold text-center transition-all ${paymentMethod === 'moncash' ? 'border-foreground bg-primary/10 text-foreground' : 'border-border bg-background hover:bg-muted'}`}>MonCash</Label>
                      </div>
                      <div>
                        <RadioGroupItem value="natcash" id="natcash" className="sr-only" />
                        <Label htmlFor="natcash" className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-bold text-center transition-all ${paymentMethod === 'natcash' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-border bg-background hover:bg-muted'}`}>NatCash</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/60 border text-xs space-y-2 text-muted-foreground">
                    <p className="font-bold text-foreground text-sm border-b pb-1">{t('plans.transfer_infos')}</p>
                    {paymentMethod === 'moncash' ? (
                      <>
                        <p>Numéro MonCash : <span className="font-mono text-foreground font-bold text-sm">+509 34 25 08 08</span></p>
                        <p>Nom Destinataire : <span className="text-foreground font-bold">Jhon Wood Antoine</span></p>
                      </>
                    ) : (
                      <>
                        <p>Numéro NatCash : <span className="font-mono text-emerald-500 font-bold text-sm">+509 32 49 24 65</span></p>
                        <p>Nom Destinataire : <span className="text-foreground font-bold">Dafca Saint Vill</span></p>
                      </>
                    )}
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

                  {/* Verrouillage Push Intégré */}
                  {supported && getPushPermission() !== "granted" ? (
                    <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-xl space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        ⚠️ <strong>{t('plans.action_required')}</strong> Autorisez les notifications système pour débloquer l'envoi. Cela garantit la réception immédiate de l'alerte d'activation de votre compte.
                      </p>
                      {getPushPermission() === "denied" ? (
                        <p className="text-[11px] text-destructive font-bold flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" /> Autorisation bloquée. Modifiez les réglages de votre navigateur.
                        </p>
                      ) : (
                        <Button type="button" onClick={handleActivatePushBeforeSubmit} disabled={pushPending} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs py-2 rounded-lg gap-1.5">
                          <BellRing className="h-3.5 w-3.5" /> {pushPending ? "Activation..." : "Activer les notifications système"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button type="submit" disabled={isSubmitting || !file} className="w-full py-5 text-sm font-bold rounded-xl mt-4">
                      {isSubmitting ? "Sécurisation & Envoi..." : "Envoyer ma preuve de paiement"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-scale-in">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold tracking-tight">{t('plans.thank_you')}</h2>
            <p className="text-sm text-muted-foreground px-4">
              Votre preuve de paiement via <span className="font-semibold text-foreground uppercase">{paymentMethod}</span> a été stockée de manière sécurisée et transmise aux administrateurs.
            </p>
          </div>
          <div className="p-4 bg-card border rounded-2xl text-left text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-sm mb-1">{t('plans.what_happens_next')}</p>
            Notre équipe vérifiera manuellement la validité de votre transfert et votre accès VIP complet sera activé sur votre compte <span className="font-semibold text-foreground">{appUser?.email}</span> en moins de 5 minutes. Vous recevrez une notification dès validation.
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="w-full py-5 rounded-xl text-xs font-semibold">
            Retourner au Catalogue Public
          </Button>
        </div>
      )}
    </div>
  );
}
