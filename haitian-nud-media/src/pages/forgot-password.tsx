import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell, AuthField, authPrimaryButton } from "@/components/auth-shell";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Supabase Auth directly. Never pre-check an email address, because
      // that creates an account-enumeration endpoint.
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        // Keep the public response identical whether an account exists or not.
        console.warn("Password reset request could not be completed:", resetError.message);
      }

      setSent(true);
      toast.success(t("Si un compte correspond à cette adresse, un email de réinitialisation sera envoyé."));
    } catch (err) {
      console.warn("Password reset request failed:", err);
      // Avoid revealing account existence even on an unexpected error.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? t("Email envoyé !") : t("Mot de passe oublié ?")}
      subtitle={
        sent
          ? t("Si un compte correspond à cette adresse, un lien de réinitialisation sera envoyé.")
          : t("Entrez votre email pour recevoir un lien de réinitialisation.")
      }
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
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="email"
            label={t("account.email")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("votre@email.com")}
            autoComplete="email"
            required
          />
          <Button type="submit" disabled={loading} className={cn(authPrimaryButton, "mt-2")}>
            {loading ? t("Vérification...") : t("Envoyer le lien de réinitialisation")}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <p>{t("Vérifiez votre boîte de réception. Si votre compte existe, vous recevrez un lien de réinitialisation.")}</p>
          </div>
          <Button
            variant="outline"
            className="h-12 w-full rounded-full text-base"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            {t("Renvoyer l'email")}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
