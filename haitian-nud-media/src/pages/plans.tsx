import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Send, Star, CheckCircle2, ShieldCheck, DollarSign, 
  Smartphone, Upload, Sparkles, LogIn, ArrowRight 
} from "lucide-react";

const TELEGRAM_LINKS = [
  { label: "Groupe 1", url: "https://t.me/+R3geXsW7ZL8zNTM5", desc: "Groupe principal" },
  { label: "Groupe 2", url: "https://t.me/+UXtFEcF2Dw8zNGYx", desc: "Groupe secondaire" },
  { label: "Canal 1", url: "https://t.me/hatiannud_canal", desc: "Canal officiel" },
  { label: "Canal 2", url: "https://t.me/fans_haitian_nud", desc: "Canal communauté" },
];

export function Plans() {
  const { isSignedIn, appUser } = useAuth();
  const [, setLocation] = useLocation();

  // Gestion des étapes : 'info' | 'payment' | 'success'
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<"moncash" | "natcash">("moncash");
  const [proofUrl, setProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soumission du formulaire à Supabase
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !appUser) {
      toast.error("Veuillez vous connecter pour soumettre votre paiement.");
      return;
    }

    if (!proofUrl.trim()) {
      toast.error("Veuillez fournir le lien de votre preuve de paiement.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("vip_requests").insert({
        user_id: (appUser as any).id,
        user_email: (appUser as any).email,
        payment_method: paymentMethod,
        proof_url: proofUrl.trim(),
        status: "pending"
      });

      if (error) throw error;

      toast.success("Preuve envoyée avec succès !");
      setStep('success'); // Passage à l'écran de remerciement bloqué par état
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 min-h-screen max-w-4xl">
      
      {/* ÉTAPE 1 : DÉCOUVRIR LES AVANTAGES VIP */}
      {step === 'info' && (
        <div className="space-y-12 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-500/20">
              <Sparkles className="h-4 w-4 fill-yellow-500" /> Espace Membre Premium
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6 tracking-tight">
              Découvrez tous les avantages d'un abonnement VIP
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              En devenant membre VIP de Haitian Nud, vous bénéficierez d'un accès exclusif et illimité à l'intégralité de notre contenu privé.
            </p>
          </div>

          {/* Grille des privilèges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Regardez toutes les anciennes vidéos, ainsi que les nouvelles publications d'influenceurs haïtiens et internationaux dès leur mise en ligne.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">En tant qu'abonné VIP, vous aurez également accès à des vidéos d'influenceurs que nous n'avons pas encore publiées officiellement.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Téléchargez autant de vidéos et de photos que vous le souhaitez, sans aucune limite ni restriction.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
              <CardContent className="p-5 flex gap-4 items-start">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Accédez à tout le contenu en Full HD 4K pour une qualité d'image supérieure et une expérience visuelle exceptionnelle.</p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-md mx-auto text-center p-6 bg-secondary/30 rounded-2xl border border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Tarif Unique</p>
            <div className="text-3xl font-bold font-mono text-primary my-2 flex items-center justify-center gap-1">
              <DollarSign className="h-7 w-7 text-yellow-500" /> 20 USD <span className="text-muted-foreground text-sm font-normal">ou</span> 2 500 HTG
            </div>
            <p className="text-xs text-muted-foreground mb-6">Vous bénéficierez également d'un accès prioritaire aux nouveaux contenus régulièrement ajoutés.</p>
            
            {isSignedIn ? (
              <Button onClick={() => setStep('payment')} className="w-full py-6 text-base font-bold rounded-xl shadow-lg gap-2">
                Devenir VIP maintenant <ArrowRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={() => setLocation("/auth")} variant="destructive" className="w-full py-6 text-base font-bold rounded-xl gap-2">
                <LogIn className="h-5 w-5" /> Connectez-vous pour vous abonner
              </Button>
            )}
          </div>

          {/* Accès aux Groupes Telegram */}
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

      {/* ÉTAPE 2 : FORMULAIRE DE PAIEMENT & CONSIGNES TAPTAP SEND */}
      {step === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* Guide d'instructions à gauche */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-serif font-bold">Comment payer votre abonnement VIP ?</h2>
              <p className="text-sm text-muted-foreground mt-1">Le paiement est simple, rapide et sécurisé via MonCash ou NatCash.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                <Smartphone className="h-4 w-4" /> 💳 Étapes du paiement via l'application (TapTap Send)
              </h3>
              <div className="space-y-3 text-xs text-muted-foreground max-h-[50vh] overflow-y-auto pr-2">
                <p><span className="font-semibold text-foreground text-primary">Étape 1 :</span> Téléchargez l'application TapTap Send depuis l'App Store ou le Google Play Store.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 2 :</span> Cliquez sur « S'inscrire » ou sur le logo Google.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 3 :</span> Saisissez vos nom et prénom.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 4 :</span> Saisissez votre numéro de téléphone et le code de confirmation reçu par SMS.</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 5 :</span> Sélectionnez le pays de destination (Haïti +509).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 6 :</span> Saisissez le montant (20 $).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 7 :</span> Ajoutez le nom du destinataire du paiement : cela dépend du mode de paiement choisi.</p>
                <div className="pl-4 border-l-2 border-primary/30 py-1 space-y-1 my-2 bg-muted/30 rounded-r-md">
                  <p>• Si vous choisissez <span className="font-medium text-foreground">MonCash</span>, utilisez le numéro MonCash indiqué sur le site et le nom associé.</p>
                  <p>• Si vous choisissez <span className="font-medium text-foreground">NatCash</span>, utilisez le numéro NatCash indiqué sur le site et le nom fourni.</p>
                </div>
                <p>Cliquez ensuite sur « Suivant ».</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 8 :</span> Saisissez votre adresse e-mail (@email.com).</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 9 :</span> Saisissez les informations de contact demandées et cliquez sur « Enregistrer ».</p>
                <p><span className="font-semibold text-foreground text-primary">Étape 10 :</span> Vérifiez toutes les informations et cliquez sur « Envoyer ».</p>
              </div>
            </div>
            
            <Button variant="ghost" onClick={() => setStep('info')} className="text-xs text-muted-foreground hover:text-foreground">
              ← Retour aux avantages
            </Button>
          </div>

          {/* Formulaire de soumission à droite */}
          <div className="lg:col-span-5">
            <Card className="bg-card border-border shadow-xl sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Soumettre votre reçu
                </h3>
                
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Choix de l'opérateur */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">1. Mode de paiement utilisé</Label>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(v: any) => setPaymentMethod(v)} 
                      className="grid grid-cols-2 gap-3"
                    >
                      <div>
                        <RadioGroupItem value="moncash" id="moncash" className="sr-only" />
                        <Label 
                          htmlFor="moncash" 
                          className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-bold text-center transition-all ${paymentMethod === 'moncash' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                        >
                          MonCash
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="natcash" id="natcash" className="sr-only" />
                        <Label 
                          htmlFor="natcash" 
                          className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-bold text-center transition-all ${paymentMethod === 'natcash' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                        >
                          NatCash
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Coordonnées indicatives pour le virement */}
                  <div className="p-3 rounded-lg bg-muted border text-xs space-y-1 text-muted-foreground">
                    <p className="font-bold text-foreground mb-1">📞 Envoyez le transfert sur :</p>
                    {paymentMethod === 'moncash' ? (
                      <>
                        <p>Numéro MonCash : <span className="font-mono text-foreground font-bold">XXXX-XXXX</span></p>
                        <p>Nom associé : <span className="text-foreground font-medium">Haitian Nud Media</span></p>
                      </>
                    ) : (
                      <>
                        <p>Numéro NatCash : <span className="font-mono text-foreground font-bold">XXXX-XXXX</span></p>
                        <p>Nom associé : <span className="text-foreground font-medium">Haitian Nud Media</span></p>
                      </>
                    )}
                  </div>

                  {/* Preuve de paiement */}
                  <div className="space-y-2">
                    <Label htmlFor="proof-url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      2. URL de votre Preuve de paiement
                    </Label>
                    <Input 
                      id="proof-url" 
                      required
                      placeholder="Collez le lien de la capture d'écran / reçu..."
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="bg-background rounded-xl"
                    />
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Une fois le paiement effectué, hébergez ou téléchargez simplement votre preuve de paiement et insérez son lien public ici.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !proofUrl} 
                    className="w-full py-5 text-sm font-bold rounded-xl mt-4"
                  >
                    {isSubmitting ? "Envoi de la preuve..." : "Envoyer mon reçu"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* ÉTAPE 3 : ÉCRAN DE REMERCIEMENT (ACCÈS UNIQUE PAR SOUMISSION FORMULAIRE) */}
      {step === 'success' && (
        <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-scale-in">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Merci pour votre confiance !</h2>
            <p className="text-sm text-muted-foreground px-4">
              Votre reçu de paiement via <span className="font-semibold text-foreground uppercase">{paymentMethod}</span> a été transmis avec succès à notre équipe d'administration.
            </p>
          </div>

          <div className="p-4 bg-card border rounded-2xl text-left text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-sm mb-1">⏳ Qu'arrive-t-il maintenant ?</p>
            Notre équipe vérifiera manuellement la validité de votre transfert et votre accès VIP complet sera activé sur votre compte <span className="font-semibold text-foreground">{appUser?.email}</span> en moins de 5 minutes. Vous recevrez une notification dès validation.
          </div>

          {/* Groupes de secours Telegram */}
          <div className="pt-4 border-t space-y-3">
            <p className="text-xs font-medium text-foreground">En attendant la validation, restez connecté avec nous :</p>
            <div className="flex flex-wrap justify-center gap-2">
              {TELEGRAM_LINKS.slice(0, 2).map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-xs font-semibold">
                  <Send className="h-3 w-3 text-primary" /> {link.label}
                </a>
              ))}
            </div>
          </div>

          <Button onClick={() => setLocation("/")} variant="outline" className="w-full py-5 rounded-xl text-xs font-semibold">
            Retourner au Catalogue Public
          </Button>
        </div>
      )}

    </div>
  );
}
