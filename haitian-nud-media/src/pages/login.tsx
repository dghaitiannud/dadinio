import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { AuthShell, AuthField, authPrimaryButton } from "@/components/auth-shell";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signUp, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        } else if (errorObj && typeof errorObj === "string") {
          setFormError(errorObj);
        } else {
          toast.success(t("auth.login_success"));
          setTimeout(() => {
            if (!isSignedIn) {
              setFormError(t("Identifiants incorrects ou adresse e-mail non confirmée."));
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
          setFormError(t("Cet e-mail est déjà utilisé par un autre compte."));
          setMode("signin");
        } else {
          setSignupSuccess(true);
          toast.success(t("Compte créé avec succès !"));
        }
      }
    } catch (err: any) {
      console.error("Erreur interceptée :", err);
      const msg = err?.message || err?.error_description || t("Une erreur est survenue.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Après inscription ---------- */
  if (signupSuccess) {
    return (
      <AuthShell
        title={t("Un dernier geste !")}
        subtitle={t("Un e-mail de confirmation vient d'être envoyé à :")}
        footer={
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("watch.back_home")}
          </button>
        }
      >
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-sm font-medium">
          <MailCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="break-all">{email}</span>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold">{t("Étapes à suivre :")}</h2>
          <ol className="mt-4 space-y-3.5 text-sm text-muted-foreground">
            {[
              t("Consultez votre boîte de réception e-mail."),
              t("Cliquez sur le lien de confirmation."),
              t("Revenez ici et connectez-vous pour profiter du contenu !"),
            ].map((txt, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{txt}</span>
              </li>
            ))}
          </ol>
        </div>

        <Button
          onClick={() => {
            setSignupSuccess(false);
            setMode("signin");
            setFormError(null);
          }}
          className={cn(authPrimaryButton, "mt-8")}
        >
          {t("Aller à la page de connexion")}
        </Button>
      </AuthShell>
    );
  }

  /* ---------- Connexion / Inscription ---------- */
  return (
    <AuthShell
      title={mode === "signin" ? t("nav.login") : t("Inscription")}
      subtitle={mode === "signin" ? t("Bienvenue ! Connectez-vous à votre compte") : t("Rejoignez la communauté en quelques clics")}
      footer={
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("watch.back_home")}
        </button>
      }
    >
      <div role="tablist" className="mb-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setFormError(null);
            }}
            className={cn(
              "rounded-full py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
              mode === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signin" ? t("nav.login") : t("Inscription")}
          </button>
        ))}
      </div>

      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError === "User already registered" ? t("Cet e-mail possède déjà un compte.") : formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <AuthField
            id="name"
            label={t("auth.username")}
            value={displayName}
            onChange={setDisplayName}
            placeholder={t("Ton pseudo")}
            autoComplete="nickname"
            required
          />
        )}

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

        <AuthField
          id="password"
          label={t("auth.password")}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={6}
          required
          aside={
            mode === "signin" ? (
              <button
                type="button"
                onClick={() => setLocation("/forgot-password")}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("Oublié ?")}
              </button>
            ) : undefined
          }
        />

        <Button type="submit" disabled={loading} className={cn(authPrimaryButton, "mt-2")}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Patientez...")}
            </>
          ) : mode === "signin" ? (
            t("Se connecter")
          ) : (
            t("Créer mon compte")
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
