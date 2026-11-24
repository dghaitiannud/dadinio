import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { AuthShell, AuthField, authPrimaryButton } from "@/components/auth-shell";
import { cn } from "@/lib/utils";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("Les mots de passe ne correspondent pas"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("Le mot de passe doit contenir au moins 6 caractères"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message || t("Erreur lors de la mise à jour"));
      } else {
        setDone(true);
        toast.success(t("Mot de passe mis à jour !"));
        setTimeout(() => setLocation("/login"), 3000);
      }
    } catch (err: any) {
      toast.error(err?.message || t("Erreur"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={done ? t("Mot de passe mis à jour !") : t("Nouveau mot de passe")}
      subtitle={done ? t("Vous allez être redirigé vers la page de connexion.") : t("Choisissez un nouveau mot de passe sécurisé.")}
      footer={
        <button
          type="button"
          onClick={() => setLocation("/login")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Retour à la connexion")}
        </button>
      }
    >
      {!done ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="password"
            label={t("auth.new_password")}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <AuthField
            id="confirm"
            label={t("auth.confirm_password")}
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <Button type="submit" disabled={loading} className={cn(authPrimaryButton, "mt-2")}>
            {loading ? t("Mise à jour...") : t("Réinitialiser le mot de passe")}
          </Button>
        </form>
      ) : (
        <div className="space-y-6 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
          <p className="text-muted-foreground">{t("Votre mot de passe a été réinitialisé avec succès.")}</p>
          <Button onClick={() => setLocation("/login")} className={authPrimaryButton}>
            {t("Aller à la connexion")}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
