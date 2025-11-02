import { useMemo } from 'react';
import { useStats } from '@/contexts/StatsContext';
import { PlayerStats, PlayerGameLog } from '@/types/stats';

// Generate player ID consistently with statsService.ts
const generatePlayerId = (firstName: string): string => {
  return firstName.toLowerCase().replace(/\s+/g, '-');
};

export const usePlayerStats = (playerId?: string) => {
  const { players, gameLogs } = useStats();

  return useMemo(() => {
    if (!playerId) {
      return { player: null, gameLogs: [] };
    }

    // Try to find player by ID first, then by generated ID
    let player = players.find(p => p.id === playerId);
    if (!player) {
      player = players.find(p => 
        p.id.toLowerCase() === playerId.toLowerCase() || 
        generatePlayerId(p.firstName) === playerId.toLowerCase()
      );
    }

    if (!player) {
      return { player: null, gameLogs: [] };
    }

    const playerGameLogs = gameLogs
      .filter(log => log.playerId === playerId || log.playerId === player?.id)
      .sort((a, b) => a.gameNumber - b.gameNumber);

    return { player, gameLogs: playerGameLogs };
  }, [playerId, players, gameLogs]);
};
