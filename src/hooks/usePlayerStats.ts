import { useMemo } from 'react';
import { useStats } from '@/contexts/StatsContext';
import { PlayerStats, PlayerGameLog } from '@/types/stats';

export const usePlayerStats = (playerId?: string) => {
  const { players, gameLogs } = useStats();

  return useMemo(() => {
    if (!playerId) return { player: null, gameLogs: [] };

    const player = players.find(p => p.id === playerId);
    if (!player) return { player: null, gameLogs: [] };

    const playerGameLogs = gameLogs
      .filter(log => log.playerId === playerId)
      .sort((a, b) => a.gameNumber - b.gameNumber);

    return { player, gameLogs: playerGameLogs };
  }, [playerId, players, gameLogs]);
};
