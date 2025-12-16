import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, X, Trophy, Calendar, BookOpen } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();


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
        className={`fixed top-0 left-0 h-screen w-64 bg-background/95 backdrop-blur-md border-r border-border z-[70] transform transition-transform duration-300 ease-in-out ${
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;