import React, { useMemo, useState } from 'react';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import { Home, Plane, Search } from 'lucide-react';
import PageHeader from '@/components/vision/PageHeader';
import { useSeason } from '@/contexts/SeasonContext';
import { motion, AnimatePresence } from 'framer-motion';

type GameFilter = 'all' | 'home' | 'away';

const Players: React.FC = () => {
  const { players, gameLogs, loading, error, games } = useStats();
  const { selectedSeason } = useSeason();
  const [gameFilter, setGameFilter] = useState<GameFilter | 'all'>('all'); // Initialize with 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Kurzlabel der Saison, z. B. '2025/26' -> '25/26'
  const seasonShort = selectedSeason
    ? selectedSeason.name.replace(/^20/, '').replace('/20', '/')
    : '25/26';

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map(g => g.gameNumber)) : 0;
  }, [games]);

  // Pre-compute player logs map for faster lookups (O(1))
  const playerLogsMap = useMemo(() => {
    const map = new Map<string, typeof gameLogs>();
    gameLogs.forEach(log => {
      if (!map.has(log.playerId)) {
        map.set(log.playerId, []);
      }
      map.get(log.playerId)!.push(log);
    });
    return map;
  }, [gameLogs]);

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
          <div className="text-center py-8 text-muted-foreground">
            Lade Spielerdaten...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-destructive text-center py-8">
            Fehler beim Laden der Spielerdaten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 pb-20">
        <PageHeader title="Der Kader" subtitle={`Spielerdatenbank // Saison ${seasonShort}`} right="Spielerprofile" />

        {/* Filter-Leiste */}
        <div className="flex flex-col md:flex-row gap-4 border-y border-border py-4 mb-10">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-brand-orange transition-colors" />
            <input
              type="text"
              placeholder="Datenbank durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-card border border-border rounded-md pl-11 pr-4 text-xs font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-brand-orange/60 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex bg-card border border-border rounded-md p-1">
              <button
                onClick={() => toggleFilter('home')}
                className={`px-4 h-9 rounded text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${gameFilter === 'home' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Home size={13} /> Heim
              </button>
              <button
                onClick={() => toggleFilter('away')}
                className={`px-4 h-9 rounded text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${gameFilter === 'away' ? 'bg-brand-orange text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Plane size={13} /> Auswärts
              </button>
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="h-11 bg-card border border-border rounded-md px-4 text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-brand-orange/60 transition-all"
            >
              <option value="all">Alle Positionen</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPlayers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <div className="text-5xl mb-4 opacity-40">🔍</div>
                <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">Keine Daten gefunden</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Versuche deine Filtereinstellungen anzupassen</p>
              </motion.div>
            ) : (
              filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  gameLogs={gameLogs}
                  playerLogs={playerLogsMap.get(player.id) || []}
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
};
export default Players;
