import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { PaymentLogo } from "@/components/payment-logos";
import { cn } from "@/lib/utils";

const PLANS = [
  { id: "decouverte", amount: 750, days: 7 },
  { id: "starter", amount: 1000, days: 10 },
  { id: "standard", amount: 1375, days: 15 },
  { id: "avantage", amount: 2500, days: 30 },
  { id: "prolonje", amount: 3000, days: 40 },
  { id: "confort", amount: 7500, days: 105 },
  { id: "vip_privilege", amount: 25000, days: 365 },
];

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/40";

export function TranzakCheckout() {
  const { t, i18n } = useTranslation();
  const { session, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [planId, setPlanId] = useState(new URLSearchParams(window.location.search).get("planId") || "avantage");
  const [method, setMethod] = useState<"moncash" | "natcash">("moncash");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const plan = useMemo(() => PLANS.find((p) => p.id === planId) || PLANS[3], [planId]);
  const planLabel = (id: string) => t(`plans.name.${id}`);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn || !session?.access_token) {
      toast.error(t("pay.err_login"));
      setLocation("/login");
      return;
    }
    setLoading(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `payment-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const res = await fetch("https://api.haitiannud.com/api/payments/vip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          planId,
          paymentMethod: method,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || result?.success !== true || !result?.data?.paymentUrl) {
        throw new Error(result?.message || t("pay.err_init"));
      }
      window.location.assign(result.data.paymentUrl);
    } catch (err: any) {
      toast.error(err?.message || t("pay.err_init"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-5 pb-28 pt-10 md:pt-16">
      <button
        type="button"
        onClick={() => setLocation("/plans")}
        className="mb-8 -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <ArrowLeft className="h-4 w-4" /> {t("pay.back")}
      </button>

      <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{t("pay.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("pay.subtitle")}</p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <label className="text-sm text-muted-foreground" htmlFor="plan">
            {t("pay.plan")}
          </label>
          <select
            id="plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {planLabel(p.id)} · {t("plans.days_count", { days: p.days })}
              </option>
            ))}
          </select>
          <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">{t("pay.amount")}</span>
            <span className="font-serif text-3xl font-semibold tabular-nums">
              {plan.amount.toLocaleString(i18n.language)}{" "}
              <span className="text-lg font-medium text-muted-foreground">HTG</span>
            </span>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm text-muted-foreground">{t("pay.method")}</legend>
          <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-3">
            {(["moncash", "natcash"] as const).map((m) => (
              <button
                type="button"
                key={m}
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex h-16 items-center justify-center rounded-2xl border outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  method === m
                    ? "border-amber-400 bg-amber-400/[0.06] ring-1 ring-amber-400"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <PaymentLogo brand={m} className="h-9 px-3" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-5">
          <div>
            <label htmlFor="c-name" className="text-sm text-muted-foreground">{t("pay.full_name")}</label>
            <input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="c-email" className="text-sm text-muted-foreground">{t("pay.email")}</label>
            <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="c-phone" className="text-sm text-muted-foreground">{t("pay.phone")}</label>
            <input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+509 XX XX XXXX" required autoComplete="tel" className={fieldClass} />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-amber-400 text-base font-semibold text-black hover:bg-amber-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("pay.loading")}
              </>
            ) : (
              t("plans.continue_to_payment")
            )}
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" /> {t("pay.note")}
          </p>
        </div>
      </form>
    </div>
  );
}

export function PaymentReturn() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto min-h-[70vh] max-w-md px-5 py-20 text-center">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("pay.return_title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("pay.return_desc")}</p>
      <a
        href="/account"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-amber-400 px-8 font-semibold text-black hover:bg-amber-300"
      >
        {t("pay.return_cta")}
      </a>
    </div>
  );
}

export function PaymentCancel() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto min-h-[70vh] max-w-md px-5 py-20 text-center">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("pay.cancel_title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("pay.cancel_desc")}</p>
      <a
        href="/plans"
        className="mt-8 inline-flex h-11 items-center rounded-full border border-border px-8 font-semibold hover:bg-muted"
      >
        {t("pay.cancel_cta")}
      </a>
    </div>
  );
}
