import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // État pour le premier champ
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // État pour le deuxième champ
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message || "Erreur lors de la mise à jour");
      } else {
        setDone(true);
        toast.success("Mot de passe mis à jour !");
        setTimeout(() => setLocation("/login"), 3000);
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {done ? <CheckCircle className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {done ? "Mot de passe mis à jour !" : "Nouveau mot de passe"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {done
              ? "Vous allez être redirigé vers la page de connexion."
              : "Choisissez un nouveau mot de passe sécurisé."}
          </p>
        </div>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.new_password')}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirm">{t('auth.confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Aller à la connexion
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/login")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
