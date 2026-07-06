import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

export function LoginPage() {
  const { signIn, signUp, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // État pour afficher/masquer le mot de passe
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // NOUVEAU : État pour forcer l'affichage de l'erreur dans le formulaire
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
        
        // Sécurité : On vérifie toutes les structures possibles où l'erreur pourrait se cacher
        const errorObj = result?.error || result;
        
        if (errorObj && errorObj.message) {
          setFormError(errorObj.message);
          toast.error(errorObj.message);
        } else if (errorObj && typeof errorObj === 'string') {
          setFormError(errorObj);
        } else {
          // Si result est vide ou n'indique rien mais que l'utilisateur n'est pas connecté,
          // on va manuellement tester une connexion brute ou lever une alerte générique
          toast.success("Demande envoyée");
          
          // Petit hack : Attendre un court instant pour voir si l'état de connexion change
          setTimeout(() => {
            if (!isSignedIn) {
              setFormError("Identifiants incorrects ou problème de synchronisation.");
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
          toast.success("Compte créé !");
          setLocation("/");
        }
      }
    } catch (err: any) {
      // Ce bloc attrape TOUT ce qui plante de force
      console.error("Erreur interceptée :", err);
      const msg = err?.message || err?.error_description || "Une erreur est survenue.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6 flex items-start justify-center sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest">
            HN
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">HAITIAN NUD</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? "Connexion simple et rapide" : "Créer ton compte en quelques secondes"}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={mode === "signin" ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setMode("signin"); setFormError(null); }}
          >
            <LogIn className="h-4 w-4 mr-2" /> Connexion
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => { setMode("signup"); setFormError(null); }}
          >
            <UserPlus className="h-4 w-4 mr-2" /> Inscription
          </Button>
        </div>

        {/* NOUVEAU : Bloc d'erreur visuel et statique au milieu du formulaire */}
        {formError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Erreur : </span>
              {formError === "User already registered" ? "Cet e-mail possède déjà un compte." : formError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom d'utilisateur</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ton pseudo"
                required={mode === "signup"}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {loading ? "Chargement..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <div className="mt-6 space-y-2">
          {mode === "signin" && (
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => setLocation("/forgot-password")}
                className="text-muted-foreground hover:text-primary"
              >
                Mot de passe oublié ?
              </Button>
            </div>
          )}
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
