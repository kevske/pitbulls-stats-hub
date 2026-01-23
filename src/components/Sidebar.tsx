import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, X, Trophy, Calendar, BookOpen, Shield } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';
import { useModernTheme } from '@/contexts/ModernThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const { isModernMode, toggleModernMode } = useModernTheme();


  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        onToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const menuItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/players', icon: Users, label: 'Spieler' },
    { to: '/stats', icon: BarChart2, label: 'Statistiken' },
    { to: '/games', icon: Trophy, label: 'Ergebnisse' },
    { to: '/spielplan', icon: Calendar, label: 'Spielplan' },
    { to: '/playbook', icon: BookOpen, label: 'Playbook' },
    { to: '/videos', icon: Film, label: 'Videos' },
    { to: '/admin/player-info', icon: Shield, label: 'Admin' },
  ];

  return (
    <>
      {/* Menu button - elegant toggle */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="fixed z-[90] top-4 left-4 p-2"
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
          className="fixed inset-0 bg-black/50 z-60"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-background/95 backdrop-blur-md border-r border-border z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'
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
                  className={`flex items-center px-4 py-3 rounded-lg transition-elegant group relative overflow-hidden ${isActive
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

          {/* Special Toggle for Vision 2026 */}
          <div className="mt-auto pt-6 border-t border-border/50">
            <button
              onClick={toggleModernMode}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-500 group overflow-hidden relative ${isModernMode
                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-accent/50 text-foreground/70 hover:bg-accent hover:text-foreground'
                }`}
            >
              {/* Animated background for modern mode */}
              {isModernMode && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30 animate-pulse" />
              )}

              <div className="flex items-center gap-3 z-10">
                <div className={`p-1.5 rounded-lg transition-colors ${isModernMode ? 'bg-white/20' : 'bg-background'}`}>
                  <Trophy className={`w-4 h-4 ${isModernMode ? 'text-white translate-y-[-1px]' : 'text-primary'}`} />
                </div>
                <div className="flex flex-col items-start translate-y-[-1px]">
                  <span className="text-xs font-bold tracking-wider uppercase opacity-70">Experience</span>
                  <span className="text-sm font-bold">Vision 2026</span>
                </div>
              </div>

              <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isModernMode ? 'bg-white/30' : 'bg-muted-foreground/20'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-500 shadow-sm ${isModernMode ? 'translate-x-5 scale-110' : 'translate-x-0'}`} />
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
            </button>
            <p className="text-[10px] text-center mt-2 opacity-50 font-medium tracking-tight">
              {isModernMode ? 'MODERN MODE ACTIVE' : 'SWITCH TO 2026 DESIGN'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;