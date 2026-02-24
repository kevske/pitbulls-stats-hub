import { TaggedEvent, Player } from '@/types/basketball';
import { SaveData } from '@/services/saveLoad';

export interface PlayerGameStats {
  playerId: string;
  playerName: string;
  jerseyNumber: number;

  // Basic stats
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;

  // Shooting stats
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  totalPoints: number;

  // Advanced metrics
  plusMinus: number;
  fouls: number;
  substitutions: number;
}

export interface TeamGameStats {
  totalPoints: number;
  totalAssists: number;
  totalRebounds: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;

  teamFieldGoalPercentage: number;
  teamThreePointPercentage: number;
  teamFreeThrowPercentage: number;

  totalFouls: number;
  totalSubstitutions: number;
}

export interface ExtractedGameStats {
  gameId: string;
  videoId?: string;
  timestamp: string;
  playerStats: PlayerGameStats[];
  teamStats: TeamGameStats;
  playByPlay: TaggedEvent[];
}

export function extractStatsFromVideoData(saveData: SaveData): ExtractedGameStats {
  const events = saveData.events;
  const players = saveData.players;

  // Sort events by timestamp for proper processing
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const playerStats = extractPlayerStats(sortedEvents, players);
  const teamStats = extractTeamStats(playerStats);

  return {
    gameId: saveData.videoId || 'unknown',
    videoId: saveData.videoId,
    timestamp: saveData.timestamp,
    playerStats,
    teamStats,
    playByPlay: sortedEvents
  };
}

function extractPlayerStats(events: TaggedEvent[], players: Player[]): PlayerGameStats[] {
  const playerMap = new Map<string, PlayerGameStats>();

  // Initialize stats for all players
  players.forEach(player => {
    playerMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      jerseyNumber: player.jerseyNumber,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      fieldGoalPercentage: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      threePointPercentage: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      freeThrowPercentage: 0,
      totalPoints: 0,
      plusMinus: 0,
      fouls: 0,
      substitutions: 0
    });
  });

  // Process each event
  events.forEach(event => {
    if (!event.player) return;

    const player = players.find(p => p.name === event.player);
    if (!player) return;

    const stats = playerMap.get(player.id);
    if (!stats) return;

    switch (event.type) {
      case 'assist':
        stats.assists++;
        break;

      case 'rebound':
        stats.rebounds++;
        break;

      case 'steal':
        stats.steals++;
        break;

      case 'block':
        stats.blocks++;
        break;

      case 'turnover':
        stats.turnovers++;
        break;

      case 'shot':
        // Handle shooting stats
        stats.fieldGoalsAttempted++;

        if (event.points === 3) {
          stats.threePointersAttempted++;
        } else if (event.points === 1) {
          stats.freeThrowsAttempted++;
        }

        if (!event.missed) {
          // Made shot
          stats.fieldGoalsMade++;
          stats.totalPoints += event.points || 0;

          if (event.points === 3) {
            stats.threePointersMade++;
          } else if (event.points === 1) {
            stats.freeThrowsMade++;
          }
        }
        break;

      case 'foul':
        stats.fouls++;
        break;

      case 'substitution':
        stats.substitutions++;
        break;
    }

    // Handle rebound player from missed shots
    if (event.type === 'shot' && event.missed && event.reboundPlayer) {
      const reboundPlayer = players.find(p => p.name === event.reboundPlayer);
      if (reboundPlayer) {
        const reboundStats = playerMap.get(reboundPlayer.id);
        if (reboundStats) {
          reboundStats.rebounds++;
        }
      }
    }
  });

  // Calculate percentages
  const finalStats = Array.from(playerMap.values());
  finalStats.forEach(stats => {
    // Field goal percentage
    stats.fieldGoalPercentage = stats.fieldGoalsAttempted > 0
      ? Math.round((stats.fieldGoalsMade / stats.fieldGoalsAttempted) * 100 * 10) / 10
      : 0;

    // Three point percentage
    stats.threePointPercentage = stats.threePointersAttempted > 0
      ? Math.round((stats.threePointersMade / stats.threePointersAttempted) * 100 * 10) / 10
      : 0;

    // Free throw percentage
    stats.freeThrowPercentage = stats.freeThrowsAttempted > 0
      ? Math.round((stats.freeThrowsMade / stats.freeThrowsAttempted) * 100 * 10) / 10
      : 0;
  });

  return finalStats.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
}

function extractTeamStats(playerStats: PlayerGameStats[]): TeamGameStats {
  const teamStats = playerStats.reduce((acc, player) => {
    acc.totalPoints += player.totalPoints;
    acc.totalAssists += player.assists;
    acc.totalRebounds += player.rebounds;
    acc.totalSteals += player.steals;
    acc.totalBlocks += player.blocks;
    acc.totalTurnovers += player.turnovers;

    acc.totalFouls += player.fouls;
    acc.totalSubstitutions += player.substitutions;

    // Shooting totals
    acc.fieldGoalsMade += player.fieldGoalsMade;
    acc.fieldGoalsAttempted += player.fieldGoalsAttempted;
    acc.threePointersMade += player.threePointersMade;
    acc.threePointersAttempted += player.threePointersAttempted;
    acc.freeThrowsMade += player.freeThrowsMade;
    acc.freeThrowsAttempted += player.freeThrowsAttempted;

    return acc;
  }, {
    totalPoints: 0,
    totalAssists: 0,
    totalRebounds: 0,
    totalSteals: 0,
    totalBlocks: 0,
    totalTurnovers: 0,
    teamFieldGoalPercentage: 0,
    teamThreePointPercentage: 0,
    teamFreeThrowPercentage: 0,
    totalFouls: 0,
    totalSubstitutions: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0
  });

  // Calculate team percentages
  teamStats.teamFieldGoalPercentage = teamStats.fieldGoalsAttempted > 0
    ? Math.round((teamStats.fieldGoalsMade / teamStats.fieldGoalsAttempted) * 100 * 10) / 10
    : 0;

  teamStats.teamThreePointPercentage = teamStats.threePointersAttempted > 0
    ? Math.round((teamStats.threePointersMade / teamStats.threePointersAttempted) * 100 * 10) / 10
    : 0;

  teamStats.teamFreeThrowPercentage = teamStats.freeThrowsAttempted > 0
    ? Math.round((teamStats.freeThrowsMade / teamStats.freeThrowsAttempted) * 100 * 10) / 10
    : 0;

  return teamStats;
}

export function escapeCSVField(field: string | number): string {
  let stringField = String(field);

  // Prevent CSV Injection (Excel formulas)
  if (/^[=+\-@]/.test(stringField)) {
    stringField = `'${stringField}`;
  }

  // Escape quotes and wrap in quotes if necessary
  if (/[",\n]/.test(stringField)) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

export function exportStatsToCSV(extractedStats: ExtractedGameStats): string {
  const headers = [
    'Player Name', 'Jersey #', 'Points', 'FGM', 'FGA', 'FG%',
    '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'AST', 'REB',
    'STL', 'BLK', 'TOV', 'FOULS', 'SUB'
  ];

  const rows = extractedStats.playerStats.map(player => [
    player.playerName,
    player.jerseyNumber.toString(),
    player.totalPoints.toString(),
    player.fieldGoalsMade.toString(),
    player.fieldGoalsAttempted.toString(),
    player.fieldGoalPercentage.toString() + '%',
    player.threePointersMade.toString(),
    player.threePointersAttempted.toString(),
    player.threePointPercentage.toString() + '%',
    player.freeThrowsMade.toString(),
    player.freeThrowsAttempted.toString(),
    player.freeThrowPercentage.toString() + '%',
    player.assists.toString(),
    player.rebounds.toString(),
    player.steals.toString(),
    player.blocks.toString(),
    player.turnovers.toString(),
    player.fouls.toString(),
    player.substitutions.toString()
  ].map(escapeCSVField));

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function calculatePlayerEfficiency(playerStats: PlayerGameStats): number {
  // Efficiency formula: (Points + Rebounds + Assists + Steals + Blocks - Turnovers) / Games
  // For single game, just return the raw efficiency
  return playerStats.totalPoints +
    playerStats.rebounds +
    playerStats.assists +
    playerStats.steals +
    playerStats.blocks -
    playerStats.turnovers;
}
