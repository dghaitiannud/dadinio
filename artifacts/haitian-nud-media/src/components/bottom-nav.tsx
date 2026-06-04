import { Link, useLocation } from "wouter";
import { Home, Search, Star, User } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>
        <Link href="/search" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/search' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Recherche</span>
        </Link>
        <Link href="/plans" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/plans' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Star className="h-5 w-5" />
          <span className="text-[10px] font-medium">VIP</span>
        </Link>
        <Link href="/account" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.startsWith('/account') ? 'text-primary' : 'text-muted-foreground'}`}>
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Compte</span>
        </Link>
      </div>
    </div>
  );
}
