import { useEffect } from 'react';
// 🚀 MODIFIÉ : Ajout de "Redirect" dans l'importation de wouter
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function App() {
  const [location] = useLocation(); // Récupère l'URL courante pour forcer l'animation

  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ScrollToTop /> 
            
            <Layout>
              {/* Le div ci-dessous réactive l'animation CSS fluide à chaque changement de page grâce à l'attribut key */}
              <div key={location} className="animate-page-fade">
                <Switch>
                  {/* 🚀 MODIFIÉ : Redirige automatiquement l'accueil noire vers la page admin fonctionnelle */}
                  <Route path="/">
                    <Redirect to="/login" />
                  </Route>
                  
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
