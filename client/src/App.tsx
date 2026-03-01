import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner, usePageViewTracking } from "@/components/cookie-consent";
import { AuthGuard } from "@/components/AuthGuard";
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
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NewCheck from "@/pages/new-check";
import TradeDetail from "@/pages/trade-detail";

function Router() {
  return (
    <Switch>
      {/* Public routes — no auth required */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/lookup" component={Lookup} />
      <Route path="/upload/:token" component={SupplierUploadPage} />
      <Route path="/verify/:ref" component={VerifyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/demurrage" component={DemurragePage} />

      {/* Protected routes — require authentication */}
      <Route path="/new-check">{() => <AuthGuard><NewCheck /></AuthGuard>}</Route>
      <Route path="/dashboard">{() => <AuthGuard><Dashboard /></AuthGuard>}</Route>
      <Route path="/lc-check">{() => <AuthGuard><LcCheck /></AuthGuard>}</Route>
      <Route path="/trades/:id">{() => <AuthGuard><TradeDetail /></AuthGuard>}</Route>
      <Route path="/trades">{() => <AuthGuard><Trades /></AuthGuard>}</Route>
      <Route path="/templates">{() => <AuthGuard><Templates /></AuthGuard>}</Route>
      <Route path="/pricing">{() => <AuthGuard><Pricing /></AuthGuard>}</Route>
      <Route path="/tokens/success">{() => <AuthGuard><TokenSuccess /></AuthGuard>}</Route>
      <Route path="/settings/profile">{() => <AuthGuard><SettingsProfile /></AuthGuard>}</Route>
      <Route path="/inbox">{() => <AuthGuard><Inbox /></AuthGuard>}</Route>
      <Route path="/alerts">{() => <AuthGuard><AlertsPage /></AuthGuard>}</Route>
      <Route path="/eudr/:lookupId">{() => <AuthGuard><EudrPage /></AuthGuard>}</Route>

      {/* Admin routes */}
      <Route path="/admin/data">{() => <AuthGuard><AdminData /></AuthGuard>}</Route>
      <Route path="/admin/alerts/new">{() => <AuthGuard><AdminAlertsPage /></AuthGuard>}</Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/promo-codes">{() => <AuthGuard><AdminPromoCodes /></AuthGuard>}</Route>
      <Route path="/admin/api-keys">{() => <AuthGuard><AdminApiKeys /></AuthGuard>}</Route>

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
