import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, Gamepad2, Upload, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const location = useLocation();
  const { refresh } = useStats();

  // Set initial last refreshed time
  useEffect(() => {
    setLastRefreshed(new Date());
  }, []);

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const menuItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/players', icon: Users, label: 'Spieler' },
    { to: '/stats', icon: BarChart2, label: 'Statistiken' },
    { to: '/games', icon: Gamepad2, label: 'Spiele' },
    { to: '/videos', icon: Film, label: 'Videos' },
    { to: '/upload-game', icon: Upload, label: 'Spiel hochladen' },
  ];

  return (
    <>
      {/* Menu button - elegant toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-60 top-4 left-4 p-2"
        aria-label={isOpen ? 'Menü schließen' : 'Menü öffnen'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground transition-elegant" />
        ) : (
          <div className="space-y-1.5">
            <span className="block w-5 h-0.5 bg-foreground transition-elegant"></span>
            <span className="block w-5 h-0.5 bg-foreground transition-elegant"></span>
            <span className="block w-5 h-0.5 bg-foreground transition-elegant"></span>
          </div>
        )}
      </button>

      {/* Overlay - only on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Refresh Data Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="relative">
          <button
            onClick={async () => {
              setRefreshStatus('loading');
              try {
                await refresh();
                setLastRefreshed(new Date());
                setRefreshStatus('success');
              } catch (error) {
                console.error('Failed to refresh data:', error);
                setRefreshStatus('error');
              } finally {
                if (refreshTimeoutRef.current) {
                  clearTimeout(refreshTimeoutRef.current);
                }
                refreshTimeoutRef.current = setTimeout(() => {
                  setRefreshStatus('idle');
                }, 3000);
              }
            }}
            disabled={refreshStatus === 'loading'}
            className={`p-2 rounded-full shadow-lg transition-all ${
              refreshStatus === 'loading' 
                ? 'bg-primary/80 text-primary-foreground animate-spin' 
                : refreshStatus === 'success'
                ? 'bg-green-500 text-white'
                : refreshStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            aria-label="Daten aktualisieren"
          >
            {refreshStatus === 'loading' ? (
              <RefreshCw className="w-5 h-5" />
            ) : refreshStatus === 'success' ? (
              <Check className="w-5 h-5" />
            ) : refreshStatus === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
          {lastRefreshed && refreshStatus !== 'loading' && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm text-xs text-muted-foreground whitespace-nowrap px-2 py-1 rounded-md shadow-sm border border-border">
              {refreshStatus === 'success' ? 'Aktualisiert' : refreshStatus === 'error' ? 'Fehler' : 'Aktualisieren'}
              {refreshStatus === 'idle' && lastRefreshed && (
                <span className="block text-xs opacity-70">
                  {formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: de })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-64 bg-background/95 backdrop-blur-md border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 h-full flex flex-col pt-20">
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-3 rounded-lg transition-elegant group relative overflow-hidden ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm font-medium' 
                      : 'text-foreground/70 hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-elegant ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;