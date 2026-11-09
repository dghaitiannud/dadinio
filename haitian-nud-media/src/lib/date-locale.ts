import { useTranslation } from "react-i18next";
import { fr, enUS, es } from "date-fns/locale";
import type { Locale } from "date-fns";

// date-fns n'a pas de locale créole haïtien : on garde les noms de mois français,
// mais on remplace les durées relatives ("il y a 3 jours") par du créole.
const htUnits: Record<string, (n: number) => string> = {
  lessThanXSeconds: () => "kèk segonn",
  xSeconds: (n) => `${n} segonn`,
  halfAMinute: () => "30 segonn",
  lessThanXMinutes: () => "mwens pase yon minit",
  xMinutes: (n) => `${n} minit`,
  aboutXHours: (n) => `anviwon ${n} è`,
  xHours: (n) => `${n} è`,
  xDays: (n) => `${n} jou`,
  aboutXWeeks: (n) => `anviwon ${n} semèn`,
  xWeeks: (n) => `${n} semèn`,
  aboutXMonths: (n) => `anviwon ${n} mwa`,
  xMonths: (n) => `${n} mwa`,
  aboutXYears: (n) => `anviwon ${n} an`,
  xYears: (n) => `${n} an`,
  overXYears: (n) => `plis pase ${n} an`,
  almostXYears: (n) => `prèske ${n} an`,
};

const ht: Locale = {
  ...fr,
  code: "ht",
  formatDistance: (token, count, options) => {
    const text = (htUnits[token] ?? (() => ""))(count);
    if (options?.addSuffix) return options.comparison && options.comparison > 0 ? `nan ${text}` : `${text} de sa`;
    return text;
  },
};

const LOCALES: Record<string, Locale> = { fr, en: enUS, es, ht };

/** Retourne la locale date-fns correspondant à la langue active de l'interface. */
export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  const code = (i18n.resolvedLanguage || i18n.language || "fr").slice(0, 2);
  return LOCALES[code] ?? fr;
}
