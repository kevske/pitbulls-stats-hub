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
    // First, check for redirect in URL parameters (from 404 page)
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    
    if (redirectParam) {
      // Clean up the URL by removing the redirect parameter
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('redirect');
      
      // Store the clean URL in sessionStorage
      sessionStorage.setItem('redirect', redirectParam + window.location.hash);
      
      // Update the URL without reloading the page
      window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    }
    
    // Then check for redirect in sessionStorage (from 404 page or previous step)
    const redirect = sessionStorage.getItem('redirect');
    
    if (redirect) {
      // Remove the redirect from sessionStorage
      sessionStorage.removeItem('redirect');
      
      // Only redirect if we're not already on that path
      const currentPath = window.location.pathname + window.location.search + (window.location.hash || '');
      const basePath = '/pitbulls-stats-hub';
      const normalizedRedirect = redirect.startsWith(basePath) 
        ? redirect.substring(basePath.length) 
        : redirect;
      
      if (currentPath !== normalizedRedirect) {
        // Use the router to navigate to the target path
        window.history.replaceState(null, '', normalizedRedirect);
      }
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
