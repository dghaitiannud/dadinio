import { Link, useLocation } from "wouter";
import { Home, Star, User, Download, Radio } from "lucide-react"; 
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { isSignedIn } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>

        {/* 🚀 MODIFIÉ : Remplacement de l'onglet Recherche par l'onglet En Direct */}
        <Link 
          href={isSignedIn ? "/live" : "/login"} 
          onClick={(e) => {
            if (!isSignedIn) {
              e.preventDefault();
              setLocation("/login");
            }
          }}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/live' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}
        >
          <div className="relative">
            <Radio className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
          <span className="text-[10px] font-medium">En direct</span>
        </Link>

        <Link href="/plans" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/plans' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Star className="h-5 w-5" />
          <span className="text-[10px] font-medium">VIP</span>
        </Link>
        
        <Link href="/downloads" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/downloads' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Download className="h-5 w-5" />
          <span className="text-[10px] font-medium">Téléchargements</span>
        </Link>
        
        <Link 
          href={isSignedIn ? "/account" : "/login"} 
          onClick={(e) => {
            if (!isSignedIn) {
              e.preventDefault();
              setLocation("/login");
            }
          }}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.startsWith('/account') || location.startsWith('/login') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Compte</span>
        </Link>
      </div>
    </div>
  );
}
