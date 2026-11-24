import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cadre commun des pages de connexion / mot de passe. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mx-auto mb-8 block w-fit rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-background">
          <img src={`${basePath}/logo.jpg`} alt="HAITIAN NUD" className="h-14 w-14 rounded-2xl object-cover" />
        </Link>

        <div className="text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="mt-8">{children}</div>

        {footer && <div className="mt-8 text-center">{footer}</div>}
      </div>
    </div>
  );
}

export const authInputClass =
  "h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40";

export const authPrimaryButton =
  "h-12 w-full rounded-full bg-amber-400 text-base font-semibold text-black hover:bg-amber-300 disabled:opacity-50";

/** Champ avec libellé au-dessus ; bascule afficher/masquer intégrée pour les mots de passe. */
export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete,
  aside,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  aside?: ReactNode;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={cn(authInputClass, isPassword && "pr-12")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("auth.hide_password") : t("auth.show_password")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
