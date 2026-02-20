import { useMemo } from 'react';
import { useStats } from '@/contexts/StatsContext';
import { PlayerStats, PlayerGameLog, VideoStats } from '@/types/stats';

// Generate player ID consistently with statsService.ts
const generatePlayerId = (firstName: string): string => {
  return firstName.toLowerCase().replace(/\s+/g, '-');
};

export const usePlayerStats = (playerId?: string) => {
  const { players, gameLogs, videoStats } = useStats();

  return useMemo(() => {
    if (!playerId) {
      return { player: null, gameLogs: [], videoGameLogs: [] as VideoStats[] };
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
      return { player: null, gameLogs: [], videoGameLogs: [] as VideoStats[] };
    }

    const playerGameLogs = gameLogs
      .filter(log => log.playerId === playerId || log.playerId === player?.id)
      .sort((a, b) => a.gameNumber - b.gameNumber);

    const videoGameLogs = videoStats
      .filter(v => v.playerId === playerId || v.playerId === player?.id)
      .sort((a, b) => a.gameNumber - b.gameNumber);

    return { player, gameLogs: playerGameLogs, videoGameLogs };
  }, [playerId, players, gameLogs, videoStats]);
};
