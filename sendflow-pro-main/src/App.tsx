import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import CreateSequence from "./pages/CreateSequence";
import LeadIntelligence from "./pages/LeadIntelligence";
import InboxPage from "./pages/InboxPage";
import AccountsPage from "./pages/AccountsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/Login";

const queryClient = new QueryClient();

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-[#05060f] py-20 text-center text-white">{message}</div>
);

const PublicHome = () => {
  const { isAuthenticated, initialized, login, token, loading } = useAuth();

  if (!initialized || (token && loading)) {
    return <LoadingScreen message="Checking login status..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <LoginPage onLogin={login} />;
};

const ProtectedPage = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, initialized, token, loading } = useAuth();

  if (!initialized || (token && loading)) {
    return <LoadingScreen message="Loading workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicHome />} />
    <Route path="/app" element={<ProtectedPage><Index /></ProtectedPage>} />
    <Route path="/campaign/new" element={<ProtectedPage><CreateCampaign /></ProtectedPage>} />
    <Route path="/sequence/new" element={<ProtectedPage><CreateSequence /></ProtectedPage>} />
    <Route path="/leads" element={<ProtectedPage><LeadIntelligence /></ProtectedPage>} />
    <Route path="/inbox" element={<ProtectedPage><InboxPage /></ProtectedPage>} />
    <Route path="/accounts" element={<ProtectedPage><AccountsPage /></ProtectedPage>} />
    <Route path="/analytics" element={<ProtectedPage><AnalyticsPage /></ProtectedPage>} />
    <Route path="/campaign/:id" element={<ProtectedPage><CampaignDetail /></ProtectedPage>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
