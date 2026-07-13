import { useEffect, useState } from 'react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";

import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Watch } from "@/pages/watch";
import { Search } from "@/pages/search";
import { Plans } from "@/pages/plans";
import { Account } from "@/pages/account";
import { Admin } from "@/pages/admin";
import { Legal } from "@/pages/legal";
import { LoginPage } from "@/pages/login";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { ResetPasswordPage } from "@/pages/reset-password";
import { DownloadsPage } from "@/pages/downloads";

// 🚀 AJOUTÉ : Importation de vos nouvelles pages de Live et Studio Admin
import { Live } from "@/pages/live";
import { AdminLive } from "@/pages/admin-live";

// 🌟 AJOUTÉ : Importation du catalogue privé VIP
import { VipCatalog } from "@/pages/vip-catalog";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// 🌐 MOTEUR DE TRADUCTION INVISIBLE PAR COOKIE (Anti-barre natif)
function AutoTranslator() {
  useEffect(() => {
    // 1. Injection dynamique du script Google Translate si absent
    if (!document.getElementById("google-translate-script")) {
      const addScript = document.createElement("script");
      addScript.id = "google-translate-script";
      addScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(addScript);
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "fr",
          includedLanguages: "fr,ht,en,es",
          autoDisplay: false, // Bloque l'affichage automatique de la bannière par Google
        },
        "google_translate_element"
      );
    };

    // Force la langue directement dans la structure attendue par le cookie Google Translate (/langue_source/langue_cible)
    const forceGoogleCookie = (lang: string) => {
      document.cookie = `googtrans=/fr/${lang}; path=/; domain=.haitiannud.com`;
      document.cookie = `googtrans=/fr/${lang}; path=/;`; // Sécurité locale / environnements de test
    };

    // 2. Détection automatique par IP si aucune configuration manuelle n'existe
    if (!localStorage.getItem("auto-lang")) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          const country = data.country_code;
          let targetLang = "fr";

          if (country === "HT") targetLang = "ht";
          else if (["US", "CA", "GB"].includes(country)) targetLang = "en";
          else if (["ES", "DO", "MX", "AR"].includes(country)) targetLang = "es";

          localStorage.setItem("auto-lang", targetLang);
          forceGoogleCookie(targetLang);
          applyLanguage(targetLang);
        })
        .catch(() => applyLanguage("fr"));
    } else {
      // Si une langue a déjà été choisie/sauvegardée, on l'injecte dans le cookie et on l'applique
      const savedLang = localStorage.getItem("auto-lang") || "fr";
      forceGoogleCookie(savedLang);
      const interval = setInterval(() => {
        if (applyLanguage(savedLang)) clearInterval(interval);
      }, 300);
    }
  }, []);

  const applyLanguage = (lang: string) => {
    const selectElem = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (selectElem) {
      selectElem.value = lang;
      selectElem.dispatchEvent(new Event("change"));
      return true;
    }
    return false;
  };

  // On cache l'élément d'ancrage de Google via les styles inline stricts pour être sûr à 100%
  return <div id="google_translate_element" style={{ display: 'none', width: 0, height: 0, opacity: 0 }} />;
}

function App() {
  const [location] = useLocation(); // Récupère l'URL courante pour forcer l'animation

  return (
    <WouterRouter base={basePath}>
      {/* Injecté au sommet de l'arbre du routeur pour s'appliquer de manière globale */}
      <AutoTranslator />
      
      <TooltipProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ScrollToTop /> 
            
            <Layout>
              {/* Le div ci-dessous réactive l'animation CSS fluide à chaque changement de page grâce à l'attribut key */}
              <div key={location} className="animate-page-fade">
                <Switch>
                  <Route path="/" component={Home} />
                  
                  {/* 🌟 AJOUTÉ : Route pour le catalogue privé VIP */}
                  <Route path="/vip-catalog" component={VipCatalog} />
                  
                  <Route path="/watch/:id" component={Watch} />

                  <Route path="/search" component={Search} />
                  <Route path="/plans" component={Plans} />
                  <Route path="/account" component={Account} />
                  <Route path="/admin" component={Admin} />
                  
                  {/* 🚀 AJOUTÉ : Vos nouvelles routes pour le Live */}
                  <Route path="/live" component={Live} />
                  <Route path="/admin-live" component={AdminLive} />

                  <Route path="/legal" component={Legal} />
                  <Route path="/login" component={LoginPage} />
                  <Route path="/forgot-password" component={ForgotPasswordPage} />
                  <Route path="/reset-password" component={ResetPasswordPage} />
                  <Route path="/downloads" component={DownloadsPage} />
                  
                  {/* Route de secours (404) */}
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
