import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseStatsService } from '@/services/supabaseStatsService';
import { GameStats, PlayerGameLog, PlayerStats } from '@/types/stats';

interface StatsContextType {
  games: GameStats[];
  players: PlayerStats[];
  gameLogs: PlayerGameLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<GameStats[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [gameLogs, setGameLogs] = useState<PlayerGameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // Supabase fetch doesn't need forceRefresh as it's not using the same local storage caching strategy yet
      // or if it implements caching, it would be internal.
      const { games, playerStats, gameLogs } = await SupabaseStatsService.fetchAllStatsData();
      setGames(games);
      setPlayers(playerStats);
      setGameLogs(gameLogs);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Expose a refresh function that forces a refresh
  const refresh = () => loadData(true);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <StatsContext.Provider
      value={{
        games,
        players,
        gameLogs,
        loading,
        error,
        refresh: loadData
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = (): StatsContextType => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};
