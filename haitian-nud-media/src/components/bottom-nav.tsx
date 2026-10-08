import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Home, Star, User, Download, Radio, Sparkles } from "lucide-react"; 
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { isSignedIn } = useAuth();

  const isVipActive = location === '/plans';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe">
      <nav className="mx-auto max-w-md bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border border-border/60 shadow-2xl rounded-t-2xl px-1 pt-1.5 pb-1">
        <div className="flex justify-around items-center h-14">
          
          {/* ACCUEIL */}
          <Link 
            href="/" 
            className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
              location === '/' 
                ? 'text-primary font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className={`h-5 w-5 transition-transform duration-200 ${location === '/' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">{t('common.home')}</span>
            {location === '/' && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-50" />
            )}
          </Link>

          {/* EN DIRECT */}
          <Link 
            href={isSignedIn ? "/live" : "/login"} 
            onClick={(e) => {
              if (!isSignedIn) {
                e.preventDefault();
                setLocation("/login");
              }
            }}
            className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
              location === '/live' 
                ? 'text-red-500 font-bold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Radio className={`h-5 w-5 transition-transform duration-200 ${location === '/live' ? 'scale-110 text-red-500' : ''}`} />
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-background"></span>
              </span>
            </div>
            <span className="text-[10px] mt-1 font-medium">{t('nav.live_stream')}</span>
            {location === '/live' && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-red-500 rounded-full animate-in fade-in zoom-in-50" />
            )}
          </Link>

          {/* VIP (BOUTON STAR ANIME & ATTIRANT) */}
          <Link 
            href="/plans" 
            className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
              isVipActive 
                ? 'text-yellow-400 font-bold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {/* Halos de lumière dorée en arrière-plan */}
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md animate-pulse" />
              
              <div className="relative">
                <Star 
                  className={`h-5 w-5 fill-yellow-400/20 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-transform duration-300 ${
                    isVipActive ? 'scale-125 rotate-12 fill-yellow-400' : 'animate-bounce'
                  }`} 
                />
                <Sparkles className="absolute -top-2 -right-2 h-3 w-3 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              </div>

              {/* Badge HOT / VIP */}
              <span className="absolute -top-3.5 -right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[8px] px-1.5 py-0.2 rounded-full shadow-lg border border-yellow-200 tracking-wider">
                VIP
              </span>
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${isVipActive ? 'text-yellow-400' : 'text-yellow-400/90'}`}>
              {t('common.vip')}
            </span>
            {isVipActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-yellow-400 rounded-full animate-in fade-in zoom-in-50" />
            )}
          </Link>

          {/* TÉLÉCHARGEMENTS */}
          <Link 
            href="/downloads" 
            className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
              location === '/downloads' 
                ? 'text-primary font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className={`h-5 w-5 transition-transform duration-200 ${location === '/downloads' ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">{t('common.downloads')}</span>
            {location === '/downloads' && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-50" />
            )}
          </Link>

          {/* COMPTE */}
          <Link 
            href={isSignedIn ? "/account" : "/login"} 
            onClick={(e) => {
              if (!isSignedIn) {
                e.preventDefault();
                setLocation("/login");
              }
            }}
            className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
              location.startsWith('/account') || location.startsWith('/login') 
                ? 'text-primary font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className={`h-5 w-5 transition-transform duration-200 ${location.startsWith('/account') || location.startsWith('/login') ? 'scale-110' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">{t('common.account')}</span>
            {(location.startsWith('/account') || location.startsWith('/login')) && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-50" />
            )}
          </Link>

        </div>
      </nav>
    </div>
  );
}
