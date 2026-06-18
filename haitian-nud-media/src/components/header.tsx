import { useState } from "react"; // AJOUTÉ
import { Link, useLocation } from "wouter";
import { Search, Home, Star, User, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PwaInstallButton } from "@/components/pwa-install";

export function Header() {
  const { isSignedIn, user, appUser, signOut } = useAuth();
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");
  
  // NOUVEAU : État pour contrôler l'ouverture/fermeture du menu mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = basePath || "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* MODIFIÉ : open et onOpenChange liés à notre état */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-border">
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-xl">HAITIAN NUD</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {/* MODIFIÉ : Chaque lien ferme le menu au clic */}
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Home className="h-5 w-5" /> Accueil
                </Link>
                <Link href="/search" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Search className="h-5 w-5" /> Recherche
                </Link>
                <Link href="/plans" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Star className="h-5 w-5" /> Devenir VIP
                </Link>
                <div className="mt-4 pt-4 border-t border-border">
                  {isSignedIn ? (
                    <>
                      <Link href="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                        <User className="h-5 w-5" /> Mon Compte
                      </Link>
                      <div className="px-2 mt-4">
                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Connexion</Button>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/logo.jpg`} alt="Logo" className="h-8 w-8 rounded object-cover" />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
              HAITIAN NUD
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            Accueil
          </Link>
          <Link href="/search" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/search' ? 'text-primary' : 'text-muted-foreground'}`}>
            Recherche
          </Link>
          <Link href="/plans" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/plans' ? 'text-primary' : 'text-muted-foreground'}`}>
            VIP
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/search" className="md:hidden text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Link>
          <div className="hidden md:block"><PwaInstallButton /></div>
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/account" className="hidden sm:block">
                <Button variant="ghost" size="sm">Compte</Button>
              </Link>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
