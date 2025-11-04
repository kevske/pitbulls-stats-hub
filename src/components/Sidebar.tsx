import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, Gamepad2, Upload, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error' | `reloading${number}`>('idle');
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
  ];

  return (
    <>
      {/* Menu button - elegant toggle */}
      <button
        onClick={() => onToggle(!isOpen)}
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

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-64 bg-background/95 backdrop-blur-md border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          <nav className="space-y-1 flex-1 pt-20">
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
                  onClick={() => isMobile && onToggle(false)}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-elegant ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          
          {/* Refresh Button in Menu */}
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={async (e) => {
                e.preventDefault();
                setRefreshStatus('loading');
                
                // Start countdown
                let countdown = 3;
                const countdownInterval = setInterval(() => {
                  setRefreshStatus(`reloading${countdown}`);
                  countdown--;
                  
                  if (countdown < 0) {
                    clearInterval(countdownInterval);
                    // Force reload the page to ensure fresh data
                    window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
                  }
                }, 1000);
                
                // In the background, refresh the data
                try {
                  await refresh();
                  setLastRefreshed(new Date());
                } catch (error) {
                  console.error('Failed to refresh data:', error);
                  clearInterval(countdownInterval);
                  setRefreshStatus('error');
                  
                  // Reset to idle after error
                  refreshTimeoutRef.current = setTimeout(() => {
                    setRefreshStatus('idle');
                  }, 3000);
                }
              }}
              disabled={typeof refreshStatus === 'string' && refreshStatus.startsWith('reloading')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-elegant text-left ${
                refreshStatus === 'loading' || refreshStatus?.startsWith('reloading')
                  ? 'text-primary animate-pulse'
                  : refreshStatus === 'success'
                  ? 'text-green-500'
                  : refreshStatus === 'error'
                  ? 'text-red-500'
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent'
              }`}
            >
              {refreshStatus === 'loading' ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                  <span>Aktualisiere Daten...</span>
                </>
              ) : refreshStatus?.startsWith('reloading') ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                  <span>Lade neu in {refreshStatus.replace('reloading', '')}s</span>
                </>
              ) : refreshStatus === 'success' ? (
                <>
                  <Check className="w-5 h-5 mr-3" />
                  <span>Erfolgreich aktualisiert</span>
                </>
              ) : refreshStatus === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5 mr-3" />
                  <span>Fehler beim Aktualisieren</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-3" />
                  <span>Daten aktualisieren</span>
                </>
              )}
              {lastRefreshed && refreshStatus === 'idle' && (
                <span className="ml-auto text-xs opacity-70">
                  {formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: de })}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;