import * as React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatsProvider } from "@/contexts/StatsContext";
import ScrollToTop from "@/components/ScrollToTop";
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
  // Handle redirects from 404 page or direct navigation
  React.useEffect(() => {
    // Check for redirect in sessionStorage (from 404 page)
    if (sessionStorage.redirect) {
      const redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      
      // Only redirect if we're not already on that path
      if (window.location.pathname + window.location.search + (window.location.hash || '') !== redirect) {
        window.history.replaceState(null, '', redirect);
      }
      return; // Skip the rest if we handled a session redirect
    }
    
    // Handle GitHub Pages redirect parameter
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    if (redirect) {
      // Remove the redirect parameter from the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('redirect');
      
      // Navigate to the intended path without causing a page reload
      window.history.replaceState(null, '', redirect);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <StatsProvider>
            <BrowserRouter basename="/pitbulls-stats-hub">
              <ScrollToTop />
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
