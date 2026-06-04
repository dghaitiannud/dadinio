import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, ArrowLeft } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

export function LoginPage() {
  const { signIn, signUp, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  if (isSignedIn) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Email ou mot de passe incorrect");
        } else {
          toast.success("Connexion réussie !");
          setLocation("/");
        }
      } else {
        const { error, data } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message || "Erreur lors de l'inscription");
        } else {
          if (data?.user?.identities?.length === 0) {
            toast.info("Ce compte existe déjà. Connectez-vous.");
            setMode("signin");
          } else {
            toast.success("Compte créé ! Vérifiez votre email si confirmation requise.");
            setLocation("/");
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
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
            onClick={() => setMode("signin")}
          >
            <LogIn className="h-4 w-4 mr-2" /> Connexion
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("signup")}
          >
            <UserPlus className="h-4 w-4 mr-2" /> Inscription
          </Button>
        </div>

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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
                minLength={6}
              />
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

        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
