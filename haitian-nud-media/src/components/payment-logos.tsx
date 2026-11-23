import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logos des moyens de paiement mobile.
 * - MonCash : SVG local (/public/payments/moncash.svg), déjà sur fond rouge arrondi.
 * - NatCash : PNG hébergé sur le storage du projet.
 * Si une image ne charge pas, un repère typographique prend le relais.
 */
const BRANDS = {
  moncash: {
    label: "MonCash",
    src: "/payments/moncash.svg",
    color: "#E5002B",
    // Le SVG porte déjà son fond : pas de pastille blanche autour.
    frame: "overflow-hidden rounded-lg",
    img: "h-full w-auto",
  },
  natcash: {
    label: "NatCash",
    src: "https://api.haitiannud.com/storage/v1/object/public/thumbnails/natcash.png",
    color: "#1E9E4A",
    frame: "rounded-lg bg-white px-2 ring-1 ring-black/10",
    img: "h-full w-auto max-w-[96px] object-contain py-1",
  },
} as const;

export type PaymentBrand = keyof typeof BRANDS;

export function PaymentLogo({ brand, className }: { brand: PaymentBrand; className?: string }) {
  const [failed, setFailed] = useState(false);
  const b = BRANDS[brand];

  return (
    <span className={cn("inline-flex h-8 shrink-0 items-center justify-center", b.frame, className)}>
      {failed ? (
        <span
          className="flex items-center gap-1.5 px-2.5 text-[13px] font-semibold tracking-tight"
          style={{ color: b.color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} aria-hidden />
          {b.label}
        </span>
      ) : (
        <img
          src={b.src}
          alt={b.label}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className={b.img}
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
