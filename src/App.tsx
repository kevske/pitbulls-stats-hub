import * as React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./components/Sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatsProvider } from "@/contexts/StatsContext";
import Home from "./pages/Home";
import Stats from "./pages/Stats";
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Videos from "./pages/Videos";
import UploadGame from "./pages/UploadGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Handle GitHub Pages redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.history.replaceState(null, '', redirect);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <StatsProvider>
            <BrowserRouter basename="/pitbulls-stats-hub">
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 md:pl-64 transition-all duration-300">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/players" element={<Players />} />
                    <Route path="/players/:id" element={<PlayerDetail />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/games/:id" element={<GameDetail />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/upload-game" element={<UploadGame />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </StatsProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
