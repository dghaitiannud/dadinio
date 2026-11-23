import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logos des moyens de paiement mobile.
 *
 * Dépose les fichiers officiels dans /public/payments/ :
 *   moncash.png (ou .svg) · natcash.png (ou .svg)
 * Tant qu'ils sont absents, un repère typographique propre s'affiche à la place.
 */
const BRANDS = {
  moncash: { label: "MonCash", file: "/payments/moncash.png", color: "#E31B23" },
  natcash: { label: "NatCash", file: "/payments/natcash.png", color: "#1E9E4A" },
} as const;

export type PaymentBrand = keyof typeof BRANDS;

export function PaymentLogo({ brand, className }: { brand: PaymentBrand; className?: string }) {
  const [failed, setFailed] = useState(false);
  const b = BRANDS[brand];

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg bg-white px-2.5 ring-1 ring-black/10",
        className,
      )}
    >
      {failed ? (
        <span className="flex items-center gap-1.5 text-[13px] font-semibold tracking-tight" style={{ color: b.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} aria-hidden />
          {b.label}
        </span>
      ) : (
        <img
          src={b.file}
          alt={b.label}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-5 w-auto max-w-[84px] object-contain"
        />
      )}
    </span>
  );
}

export function PaymentLogos({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PaymentLogo brand="moncash" />
      <PaymentLogo brand="natcash" />
    </span>
  );
}
