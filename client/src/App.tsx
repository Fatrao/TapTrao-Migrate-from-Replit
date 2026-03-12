import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner, usePageViewTracking } from "@/components/cookie-consent";
import { initUtmTracking } from "@/lib/analytics";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminData from "@/pages/admin-data";

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
import AdminFeatureRequests from "@/pages/admin-feature-requests";
import EudrPage from "@/pages/eudr";
import CbamPage from "@/pages/cbam";
import DemurragePage from "@/pages/demurrage";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NewCheck from "@/pages/new-check";
import TradeDetail from "@/pages/trade-detail";
import TradeReport from "@/pages/trade-report";
import Commodities from "@/pages/commodities";
import BlogIndex from "@/pages/blog-index";
import BlogSesame from "@/pages/blog-sesame";
import BlogCocoa from "@/pages/blog-cocoa";
import BlogFruits from "@/pages/blog-fruits";
import BlogBamboo from "@/pages/blog-bamboo";

function Router() {
  return (
    <Switch>
      {/* Public routes — no auth required */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/lookup">{() => <Redirect to="/new-check" />}</Route>
      <Route path="/upload/:token" component={SupplierUploadPage} />
      <Route path="/verify/:ref" component={VerifyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />

      {/* Blog routes — public */}
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/sesame-seeds-nigeria" component={BlogSesame} />
      <Route path="/blog/cocoa-eudr-importers" component={BlogCocoa} />
      <Route path="/blog/tropical-fruits-phytosanitary" component={BlogFruits} />
      <Route path="/blog/bamboo-eudr-forest-product" component={BlogBamboo} />
      {/* Protected routes — require authentication */}
      <Route path="/new-check">{() => <AuthGuard><NewCheck /></AuthGuard>}</Route>
      <Route path="/dashboard">{() => <Redirect to="/trades" />}</Route>
      <Route path="/demurrage">{() => <AuthGuard><DemurragePage /></AuthGuard>}</Route>
      <Route path="/lc-check">{() => <AuthGuard><LcCheck /></AuthGuard>}</Route>
      <Route path="/trades/:tradeId/report">{() => <AuthGuard><TradeReport /></AuthGuard>}</Route>
      <Route path="/trades/:id">{() => <AuthGuard><TradeDetail /></AuthGuard>}</Route>
      <Route path="/trades">{() => <AuthGuard><Trades /></AuthGuard>}</Route>
      <Route path="/commodities">{() => <AuthGuard><Commodities /></AuthGuard>}</Route>
      <Route path="/templates">{() => <AuthGuard><Templates /></AuthGuard>}</Route>
      <Route path="/pricing">{() => <AuthGuard><Pricing /></AuthGuard>}</Route>
      <Route path="/tokens/success">{() => <AuthGuard><TokenSuccess /></AuthGuard>}</Route>
      <Route path="/settings/profile">{() => <AuthGuard><SettingsProfile /></AuthGuard>}</Route>
      <Route path="/inbox">{() => <AuthGuard><Inbox /></AuthGuard>}</Route>
      <Route path="/alerts">{() => <AuthGuard><AlertsPage /></AuthGuard>}</Route>
      <Route path="/eudr/:lookupId">{() => <AuthGuard><EudrPage /></AuthGuard>}</Route>
      <Route path="/cbam/:lookupId">{() => <AuthGuard><CbamPage /></AuthGuard>}</Route>

      {/* Admin routes */}
      <Route path="/admin/data">{() => <AuthGuard><AdminData /></AuthGuard>}</Route>
      <Route path="/admin/alerts/new">{() => <AuthGuard><AdminAlertsPage /></AuthGuard>}</Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/promo-codes">{() => <AuthGuard><AdminPromoCodes /></AuthGuard>}</Route>
      <Route path="/admin/api-keys">{() => <AuthGuard><AdminApiKeys /></AuthGuard>}</Route>
      <Route path="/admin/feature-requests">{() => <AuthGuard><AdminFeatureRequests /></AuthGuard>}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function PageViewTracker() {
  usePageViewTracking();
  return null;
}

// Parse & persist UTM params on first load (runs once)
initUtmTracking();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <PageViewTracker />
          <Router />
          <CookieConsentBanner />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
