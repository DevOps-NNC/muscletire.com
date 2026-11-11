import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TemplateRuntime } from "./template/TemplateRuntime";
import Home from "./pages/Home";

// Lazy load pages for performance
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ServiceAreas = lazy(() => import("./pages/ServiceAreas"));
const ServiceAreaDetail = lazy(() => import("./pages/ServiceAreaDetail"));
const Reviews = lazy(() => import("./pages/Reviews"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const RequestService = lazy(() => import("./pages/RequestService"));
const RequestConfirmation = lazy(() => import("./pages/RequestConfirmation"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminLeadDetail = lazy(() => import("./pages/admin/LeadDetail"));
const AdminLeadRecovery = lazy(() => import("./pages/admin/LeadRecovery"));
const AdminQuotes = lazy(() => import("./pages/admin/Quotes"));
const AdminBlog = lazy(() => import("./pages/admin/BlogManager"));
const AdminBlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const AdminServices = lazy(() => import("./pages/admin/ServicesManager"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminSignIn = lazy(() => import("./pages/admin/SignIn"));
const AdminSetupOwner = lazy(() => import("./pages/admin/SetupOwner"));
const AdminForgotPassword = lazy(() => import("./pages/admin/ForgotPassword"));
const AdminResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const AdminChangePassword = lazy(() => import("./pages/admin/ChangePassword"));
const AdminRecoverSuperadmin = lazy(() => import("./pages/admin/RecoverSuperadmin"));
const AdminInvite = lazy(() => import("./pages/admin/InviteAdmin"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
const AdminTemplateStudio = lazy(() => import("./pages/admin/TemplateStudio"));
const AdminPageEditor = lazy(() => import("./pages/admin/PageEditor"));
const AdminGoogleAdsConversions = lazy(() => import("./pages/admin/GoogleAdsConversions"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAnalyticsReport = lazy(() => import("./pages/admin/AnalyticsReport"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/service-areas" component={ServiceAreas} />
        <Route path="/service-areas/:slug" component={ServiceAreaDetail} />
        <Route path="/reviews" component={Reviews} />
        <Route path="/faq" component={FAQ} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/request-service" component={RequestService} />
        <Route path="/request-confirmation" component={RequestConfirmation} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        {/* Admin routes */}
        <Route path="/admin/login" component={AdminSignIn} />
        <Route path="/admin/setup" component={AdminSetupOwner} />
        <Route path="/admin/forgot-password" component={AdminForgotPassword} />
        <Route path="/admin/reset-password" component={AdminResetPassword} />
        <Route path="/admin/change-password" component={AdminChangePassword} />
        <Route path="/admin/recover" component={AdminRecoverSuperadmin} />
        <Route path="/admin/invite" component={AdminInvite} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/leads" component={AdminLeads} />
        <Route path="/admin/leads/recovery" component={AdminLeadRecovery} />
        <Route path="/admin/leads/:id" component={AdminLeadDetail} />
        <Route path="/admin/quotes" component={AdminQuotes} />
        <Route path="/admin/blog" component={AdminBlog} />
        <Route path="/admin/blog/new" component={AdminBlogEditor} />
        <Route path="/admin/blog/:id" component={AdminBlogEditor} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/google-ads" component={AdminGoogleAdsConversions} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/analytics/reports/:id" component={AdminAnalyticsReport} />
        <Route path="/admin/analytics/reports" component={AdminAnalyticsReport} />
        <Route path="/admin/page-editor" component={AdminPageEditor} />
        <Route path="/admin/template" component={AdminTemplateStudio} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/team" component={AdminTeam} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <TemplateRuntime><Router /></TemplateRuntime>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
