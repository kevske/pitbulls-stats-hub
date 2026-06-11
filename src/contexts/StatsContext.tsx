import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { SupabaseStatsService } from '@/services/supabaseStatsService';
import { GameStats, PlayerGameLog, PlayerStats, VideoStats } from '@/types/stats';
import { useSeason } from '@/contexts/SeasonContext';


interface StatsContextType {
  games: GameStats[];
  players: PlayerStats[];
  gameLogs: PlayerGameLog[];
  videoStats: VideoStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedSeason, loading: seasonLoading } = useSeason();
  const [games, setGames] = useState<GameStats[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [gameLogs, setGameLogs] = useState<PlayerGameLog[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { games, playerStats, gameLogs, videoStats } =
        await SupabaseStatsService.fetchAllStatsData(selectedSeason?.id ?? null);
      setGames(games);
      setPlayers(playerStats);
      setGameLogs(gameLogs);
      setVideoStats(videoStats);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedSeason?.id]);

  useEffect(() => {
    // Erst laden, wenn die Saison aufgelöst ist; ohne seasons-Tabelle
    // (selectedSeason null) wird wie bisher ungefiltert geladen.
    if (!seasonLoading) {
      loadData();
    }
  }, [loadData, seasonLoading]);

  const value = useMemo(() => ({
    games,
    players,
    gameLogs,
    videoStats,
    loading,
    error,
    refresh: loadData
  }), [games, players, gameLogs, videoStats, loading, error, loadData]);

  return (
    <StatsContext.Provider value={value}>
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
