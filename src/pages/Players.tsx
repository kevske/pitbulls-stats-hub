import React, { useMemo, useState } from 'react';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import { Home, Plane } from 'lucide-react';
import { useModernTheme } from '@/contexts/ModernThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

type GameFilter = 'all' | 'home' | 'away';

const Players: React.FC = () => {
  const { players, gameLogs, loading, error, games } = useStats();
  const [gameFilter, setGameFilter] = useState<GameFilter | 'all'>('all'); // Initialize with 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const { isModernMode } = useModernTheme();

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map(g => g.gameNumber)) : 0;
  }, [games]);

  // Toggle filter function
  const toggleFilter = (filter: GameFilter) => {
    setGameFilter(current => current === filter ? 'all' : filter);
  };

  // Get unique positions
  const positions = useMemo(() => {
    const uniquePositions = new Set(players.map(p => p.position).filter(Boolean));
    return Array.from(uniquePositions).sort();
  }, [players]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => player.firstName && player.firstName.trim() !== '');

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.firstName.toLowerCase().includes(query) ||
        player.lastName.toLowerCase().includes(query) ||
        (player.jerseyNumber && player.jerseyNumber.toString().includes(query))
      );
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    return filtered.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [players, searchQuery, positionFilter]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            Lade Spielerdaten von Supabase...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden der Spielerdaten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  if (isModernMode) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pb-20">
          <div className="pt-10 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
                Der <span className="text-primary">Kader</span>
              </h1>
              <p className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">Spielerdatenbank // Saison 26</p>
            </motion.div>

            <div className="mt-12 flex flex-col md:flex-row gap-6">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="DATENBANK DURCHSUCHEN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-12 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => toggleFilter('home')}
                    className={`px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gameFilter === 'home' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                      }`}
                  >
                    Heim
                  </button>
                  <button
                    onClick={() => toggleFilter('away')}
                    className={`px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gameFilter === 'away' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                      }`}
                  >
                    Auswärts
                  </button>
                </div>

                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="all" className="bg-slate-900">Alle Positionen</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos} className="bg-slate-900">{pos.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPlayers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-black text-white uppercase italic">Keine Daten gefunden</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">Versuche deine Filtereinstellungen anzupassen</p>
                </motion.div>
              ) : (
                filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    gameLogs={gameLogs}
                    currentGameNumber={latestGameNumber}
                    gameFilter={gameFilter === 'all' ? undefined : gameFilter}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Filter Toggle - Positioned to not overlap with menu */}
      <div className="fixed top-4 left-20 right-4 z-50">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-1.5 max-w-max mx-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFilter('home')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${gameFilter === 'home'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              title="Heimspiele"
            >
              <Home size={14} className="mr-1" />
              Heim
            </button>
            <div className="h-6 w-px bg-border"></div>
            <button
              onClick={() => toggleFilter('away')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${gameFilter === 'away'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              title="Auswärtsspiele"
            >
              <Plane size={14} className="mr-1" />
              Auswärts
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed header */}
      <div className="pt-4">
        <Layout>
          <div className="container mx-auto p-4">
            <div className="space-y-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Spieler</h1>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Suche nach Spieler..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]"
                >
                  <option value="all">Alle Positionen</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <p>Keine Spieler gefunden.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {players.length} Spieler von Supabase geladen, aber keiner erfüllt die Filterkriterien.
                  </p>
                </div>
              ) : (
                filteredPlayers.map((player) => {
                  return (
                    <div key={player.id} className="h-full">
                      <PlayerCard
                        player={player}
                        gameLogs={gameLogs}
                        currentGameNumber={latestGameNumber}
                        gameFilter={gameFilter === 'all' ? undefined : gameFilter}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};
export default Players;
