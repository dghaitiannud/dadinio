import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Home, Star, User, Menu, LogOut, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PwaInstallButton } from "@/components/pwa-install";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const { isSignedIn, user, appUser, signOut } = useAuth();
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/g, "");

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = basePath || "/";
  };

  return (
    /* 🌐 Ajout de la classe "skiptranslate" si nécessaire, mais ici on laisse Google agir de force avec l'arbre du DOM rafraîchi */
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:h-16">
        <div className="flex items-center gap-2">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('nav.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-border">
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-xl">{t("HAITIAN NUD")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Home className="h-5 w-5" /> <span>{t('common.home')}</span>
                </Link>
                <Link href="/search" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Search className="h-5 w-5" /> <span>{t('common.search')}</span>
                </Link>
                <Link href="/plans" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Star className="h-5 w-5" /> <span>{t('nav.become_vip')}</span>
                </Link>

                {isSignedIn &&
                <Link href="/live" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg text-red-500 font-semibold hover:text-red-600 transition-colors">
                    <Radio className="h-5 w-5" /> <span>{t('common.live')}</span>
                  </Link>
                }

                <div className="mt-4 pt-4 border-t border-border">
                  {isSignedIn ?
                  <>
                      <Link href="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                        <User className="h-5 w-5" /> <span>{t('nav.my_account')}</span>
                      </Link>
                      <div className="px-2 mt-4">
                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {handleLogout();setIsMenuOpen(false);}}>
                          <LogOut className="h-4 w-4 mr-2" /> <span>{t('nav.logout')}</span>
                        </Button>
                      </div>
                    </> :

                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full"><span>{t('nav.login')}</span></Button>
                    </Link>
                  }
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/logo.jpg`} alt="Logo" className="h-8 w-8 rounded object-cover" />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
              {t("HAITIAN NUD")}
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "/", label: t("common.home") },
            { href: "/search", label: t("common.search") },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                location === l.href ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
          {isSignedIn && (
            <Link
              href="/live"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                location === "/live" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden /> {t("common.live")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/search" className="text-muted-foreground transition-colors hover:text-foreground md:hidden" aria-label={t("common.search")}>
            <Search className="h-5 w-5" />
          </Link>
          <div className="hidden md:block"><PwaInstallButton /></div>
          {appUser?.plan !== "vip" && (
            <Link
              href="/plans"
              className="hidden h-8 items-center rounded-full bg-amber-400 px-4 text-sm font-semibold text-black transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
            >
              {t("nav.become_vip")}
            </Link>
          )}
          {isSignedIn ? (
            <Link href="/account" aria-label={t("common.account")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <Avatar
                className={cn(
                  "h-8 w-8",
                  appUser?.plan === "vip" && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background",
                )}
              >
                <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
                  {(appUser?.displayName || appUser?.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="h-8 rounded-full px-4">
                <span>{t("nav.login")}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
