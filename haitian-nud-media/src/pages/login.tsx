import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, ArrowLeft, AlertCircle, Eye, EyeOff, MailCheck, CheckCircle2, User, Loader2, Sparkles } from "lucide-react";

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (isSignedIn) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    
    try {
      if (mode === "signin") {
        const result = await signIn(email, password);
        const errorObj = result?.error || result;
        
        if (errorObj && errorObj.message) {
          setFormError(errorObj.message);
          toast.error(errorObj.message);
        } else if (errorObj && typeof errorObj === 'string') {
          setFormError(errorObj);
        } else {
          toast.success("Demande envoyée");
          setTimeout(() => {
            if (!isSignedIn) {
              setFormError("Identifiants incorrects ou adresse e-mail non confirmée.");
            } else {
              setLocation("/");
            }
          }, 1000);
        }
      } else {
        const result = await signUp(email, password, displayName);
        const errorObj = result?.error || result;
        
        if (errorObj && errorObj.message) {
          setFormError(errorObj.message);
          toast.error(errorObj.message);
        } else if (result?.data?.user?.identities?.length === 0) {
          setFormError("Cet e-mail est déjà utilisé par un autre compte.");
          setMode("signin");
        } else {
          setSignupSuccess(true);
          toast.success("Compte créé avec succès !");
        }
      }
    } catch (err: any) {
      console.error("Erreur interceptée :", err);
      const msg = err?.message || err?.error_description || "Une erreur est survenue.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background px-4 py-8 flex items-center justify-center overflow-hidden">
      {/* Effets de halos lumineux d'arrière-plan */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl transition-all duration-300">
        
        {/* Header avec Logo */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white font-extrabold text-base tracking-wider shadow-lg shadow-primary/30">
            HN
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-300 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">HAITIAN NUD</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {signupSuccess 
              ? "Vérification de votre adresse e-mail" 
              : mode === "signin" 
                ? "Bienvenue ! Connectez-vous à votre compte" 
                : "Rejoignez la communauté en quelques clics"
            }
          </p>
        </div>

        {/* ÉCRAN APRÈS INSCRIPTION RÉUSSIE */}
        {signupSuccess ? (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <MailCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h2 className="font-bold text-base text-foreground">Un dernier geste !</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Un e-mail de confirmation vient d'être envoyé à :<br />
                  <span className="font-semibold text-foreground break-all">{email}</span>
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl text-left text-xs space-y-2.5 text-muted-foreground border border-border/60">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Étapes à suivre :
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground/90">
                <li>Consultez votre boîte de réception e-mail.</li>
                <li>Cliquez sur le lien de confirmation.</li>
                <li>Revenez ici et connectez-vous pour profiter du contenu !</li>
              </ol>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button 
                onClick={() => {
                  setSignupSuccess(false);
                  setMode("signin");
                  setFormError(null);
                }} 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-transform active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4 mr-2" /> Aller à la page de connexion
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/")} 
                className="w-full text-muted-foreground hover:text-foreground rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> {t('watch.back_home')}
              </Button>
            </div>
          </div>
        ) : (
          /* FORMULAIRE CLASSIQUE CONNEXION / INSCRIPTION */
          <>
            {/* Segmented control / Switcher */}
            <div className="grid grid-cols-2 p-1 gap-1 mb-6 bg-muted/60 rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => { setMode("signin"); setFormError(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  mode === "signin"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" /> {t('nav.login')}
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setFormError(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" /> Inscription
              </button>
            </div>

            {/* Bloc d'erreur visuel */}
            {formError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-bold">{t('common.error')} : </span>
                  {formError === "User already registered" ? "Cet e-mail possède déjà un compte." : formError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground/90">{t('auth.username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ton pseudo"
                      className="pl-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary"
                      required={mode === "signup"}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground/90">{t('account.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground/90">{t('auth.password')}</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setLocation("/forgot-password")}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-[0_0_20px_rgba(30,94,255,0.3)] transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Patientez...
                  </span>
                ) : mode === "signin" ? (
                  "Se connecter"
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/")} 
                className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />{t('watch.back_home')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
