import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';import { useTranslation } from "react-i18next";

export function AnniversaryOverlay() {const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [years, setYears] = useState(1);

  // 🧪 MODE TEST : Passe à `true` pour forcer l'affichage maintenant !
  const TEST_MODE = false;

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0 = Janvier, 7 = Août
    const date = now.getDate(); // Jour du mois (1 à 31)
    const year = now.getFullYear();

    const isFirstWeekOfAugust = month === 7 && date >= 1 && date <= 7;

    // Si on est la 1ère semaine d'août OU si le MODE TEST est activé
    if (isFirstWeekOfAugust || TEST_MODE) {
      const currentAge = year - 2025;
      setYears(currentAge > 0 ? currentAge : 1);

      // En mode test, on affiche toujours l'animation
      if (TEST_MODE) {
        setIsVisible(true);
        triggerConfetti();
      } else {
        const hasClosedToday = localStorage.getItem(`anniversary_dismissed_${year}_${date}`);
        if (!hasClosedToday) {
          setIsVisible(true);
          triggerConfetti();
        }
      }
    }
  }, []);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#eab308', '#ec4899', '#3b82f6', '#10b981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#eab308', '#ec4899', '#3b82f6', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleClose = () => {
    const now = new Date();
    localStorage.setItem(`anniversary_dismissed_${now.getFullYear()}_${now.getDate()}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-lg animate-in slide-in-from-top-5 duration-300">
      <div className="bg-gradient-to-r from-yellow-500/90 via-amber-600/90 to-yellow-500/90 text-black p-4 rounded-2xl shadow-2xl border border-yellow-300/40 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-black/10 p-2.5 rounded-xl shrink-0">
            <PartyPopper className="h-7 w-7 text-black animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-sm uppercase tracking-wider text-black/80">
              <Sparkles className="h-4 w-4" /> {t("Joyeux Anniversaire !")}
            </div>
            <h4 className="font-serif font-black text-lg leading-tight text-black">
              {t("Haitian Nud fête ses")} {years} {years > 1 ? 'ans' : 'an'} ! 🥳
            </h4>
            <p className="text-xs text-black/80 font-medium">
              {t("Merci de faire partie de notre communauté !")}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="hover:bg-black/10 rounded-full h-8 w-8 text-black shrink-0">
          
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>);

}