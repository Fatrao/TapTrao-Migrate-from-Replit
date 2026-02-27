import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner, usePageViewTracking } from "@/components/cookie-consent";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminData from "@/pages/admin-data";
import Lookup from "@/pages/lookup";
import LcCheck from "@/pages/lc-check";
import Dashboard from "@/pages/dashboard";
import Pricing from "@/pages/pricing";
import Trades from "@/pages/trades";
import Templates from "@/pages/templates";
import TokenSuccess from "@/pages/token-success";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import SettingsProfile from "@/pages/settings-profile";
import Inbox from "@/pages/inbox";
import SupplierUploadPage from "@/pages/supplier-upload";
import VerifyPage from "@/pages/verify";
import AlertsPage from "@/pages/alerts";
import AdminAlertsPage from "@/pages/admin-alerts";
import AdminLogin from "@/pages/admin-login";
import AdminPromoCodes from "@/pages/admin-promo-codes";
import AdminApiKeys from "@/pages/admin-api-keys";
import EudrPage from "@/pages/eudr";
import DemurragePage from "@/pages/demurrage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/lookup" component={Lookup} />
      <Route path="/lc-check" component={LcCheck} />
      <Route path="/trades" component={Trades} />
      <Route path="/templates" component={Templates} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/tokens/success" component={TokenSuccess} />
      <Route path="/admin/data" component={AdminData} />
      <Route path="/admin/alerts/new" component={AdminAlertsPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/promo-codes" component={AdminPromoCodes} />
      <Route path="/admin/api-keys" component={AdminApiKeys} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/settings/profile" component={SettingsProfile} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/upload/:token" component={SupplierUploadPage} />
      <Route path="/verify/:ref" component={VerifyPage} />
      <Route path="/eudr/:lookupId" component={EudrPage} />
      <Route path="/demurrage" component={DemurragePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PageViewTracker() {
  usePageViewTracking();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PageViewTracker />
        <Router />
        <CookieConsentBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
