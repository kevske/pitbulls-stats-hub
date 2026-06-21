import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, X, Trophy, Calendar, BookOpen, Shield, Newspaper, Star, History, Sun, Moon } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';
import { useModernTheme } from '@/contexts/ModernThemeContext';
import { useSeason } from '@/contexts/SeasonContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  const { theme, toggleTheme } = useModernTheme();
  const isDark = theme === 'dark';
  const { seasons, selectedSeason, setSelectedSeasonId } = useSeason();


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
    { to: '/news', icon: Newspaper, label: 'News' },
    { to: '/awards', icon: Star, label: 'Awards' },
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
          {/* Wortmarke */}
          <div className="pt-16 pb-6 border-b border-border">
            <span className="font-display text-2xl font-black uppercase tracking-tighter text-foreground">
              Pitbulls<span className="text-brand-orange">.</span>
            </span>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Stats Hub</p>
          </div>

          <nav className="space-y-0.5 flex-1 pt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-2.5 border-l-2 transition-all group ${isActive
                    ? 'border-brand-orange bg-accent/60 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40'
                    }`}
                  onClick={() => isMobile && onToggle(false)}
                >
                  <Icon className={`w-4 h-4 mr-3 transition-transform ${isActive ? 'text-brand-orange' : 'group-hover:scale-110'}`} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Saison-Auswahl (nur sichtbar, wenn mehrere Saisons existieren) */}
          {seasons.length > 1 && (
            <div className="pt-4 border-t border-border/50">
              <label className="flex items-center gap-2 px-4 text-[10px] font-bold tracking-wider uppercase opacity-60 mb-1">
                <History className="w-3 h-3" />
                Saison
              </label>
              <select
                value={selectedSeason?.id ?? ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                className="w-full mx-0 px-4 py-2 rounded-lg bg-accent/50 text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name}{season.is_current ? ' (aktuell)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Light/Dark Theme-Toggle (Vision 2026) */}
          <div className="mt-auto pt-6 border-t border-border/50">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group bg-accent/40 text-foreground/80 hover:bg-accent hover:text-foreground"
              aria-label={isDark ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-background">
                  {isDark
                    ? <Moon className="w-4 h-4 text-primary" />
                    : <Sun className="w-4 h-4 text-brand-orange" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">Darstellung</span>
                  <span className="text-sm font-bold">{isDark ? 'Dunkel' : 'Hell'}</span>
                </div>
              </div>

              <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isDark ? 'bg-primary/40' : 'bg-brand-orange/40'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-sm ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;