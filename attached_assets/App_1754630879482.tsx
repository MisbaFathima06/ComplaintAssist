import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./providers/theme-provider";
import { ZkIdentityProvider } from "./components/zk-identity-provider";
import Home from "@/pages/home";
import Report from "@/pages/report";
import Status from "@/pages/status";
import Community from "@/pages/community";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report" component={Report} />
      <Route path="/status" component={Status} />
      <Route path="/community" component={Community} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="speaksecure-theme">
        <ZkIdentityProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ZkIdentityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
