import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AdminGuard } from "@/components/admin-guard";

import Home from "@/pages/home";
import Catalogue from "@/pages/catalogue";
import Prix from "@/pages/prix";
import Commander from "@/pages/commander";
import Fournisseurs from "@/pages/fournisseurs";
import TableauDeBord from "@/pages/tableau-de-bord";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/catalogue" component={Catalogue} />
        <Route path="/prix" component={Prix} />
        <Route path="/commander" component={Commander} />
        <Route path="/fournisseurs" component={Fournisseurs} />
        <Route path="/tableau-de-bord" component={TableauDeBord} />
        <Route path="/admin">
          <AdminGuard>
            <Admin />
          </AdminGuard>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
