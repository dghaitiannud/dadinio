import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isPushSupported, getPushPermission, subscribeToPush, getCurrentSubscription } from "@/lib/push-notifications";
import { Header } from "./header";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { AgeGate } from "./age-gate";
import { ReactNode } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
// Import du nouveau composant de chat
import { FloatingSupport } from "@/components/floating-support"; 

interface LayoutProps {
  children: ReactNode;
}

// 🔔 BANNIÈRE GLOBALE PSYCHOLOGIQUE POUR FORCER LES NOTIFICATIONS
function NotificationWarningBanner() {
  const { isSignedIn, appUser } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const supported = isPushSupported();

  useEffect(() => {
    if (isSignedIn && supported) {
      getCurrentSubscription().then(sub => {
        if (!sub && getPushPermission() !== "denied") {
          setShowBanner(true);
        }
      });
    }
  }, [isSignedIn, supported]);

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-white text-xs py-2.5 px-4 text-center font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500 z-[100] sticky top-0 shadow-md">
      <BellRing className="h-4 w-4 animate-bounce shrink-0" />
      <span>Activez vos notifications pour être alerté dès que votre accès VIP est validé et ne manquer aucune nouvelle vidéo !</span>
      <button 
        onClick={async () => {
          try {
            const ok = await subscribeToPush(appUser?.id);
            if (ok) {
              setShowBanner(false);
              toast.success("Notifications activées avec succès !");
            } else {
              toast.error("Veuillez accepter l'autorisation du navigateur.");
            }
          } catch (err) {
            console.error("Erreur d'activation push banner:", err);
          }
        }}
        className="bg-black/20 hover:bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide transition-all ml-2 border border-white/20 active:scale-95"
      >
        Activer maintenant
      </button>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  // On récupère l'utilisateur connecté ici pour passer son statut au composant de support
  const { appUser } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <NotificationWarningBanner />
      
      <AgeGate />
      <Header />
      
      <main className="flex-1 w-full relative">
        {children}
      </main>
      
      <Footer />
      <BottomNav />

      {/* Le bouton de chat flottant est ajouté ici, il sera présent sur toutes les pages */}
      <FloatingSupport currentUser={appUser} />
    </div>
  );
}
