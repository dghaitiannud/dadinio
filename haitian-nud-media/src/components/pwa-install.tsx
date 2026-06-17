import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function HaitianNudLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-serif text-[10px] font-bold tracking-[0.18em]">
      HN
    </div>
  );
}

export function PwaInstallButton({ variant = "compact" }: { variant?: "compact" | "card" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (installed) return null;

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
        <HaitianNudLogo />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">Installer l'application</div>
          <div className="text-xs text-muted-foreground">
            {deferred
              ? "Ajoutez Haitian nud à votre écran d'accueil."
              : "Sur iPhone : Partager → \"Sur l'écran d'accueil\". Sur Android : menu → \"Installer l'application\"."}
          </div>
        </div>
        {deferred && (
          <Button size="sm" onClick={install} className="bg-primary text-primary-foreground shrink-0">
            <Download className="h-4 w-4 mr-1" /> Installer
          </Button>
        )}
      </div>
    );
  }

  if (!deferred) return null;
  return (
    <Button size="sm" variant="outline" onClick={install} className="border-primary/40 text-primary hover:bg-primary/10">
      <Download className="h-4 w-4 mr-1" /> Installer l'app
    </Button>
  );
}
