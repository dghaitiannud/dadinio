import { useEffect } from 'react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";

// 🌐 Configuration de la traduction native (i18n)
import "./i18n";

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

// Importation des pages de Live et Studio Admin
import { Live } from "@/pages/live";
import { AdminLive } from "@/pages/admin-live";

// Importation du catalogue privé VIP
import { VipCatalog } from "@/pages/vip-catalog";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// 🌐 Détection IP native corrigée (Spéciale Haïti + Nettoyage i18next)
function useIpLocationDetection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // On vérifie les deux clés pour éviter de surcharger un choix utilisateur existant
    if (!localStorage.getItem("i18nextLng") && !localStorage.getItem("auto-lang")) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          const country = data.country_code;
          let targetLang = "fr"; // Par défaut, repli sur le Français

          if (country === "HT") {
            targetLang = "ht"; // Détecté en Haïti -> Kreyòl d'office
          } else if (["US", "CA", "GB"].includes(country)) {
            targetLang = "en";
          } else if (["ES", "DO", "MX", "AR"].includes(country)) {
            targetLang = "es";
          }

          localStorage.setItem("auto-lang", targetLang);
          i18n.changeLanguage(targetLang);
        })
        .catch(() => {
          // Si l'API bloque ou échoue, repli de sécurité en français
          localStorage.setItem("auto-lang", "fr");
          i18n.changeLanguage("fr");
        });
    }
  }, [i18n]);
}

function App() {
  const [location] = useLocation();
  
  // 🚀 Initialisation de la détection de pays automatique sécurisée
  useIpLocationDetection();

  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ScrollToTop /> 
            
            <Layout>
              <div key={location} className="animate-page-fade">
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
