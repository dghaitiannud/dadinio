import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

// Les 4 langues demandées
type LangCode = "fr" | "ht" | "en" | "es";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function AutoTranslator({ mode = "script-only" }: { mode?: "select" | "script-only" }) {
  const [currentLang, setCurrentLang] = useState<LangCode>(() => {
    return (localStorage.getItem("auto-lang") as LangCode) || "fr";
  });

  useEffect(() => {
    // 1. Ajouter le script Google Translate s'il n'existe pas
    if (!document.getElementById("google-translate-script")) {
      const addScript = document.createElement("script");
      addScript.id = "google-translate-script";
      addScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "fr", // Ta langue de développement de base
            includedLanguages: "fr,ht,en,es",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    }

    // 2. Détection automatique par IP si aucun choix n'a été fait
    if (!localStorage.getItem("auto-lang")) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          const country = data.country_code;
          let targetLang: LangCode = "fr";

          if (country === "HT") targetLang = "ht";
          else if (["US", "CA", "GB"].includes(country)) targetLang = "en";
          else if (["ES", "DO", "MX", "AR"].includes(country)) targetLang = "es";

          triggerTranslation(targetLang);
        })
        .catch(() => triggerTranslation("fr"));
    } else {
      // Appliquer la langue stockée au démarrage
      setTimeout(() => triggerTranslation(currentLang), 1000);
    }
  }, []);

  // Fonction magique qui simule le clic sur le traducteur Google caché
  const triggerTranslation = (lang: LangCode) => {
    setCurrentLang(lang);
    localStorage.setItem("auto-lang", lang);

    const selectElem = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (selectElem) {
      selectElem.value = lang;
      selectElem.dispatchEvent(new Event("change"));
    } else {
      // Si Google Translate n'est pas encore totalement chargé, on réessaye brièvement
      setTimeout(() => triggerTranslation(lang), 300);
    }
  };

  if (mode === "script-only") {
    // Élément invisible requis par l'API Google
    return <div id="google_translate_element" className="hidden" />;
  }

  // Si mode === "select", on affiche l'interface pour les paramètres utilisateur
  return (
    <div className="space-y-4">
      <div id="google_translate_element" className="hidden" />
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Langue du site / Website Language
        </label>
        <Select value={currentLang} onValueChange={(val: LangCode) => triggerTranslation(val)}>
          <SelectTrigger className="w-full md:w-[250px]">
            <SelectValue placeholder="Changer la langue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français (FR)</SelectItem>
            <SelectItem value="ht">Kreyòl Ayisyen (HT)</SelectItem>
            <SelectItem value="en">English (EN)</SelectItem>
            <SelectItem value="es">Español (ES)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
