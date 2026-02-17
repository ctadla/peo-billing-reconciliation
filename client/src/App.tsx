import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import InvoiceReconciliation from "@/pages/InvoiceReconciliation";
import PeoBilling from "@/pages/PeoBilling";

function Router() {
  return (
    <Switch>
      <Route path="/" component={InvoiceReconciliation} />
      <Route path="/peo-billing" component={PeoBilling} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
