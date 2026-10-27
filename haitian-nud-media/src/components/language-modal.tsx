import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageModal() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Si l'utilisateur n'a pas encore choisi de langue manuellement
    const savedLang = localStorage.getItem("i18nextLng");
    const hasChosen = localStorage.getItem("has_chosen_language");

    if (!hasChosen) {
      // On ne l'affiche que si i18n a fini de charger et n'est pas vide
      if (savedLang) {
        setOpen(true);
      }
    }
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("has_chosen_language", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-border bg-card shadow-2xl [&>button]:hidden">
        <DialogHeader className="text-center sm:text-center flex flex-col items-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Globe className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-serif text-center">Choose your language</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Choisissez votre langue / Chwazi lang ou / Elige tu idioma
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant={i18n.language.startsWith("fr") ? "default" : "outline"} onClick={() => changeLanguage("fr")} className="h-12 text-base">
            🇫🇷 Français
          </Button>
          <Button variant={i18n.language.startsWith("ht") ? "default" : "outline"} onClick={() => changeLanguage("ht")} className="h-12 text-base">
            🇭🇹 Kreyòl
          </Button>
          <Button variant={i18n.language.startsWith("en") ? "default" : "outline"} onClick={() => changeLanguage("en")} className="h-12 text-base">
            🇺🇸 English
          </Button>
          <Button variant={i18n.language.startsWith("es") ? "default" : "outline"} onClick={() => changeLanguage("es")} className="h-12 text-base">
            🇪🇸 Español
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}