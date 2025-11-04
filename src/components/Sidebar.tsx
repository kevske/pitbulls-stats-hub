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

  return (
    <>
      {/* Menu button - elegant toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 top-4 left-4 p-3 rounded-lg bg-card/80 backdrop-blur-md border border-border shadow-elegant hover:shadow-elegant-lg transition-elegant hover:bg-card"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-elegant"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-64 bg-card/95 backdrop-blur-md border-r border-border shadow-elegant-lg z-50 transform transition-all duration-300 ease-in-out ${
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