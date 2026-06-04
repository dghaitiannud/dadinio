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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Layout>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/watch/:id" component={Watch} />
                <Route path="/search" component={Search} />
                <Route path="/plans" component={Plans} />
                <Route path="/account" component={Account} />
                <Route path="/admin" component={Admin} />
                <Route path="/legal" component={Legal} />
                <Route path="/login" component={LoginPage} />
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
            </Layout>
          </QueryClientProvider>
        </AuthProvider>
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
