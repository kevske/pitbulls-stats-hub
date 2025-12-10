import { TaggedEvent, Player } from '@/types/basketball';
import { extractStatsFromVideoData, exportStatsToCSV } from '@/services/statsExtraction';

// Sample data for testing the stats extraction
const sampleEvents: TaggedEvent[] = [
  {
    id: '1',
    timestamp: 120,
    formattedTime: '02:00',
    type: 'shot',
    player: 'Kevin Rassner',
    points: 3,
    missed: false,
    description: 'Shot Kevin Rassner: three - Made'
  },
  {
    id: '2',
    timestamp: 180,
    formattedTime: '03:00',
    type: 'assist',
    player: 'Stefan Anselm',
    description: 'Assist Stefan Anselm'
  },
  {
    id: '3',
    timestamp: 240,
    formattedTime: '04:00',
    type: 'shot',
    player: 'Kevin Rassner',
    points: 2,
    missed: true,
    description: 'Shot Kevin Rassner: two - Missed'
  },
  {
    id: '4',
    timestamp: 245,
    formattedTime: '04:05',
    type: 'rebound',
    player: 'Gregor Arapidis',
    description: 'Rebound Gregor Arapidis'
  },
  {
    id: '5',
    timestamp: 300,
    formattedTime: '05:00',
    type: 'steal',
    player: 'Abdullah Ari',
    description: 'Steal Abdullah Ari'
  },
  {
    id: '6',
    timestamp: 360,
    formattedTime: '06:00',
    type: 'block',
    player: 'Jan Crocoll',
    description: 'Block Jan Crocoll'
  },
  {
    id: '7',
    timestamp: 420,
    formattedTime: '07:00',
    type: 'turnover',
    player: 'Sven Bader',
    description: 'Turnover Sven Bader'
  },
  {
    id: '8',
    timestamp: 480,
    formattedTime: '08:00',
    type: 'shot',
    player: 'Nino de Bortoli',
    points: 1,
    missed: false,
    description: 'Shot Nino de Bortoli: free throw - Made'
  },
  {
    id: '9',
    timestamp: 540,
    formattedTime: '09:00',
    type: 'shot',
    player: 'Marcus Hayes',
    points: 1,
    missed: true,
    description: 'Shot Marcus Hayes: free throw - Missed'
  },
  {
    id: '10',
    timestamp: 600,
    formattedTime: '10:00',
    type: 'foul',
    player: 'Tim Krause',
    description: 'Foul Tim Krause'
  }
];

const samplePlayers: Player[] = [
  { id: '1', name: 'Kevin Rassner', jerseyNumber: 19, position: 'Forward' },
  { id: '2', name: 'Stefan Anselm', jerseyNumber: 30, position: 'Guard' },
  { id: '3', name: 'Gregor Arapidis', jerseyNumber: 77, position: 'Forward' },
  { id: '4', name: 'Abdullah Ari', jerseyNumber: 55, position: 'Forward' },
  { id: '5', name: 'Jan Crocoll', jerseyNumber: 21, position: 'Center' },
  { id: '6', name: 'Sven Bader', jerseyNumber: 17, position: 'Guard' },
  { id: '7', name: 'Nino de Bortoli', jerseyNumber: 7, position: 'Guard' },
  { id: '8', name: 'Marcus Hayes', jerseyNumber: 33, position: 'Center' },
  { id: '9', name: 'Tim Krause', jerseyNumber: 13, position: 'Guard' }
];

export function testStatsExtraction() {
  console.log('Testing Stats Extraction...');
  console.log('='.repeat(50));
  
  const extractedStats = extractStatsFromVideoData({
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    videoId: 'test-video-123',
    players: samplePlayers,
    events: sampleEvents,
    metadata: {
      totalEvents: sampleEvents.length,
      totalTimeSpan: Math.max(...sampleEvents.map(e => e.timestamp)),
      exportFormat: 'youtube-timestamps'
    }
  });

  console.log('Game ID:', extractedStats.gameId);
  console.log('Video ID:', extractedStats.videoId);
  console.log('Timestamp:', extractedStats.timestamp);
  console.log('Total Events:', extractedStats.playByPlay.length);
  console.log('');

  console.log('TEAM STATISTICS:');
  console.log('----------------');
  const team = extractedStats.teamStats;
  console.log(`Total Points: ${team.totalPoints}`);
  console.log(`Team FG%: ${team.teamFieldGoalPercentage}%`);
  console.log(`Team 3P%: ${team.teamThreePointPercentage}%`);
  console.log(`Team FT%: ${team.teamFreeThrowPercentage}%`);
  console.log(`Total Assists: ${team.totalAssists}`);
  console.log(`Total Rebounds: ${team.totalRebounds}`);
  console.log(`Total Steals: ${team.totalSteals}`);
  console.log(`Total Blocks: ${team.totalBlocks}`);
  console.log(`Total Turnovers: ${team.totalTurnovers}`);
  console.log(`Total Fouls: ${team.totalFouls}`);
  console.log('');

  console.log('PLAYER STATISTICS:');
  console.log('------------------');
  extractedStats.playerStats.forEach(player => {
    if (player.totalPoints > 0 || player.assists > 0 || player.rebounds > 0 || 
        player.steals > 0 || player.blocks > 0 || player.turnovers > 0) {
      console.log(`#${player.jerseyNumber} ${player.playerName}:`);
      console.log(`  Points: ${player.totalPoints}`);
      console.log(`  FG: ${player.fieldGoalsMade}/${player.fieldGoalsAttempted} (${player.fieldGoalPercentage}%)`);
      console.log(`  3PT: ${player.threePointersMade}/${player.threePointersAttempted} (${player.threePointPercentage}%)`);
      console.log(`  FT: ${player.freeThrowsMade}/${player.freeThrowsAttempted} (${player.freeThrowPercentage}%)`);
      console.log(`  Assists: ${player.assists}`);
      console.log(`  Rebounds: ${player.rebounds}`);
      console.log(`  Steals: ${player.steals}`);
      console.log(`  Blocks: ${player.blocks}`);
      console.log(`  Turnovers: ${player.turnovers}`);
      console.log(`  Fouls: ${player.fouls}`);
      console.log('');
    }
  });

  console.log('CSV EXPORT:');
  console.log('-----------');
  const csvExport = exportStatsToCSV(extractedStats);
  console.log(csvExport);
  
  return extractedStats;
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testStatsExtraction();
}
