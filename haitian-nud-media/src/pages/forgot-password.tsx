import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Interrogation de ton API privée sur Render pour valider l'existence de l'e-mail
      const response = await fetch("https://api-6rzs.onrender.com/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkResult = await response.json();

      if (!response.ok || !checkResult.exists) {
        setError("Cet e-mail n'existe pas sur la plateforme.");
        setLoading(false);
        return;
      }

      // 2. Si l'e-mail existe, on procède à l'envoi du lien de réinitialisation via Supabase
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        toast.error(resetError.message || "Erreur lors de l'envoi");
      } else {
        setSent(true);
        toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
      }
    } catch (err: any) {
      setError("Impossible de joindre le serveur de sécurité.");
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6 flex items-start justify-center sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {sent ? <ShieldCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {sent ? "Email envoyé !" : "Mot de passe oublié ?"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent
              ? "Un lien de réinitialisation a été envoyé à votre adresse email."
              : "Entrez votre email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        {/* Bloc d'erreur visuel si l'e-mail n'est pas présent dans la DB */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{t('common.error')}</span>
              {error}
            </div>
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('account.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="votre@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? "Vérification..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-primary font-medium">
                Vérifiez votre boîte de réception et cliquez sur le lien reçu.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
                setError(null);
              }}
            >
              Renvoyer l'email
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