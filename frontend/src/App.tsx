import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import SkillProfile from "./pages/SkillProfile";
import GrowthPath from "./pages/GrowthPath";
import TaskDetail from "./pages/TaskDetail";
import DataSources from "./pages/DataSources";
import Preferences from "./pages/Preferences";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const done = localStorage.getItem("onboardingComplete");
  if (!done) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/*"
            element={
              <RequireOnboarding>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/skills" element={<SkillProfile />} />
                    <Route path="/growth" element={<GrowthPath />} />
                    <Route path="/task/:id" element={<TaskDetail />} />
                    <Route path="/sources" element={<DataSources />} />
                    <Route path="/preferences" element={<Preferences />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </RequireOnboarding>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
