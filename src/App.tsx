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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Handle redirects and browser history with base path
  React.useEffect(() => {
    const basePath = '/pitbulls-stats-hub';
    
    // Function to handle redirects from 404 page
    const handleRedirect = () => {
      try {
        // Check for redirect in sessionStorage (from 404 page)
        const redirect = sessionStorage.getItem('redirect');
        
        if (redirect) {
          // Remove the redirect from sessionStorage
          sessionStorage.removeItem('redirect');
          
          // Normalize the redirect path
          let targetPath = redirect.startsWith('/') ? redirect : `/${redirect}`;
          
          // Ensure the path starts with the base path
          if (!targetPath.startsWith(basePath)) {
            targetPath = `${basePath}${targetPath}`;
          }
          
          // Only redirect if we're not already on that path
          const currentPath = window.location.pathname + window.location.search + (window.location.hash || '');
          
          if (currentPath !== targetPath) {
            console.log('Redirecting to:', targetPath);
            window.history.replaceState({}, '', targetPath);
            // Force a re-render with the new path
            window.dispatchEvent(new Event('popstate'));
          }
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
      }
    };
    
    // Handle initial page load
    const handleInitialLoad = () => {
      const currentPath = window.location.pathname;
      
      // If we're not on the home page and the path doesn't start with the base path
      if (currentPath !== '/' && !currentPath.startsWith(basePath + '/')) {
        // Check if this is a direct link to a page (like /games/4)
        const pathWithoutBase = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        const pathSegments = pathWithoutBase.split('/');
        
        // If this looks like one of our routes
        if (pathSegments.length > 0 && ['games', 'players', 'videos', 'stats', 'upload-game'].includes(pathSegments[0])) {
          // Reconstruct the URL with the base path
          const newPath = `${basePath}${currentPath}`;
          window.history.replaceState({}, '', newPath);
          // Force a reload to let the router handle the navigation
          window.location.reload();
          return;
        }
      }
      
      // Handle any redirects
      handleRedirect();
    };
    
    // Set up a history listener to handle back/forward navigation
    const handlePopState = () => {
      handleRedirect();
    };
    
    // Initial setup
    handleInitialLoad();
    
    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    
    // Clean up event listeners when the component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
