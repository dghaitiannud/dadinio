import { useEffect, useState, lazy, Suspense } from 'react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

// 🌐 Configuration de la traduction native (i18n)
import i18n from "./i18n";

import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Search } from "@/pages/search";
import { Plans } from "@/pages/plans";
import { Account } from "@/pages/account";
import { Legal } from "@/pages/legal";
import { LoginPage } from "@/pages/login";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { ResetPasswordPage } from "@/pages/reset-password";
import { DownloadsPage } from "@/pages/downloads";
import { VipCatalog } from "@/pages/vip-catalog";

// 🚀 LAZY LOADING (Chargement à la demande)
const Watch = lazy(() => import("@/pages/watch").then(m => ({ default: m.Watch })));
const Admin = lazy(() => import("@/pages/admin").then(m => ({ default: m.Admin })));
const Live = lazy(() => import("@/pages/live").then(m => ({ default: m.Live })));
const AdminLive = lazy(() => import("@/pages/admin-live").then(m => ({ default: m.AdminLive })));

// 🎉 Composant d'animation de fête
import { AnniversaryOverlay } from "@/components/anniversary-overlay";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// 🌐 Détection IP pure JavaScript (Pas de Hook, évite l'erreur 321)
function initIpLocation() {
  if (!localStorage.getItem("i18nextLng") && !localStorage.getItem("auto-lang")) {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const country = data.country_code;
        let targetLang = "fr";

        if (country === "HT") {
          targetLang = "ht"; // Haïti -> Kreyòl d'office
        } else if (["US", "CA", "GB"].includes(country)) {
          targetLang = "en";
        } else if (["ES", "DO", "MX", "AR"].includes(country)) {
          targetLang = "es";
        }

        localStorage.setItem("auto-lang", targetLang);
        i18n.changeLanguage(targetLang);
      })
      .catch(() => {
        localStorage.setItem("auto-lang", "fr");
        i18n.changeLanguage("fr");
      });
  }
}

function dismissPreloader() {
  const preloader = document.getElementById("app-preloader");
  if (preloader) {
    preloader.classList.add("fade-out");
    setTimeout(() => {
      preloader.remove();
    }, 550);
  }
}

function App() {
  const [location] = useLocation();
  const [isReady, setIsReady] = useState(false);
  
  // 🚀 Initialisation de la détection, masquage de l'animation de chargement et injection globale sécurisée de 't'
  useEffect(() => {
    (window as any).t = (key: string, options?: any) => i18n.t(key, options);
    initIpLocation();

    // Laisse une brève transition pour une animation agréable
    const timer = setTimeout(() => {
      setIsReady(true);
      dismissPreloader();
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ScrollToTop /> 
            
            {/* 🎉 Animation d'anniversaire automatique (1ère semaine d'août) */}
            <AnniversaryOverlay />

            <Layout>
              <div
                key={location}
                className={`animate-page-fade transition-opacity duration-300 ${
                  isReady ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* ⚡ SUSPENSE : Affiche un loader pendant le chargement des pages lourdes */}
                <Suspense fallback={
                  <div className="flex h-[80vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }>
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/vip-catalog" component={VipCatalog} />
                    <Route path="/watch/:id" component={Watch} />
                    <Route path="/search" component={Search} />
                    <Route path="/plans" component={Plans} />
                    <Route path="/account" component={Account} />
                    <Route path="/admin" component={Admin} />
                    <Route path="/live" component={Live} />
                    <Route path="/admin-live" component={AdminLive} />
                    <Route path="/legal" component={Legal} />
                    <Route path="/login" component={LoginPage} />
                    <Route path="/forgot-password" component={ForgotPasswordPage} />
                    <Route path="/reset-password" component={ResetPasswordPage} />
                    <Route path="/downloads" component={DownloadsPage} />
                    
                    {/* Route 404 */}
                    <Route>
                      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
                        <div className="mb-4 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                          404
                        </div>
                        <h1 className="text-3xl font-serif font-bold">Page introuvable</h1>
                        <p className="mt-2 max-w-md text-muted-foreground">La page que tu cherches n'existe pas. Retourne à l'accueil.</p>
                        <a href={basePath || "/"} className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                          Aller à l'accueil
                        </a>
                      </div>
                    </Route>
                  </Switch>
                </Suspense>
              </div>
            </Layout>
          </QueryClientProvider>
        </AuthProvider>
      </TooltipProvider>
      <Toaster />
    </WouterRouter>
  );
}

export default App;