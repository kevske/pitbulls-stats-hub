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
    console.log('usePlayerStats - playerId:', playerId);
    console.log('usePlayerStats - players:', players);
    
    if (!playerId) {
      console.log('No playerId provided');
      return { player: null, gameLogs: [] };
    }

    // Log all player IDs for debugging
    console.log('Available player IDs:', players.map(p => ({
      id: p.id,
      firstName: p.firstName,
      generatedId: generatePlayerId(p.firstName)
    })));

    // Try to find player by ID first, then by generated ID
    let player = players.find(p => p.id === playerId);
    if (!player) {
      console.log(`Player with ID '${playerId}' not found. Trying case-insensitive match.`);
      player = players.find(p => 
        p.id.toLowerCase() === playerId.toLowerCase() || 
        generatePlayerId(p.firstName) === playerId.toLowerCase()
      );
    }

    if (!player) {
      console.error(`Player with ID '${playerId}' not found in players:`, players.map(p => p.id));
      return { player: null, gameLogs: [] };
    }

    console.log('Found player:', player);

    const playerGameLogs = gameLogs
      .filter(log => log.playerId === playerId || log.playerId === player?.id)
      .sort((a, b) => a.gameNumber - b.gameNumber);

    console.log('Player game logs:', playerGameLogs);

    return { player, gameLogs: playerGameLogs };
  }, [playerId, players, gameLogs]);
};
