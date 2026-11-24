import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { PwaInstallButton } from "@/components/pwa-install";

type IconProps = { d: string };

/** Icône monochrome : suit la couleur du texte, donc lisible en thème clair comme sombre. */
function Glyph({ d }: IconProps) {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const PATHS = {
  tiktok: "M19.589 6.686a4.793 4.793 0 0 1-3.288-1.442V11.9a5.357 5.357 0 1 1-5.357-5.356c.123 0 .245.004.366.013V9.3a2.6 2.6 0 1 0-.366 4.903 2.628 2.628 0 0 0 2.612-2.612V2.778h2.756c.111.954.59 1.812 1.344 2.424a4.778 4.778 0 0 0 1.933.793v3.023h-.002Z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  telegram: "M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18l-1.91 9c-.14.63-.51.79-1.04.49l-2.91-2.15-1.4 1.35c-.15.15-.29.28-.59.28l.21-2.94 5.35-4.84c.23-.2-.05-.32-.36-.12l-6.62 4.16-2.85-.89c-.62-.2-.63-.62.13-.91l11.13-4.29c.51-.19.97.11.77.87z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
};

export function Footer() {
  const { t } = useTranslation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const socials = [
    { label: "TikTok · @www.haitiannud.com", href: "https://tiktok.com/@www.haitiannud.com", d: PATHS.tiktok },
    { label: "Instagram · @dg_haitian_nud", href: "https://www.instagram.com/dg_haitian_nud?igsh=azNndHRpaTAxdW54", d: PATHS.instagram },
    { label: "Facebook · HAITIAN NUD", href: "https://www.facebook.com/profile.php?id=61589379306203", d: PATHS.facebook },
    { label: t("Chaîne WhatsApp"), href: "https://whatsapp.com/channel/0029Vb7HrRy4Y9lh08zVuB3b", d: PATHS.whatsapp },
    { label: t("Voye zen pa Telegram"), href: "https://t.me/dg_haitiannud", d: PATHS.telegram },
  ];

  const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  const headingClass = "mb-4 text-sm font-semibold";

  return (
    <footer className="w-full border-t border-border/60 bg-background pb-24 pt-14 md:pb-12">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <img src={`${basePath}/logo.jpg`} alt="" className="h-9 w-9 rounded-xl object-cover" />
            <span className="font-serif text-xl font-semibold tracking-tight">{t("HAITIAN NUD")}</span>
          </Link>

          <ul className="mt-6 flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Glyph d={s.d} />
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <PwaInstallButton />
          </div>
        </div>

        <nav aria-label={t("footer.navigation")}>
          <h4 className={headingClass}>{t("footer.navigation")}</h4>
          <ul className="space-y-2.5">
            <li><Link href="/" className={linkClass}>{t("common.home")}</Link></li>
            <li><Link href="/search" className={linkClass}>{t("common.search")}</Link></li>
            <li><Link href="/plans" className={linkClass}>{t("nav.become_vip")}</Link></li>
            <li><Link href="/account" className={linkClass}>{t("nav.my_account")}</Link></li>
          </ul>
        </nav>

        <div>
          <h4 className={headingClass}>{t("footer.distribution_channels")}</h4>
          <ul className="space-y-2.5">
            <li><a href="https://t.me/hatiannud_canal" target="_blank" rel="noopener noreferrer" className={linkClass}>{t("footer.join_group")}</a></li>
            <li><a href="https://wa.me/50931310227" target="_blank" rel="noopener noreferrer" className={linkClass}>{t("footer.send_zen_whatsapp")}</a></li>
            <li><a href="https://T.me/dg_haitiannud" target="_blank" rel="noopener noreferrer" className={linkClass}>{t("footer.send_zen_telegram")}</a></li>
          </ul>
        </div>

        <div>
          <h4 className={headingClass}>{t("Légal")}</h4>
          <ul className="space-y-2.5">
            <li><Link href="/legal" className={linkClass}>{t("legal.terms")}</Link></li>
            <li><Link href="/legal" className={linkClass}>{t("footer.privacy_policy")}</Link></li>
            <li><Link href="/legal" className={linkClass}>{t("footer.legal_notice")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-6xl flex-col gap-2 border-t border-border/60 px-5 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>{t("footer.rights_reserved", { year: new Date().getFullYear() })}</p>
        <p>{t("footer.adults_only")}</p>
      </div>
    </footer>
  );
}
