import * as React from 'react';
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatsProvider } from "@/contexts/StatsContext";
import { ModernThemeProvider } from "@/contexts/ModernThemeContext";
import ScrollToTop from "@/components/ScrollToTop";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { lazyLoad } from "@/utils/lazyLoad";

// Lazy load pages
const Home = lazyLoad(() => import("./pages/Home"));
const Stats = lazyLoad(() => import("./pages/Stats"));
const Players = lazyLoad(() => import("./pages/Players"));
const PlayerDetail = lazyLoad(() => import("./pages/PlayerDetail"));
const PlayerProfile = lazyLoad(() => import("./pages/PlayerProfile"));
const Games = lazyLoad(() => import("./pages/Games"));
const GameDetail = lazyLoad(() => import("./pages/GameDetail"));
const Videos = lazyLoad(() => import("./pages/Videos"));
const VideoEditor = lazyLoad(() => import("./pages/VideoEditor"));
const Spielplan = lazyLoad(() => import("./pages/Spielplan"));
const AdminPlayerInfo = lazyLoad(() => import("./pages/AdminPlayerInfo"));
const Login = lazyLoad(() => import("./pages/Login"));
const AdminAuditLogs = lazyLoad(() => import("./pages/AdminAuditLogs"));
const GamesMinutesManager = lazyLoad(() => import("./components/GamesMinutesManager"));
const Impressum = lazyLoad(() => import("./pages/Impressum"));
const Playbook = lazyLoad(() => import("./pages/Playbook"));

const queryClient = new QueryClient();

const App = () => {
  // Handle redirects and browser history with base path
  React.useEffect(() => {
    const basePath = import.meta.env.PROD ? '/pitbulls-stats-hub' : '/';

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
      if (currentPath !== '/' && import.meta.env.PROD && !currentPath.startsWith(basePath + '/')) {
        // Check if this is a direct link to a page (like /games/4)
        const pathWithoutBase = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        const pathSegments = pathWithoutBase.split('/');

        // If this looks like one of our routes
        if (pathSegments.length > 0 && ['games', 'players', 'videos', 'stats', 'upload-game', 'spielplan', 'playbook'].includes(pathSegments[0])) {
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
            <ModernThemeProvider>
              <BrowserRouter basename={import.meta.env.PROD ? "/pitbulls-stats-hub" : "/"}>
                <ScrollToTop />
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/players" element={<Players />} />
                    <Route path="/players/:id" element={<PlayerDetail />} />
                    <Route path="/player/:playerName" element={<PlayerProfile />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/games/:id" element={<GameDetail />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/video-editor" element={<VideoEditor />} />
                    <Route path="/spielplan" element={<Spielplan />} />
                    <Route path="/playbook" element={<Playbook />} />
                    <Route path="/impressum" element={<Impressum />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/player-info" element={<AdminPlayerInfo />} />
                    <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                    <Route path="/games/minutes" element={<GamesMinutesManager />} />
                    <Route path="/games/minutes/:gameNumber" element={<GamesMinutesManager />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </ModernThemeProvider>
          </StatsProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
