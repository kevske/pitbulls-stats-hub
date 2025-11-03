import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, Film, Upload, X } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/players', icon: Users, label: 'Spieler' },
    { to: '/stats', icon: BarChart2, label: 'Statistiken' },
    { to: '/games', icon: Film, label: 'Spiele' },
    { to: '/videos', icon: Film, label: 'Videos' },
    { to: '/upload-game', icon: Upload, label: 'Spiel hochladen' },
  ];

  // Always show menu button on mobile, hide on desktop when sidebar is open
  const showMenuButton = isMobile || !isOpen;

  return (
    <>
      {/* Menu button - always visible on mobile, only when closed on desktop */}
      {showMenuButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed z-50 ${
            isMobile ? 'top-4 left-4' : 'top-4 left-4'
          }`}
          aria-label={isOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          {isOpen ? (
            <X className="text-5xl font-bold text-primary/50 hover:text-primary/70 transition-colors" />
          ) : (
            <div className="space-y-1.5">
              <span className="block w-8 h-0.5 bg-primary/50 hover:bg-primary/70 transition-colors"></span>
              <span className="block w-8 h-0.5 bg-primary/50 hover:bg-primary/70 transition-colors"></span>
              <span className="block w-8 h-0.5 bg-primary/50 hover:bg-primary/70 transition-colors"></span>
            </div>
          )}
        </button>
      )}

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
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-5xl font-bold text-primary/50 mb-8">×</h2>
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground/80 hover:bg-accent/50'
                  }`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
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