import { PlayerStats, PlayerGameLog, VideoStats, GameStats } from '@/types/stats';

export interface AwardNominee {
  playerId: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  stats: Record<string, string | number>;
  score: number;
}

export interface AwardCategory {
  id: string;
  title: string;
  description: string;
  winner: AwardNominee;
  honorableMentions: AwardNominee[];
}

const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 25;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 25;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : 25;
  } catch (e) {
    return 25;
  }
};

/**
 * Calculate all season awards
 */
export const calculateAwards = (
  players: PlayerStats[],
  gameLogs: PlayerGameLog[],
  videoStats: VideoStats[],
  games: GameStats[]
): AwardCategory[] => {
  // Filter out players who haven't played any games
  const activePlayers = players.filter(p => p.gamesPlayed > 0);
  if (activePlayers.length === 0) return [];

  // Group stats by player
  const playerStatsMap = new Map<string, {
    logs: PlayerGameLog[];
    vStats: VideoStats[];
    player: PlayerStats;
    videoGp: number;
  }>();

  activePlayers.forEach(p => {
    const pVideoStats = videoStats.filter(v => v.playerId === p.id);
    const videoGp = pVideoStats.filter(stat => (
      (stat.twoPointersMade || 0) + (stat.twoPointersAttempted || 0) +
      (stat.threePointersMade || 0) + (stat.threePointersAttempted || 0) +
      (stat.freeThrowsMade || 0) + (stat.freeThrowsAttempted || 0) +
      (stat.steals || 0) + (stat.blocks || 0) + (stat.assists || 0) + (stat.rebounds || 0) +
      (stat.turnovers || 0) + (stat.fouls || 0) > 0
    )).length;
    
    playerStatsMap.set(p.id, {
      logs: gameLogs.filter(l => l.playerId === p.id),
      vStats: pVideoStats,
      player: p,
      videoGp: videoGp
    });
  });

  // Pre-calculate team averages for baselines
  const allOpponentPoints = games.map(g => {
    const scores = g.finalScore.split(':').map(Number);
    const isHome = g.homeTeam.toLowerCase().includes('neuenstadt') || g.homeTeam.toLowerCase().includes('pitbulls');
    return isHome ? (scores[1] || 0) : (scores[0] || 0);
  });
  const teamAvgOpponentPoints = allOpponentPoints.length > 0 
    ? allOpponentPoints.reduce((a, b) => a + b, 0) / allOpponentPoints.length 
    : 0;

  const allWinResults = games.map(g => {
    const scores = g.finalScore.split(':').map(Number);
    const isHome = g.homeTeam.toLowerCase().includes('neuenstadt') || g.homeTeam.toLowerCase().includes('pitbulls');
    return isHome ? (scores[0] > scores[1]) : (scores[1] > scores[0]);
  });
  const teamWinPct = allWinResults.length > 0 
    ? (allWinResults.filter(Boolean).length / allWinResults.length) * 100 
    : 0;

  const categories: AwardCategory[] = [];

  // --- MVP ---
  const mvpNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalPTS = data.logs.reduce((sum, l) => sum + l.points, 0);
    const totalAST = data.vStats.reduce((sum, v) => sum + (v.assists || 0), 0);
    const totalREB = data.vStats.reduce((sum, v) => sum + (v.rebounds || 0), 0);
    const totalSTL = data.vStats.reduce((sum, v) => sum + (v.steals || 0), 0);
    const totalBLK = data.vStats.reduce((sum, v) => sum + (v.blocks || 0), 0);
    const totalTO = data.vStats.reduce((sum, v) => sum + (v.turnovers || 0), 0);
    const gp = p.gamesPlayed;
    const vgp = data.videoGp || 1;
    const ppg = totalPTS / gp;
    const apg = totalAST / vgp;
    const rpg = totalREB / vgp;
    const spg = totalSTL / vgp;
    const bpg = totalBLK / vgp;
    const tpg = totalTO / vgp;
    const score = ppg + (apg * 1.5) + (rpg * 1.2) + (spg * 1.5) + (bpg * 1.5) - tpg;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'PPG': ppg.toFixed(1), 'APG': apg.toFixed(1), 'RPG': rpg.toFixed(1), 'Einfluss': score.toFixed(1) }
    };
  }).sort((a, b) => b.score - a.score);

  if (mvpNominees.length > 0) {
    categories.push({
      id: 'mvp',
      title: 'Season MVP',
      description: 'Der einflussreichste Spieler an beiden Enden des Feldes. Kombiniert Scoring, Playmaking und defensive Präsenz.',
      winner: mvpNominees[0],
      honorableMentions: mvpNominees.slice(1, 3)
    });
  }

  // --- Marktwertchampion ---
  const marketNominees = activePlayers.map(p => {
    const mvpData = mvpNominees.find(n => n.playerId === p.id);
    const age = calculateAge(p.birthDate);
    const agePenalty = Math.pow(age / 19, 3.5);
    const score = (mvpData?.score || 0) / agePenalty;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Alter': age, 'Einfluss': mvpData?.score.toFixed(1) || '0', 'Wert': score.toFixed(1) }
    };
  }).sort((a, b) => b.score - a.score);

  if (marketNominees.length > 0) {
    categories.push({
      id: 'market',
      title: 'Marktwertchampion',
      description: 'Der beste "Rising Star" basierend auf hohem statistischem Einfluss im Verhältnis zum jungen Alter.',
      winner: marketNominees[0],
      honorableMentions: marketNominees.slice(1, 3)
    });
  }

  // --- Sicherer Hafen (Least TO per Minute) ---
  const safetyNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    // Only count minutes from games where we have video stats for this player
    const videoGameNumbers = new Set(data.vStats.map(v => v.gameNumber));
    const videoLogs = data.logs.filter(l => videoGameNumbers.has(l.gameNumber));
    const totalMinutes = videoLogs.reduce((sum, l) => sum + l.minutesPlayed, 0);
    const totalTO = data.vStats.reduce((sum, v) => sum + (v.turnovers || 0), 0);
    const toPerMin = totalMinutes > 0 ? totalTO / totalMinutes : 999;
    
    // Sort by LEAST toPerMin, minimum 40 minutes to qualify
    const score = totalMinutes >= 40 ? (1 - toPerMin) : -1;
    
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: {
        'TO / Min': toPerMin.toFixed(3),
        'Minuten': Math.round(totalMinutes),
        'Ballverluste': totalTO
      }
    };
  }).filter(n => n.score >= 0).sort((a, b) => b.score - a.score);

  if (safetyNominees.length > 0) {
    categories.push({
      id: 'safety',
      title: 'Sicherer Hafen',
      description: 'Maximale Ballsicherheit. Der Spieler mit den wenigsten Ballverlusten pro gespielter Minute (mind. 40 Min).',
      winner: safetyNominees[0],
      honorableMentions: safetyNominees.slice(1, 3)
    });
  }

  // --- KM-Pauschale ---
  const travelNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const awayLogs = data.logs.filter(l => l.gameType === 'Auswärts');
    const awayCount = awayLogs.length;
    const awayMinutes = awayLogs.reduce((sum, l) => sum + l.minutesPlayed, 0);
    const minPerTrip = awayCount > 0 ? awayMinutes / awayCount : 999;
    const score = awayCount >= 2 ? (100 - minPerTrip) : -1;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Min/Trip': minPerTrip.toFixed(1), 'Fahrten': awayCount, 'Minuten': Math.round(awayMinutes) }
    };
  }).filter(n => n.score >= 0).sort((a, b) => b.score - a.score);

  if (travelNominees.length > 0) {
    categories.push({
      id: 'travel',
      title: 'KM-Pauschale',
      description: 'Der weiteste Weg für die wenigsten Minuten. Der Spieler mit den wenigsten Minuten pro Auswärtsfahrt (mind. 2 Fahrten).',
      winner: travelNominees[0],
      honorableMentions: travelNominees.slice(1, 3)
    });
  }

  // --- Bob the Builder ---
  const builderNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalFTM = data.logs.reduce((sum, l) => sum + (l.freeThrowsMade || 0), 0);
    const totalFTA = data.logs.reduce((sum, l) => sum + (l.freeThrowAttempts || 0), 0);
    const bricks = totalFTA - totalFTM;
    const ftPct = totalFTA > 0 ? (totalFTM / totalFTA) * 100 : 100;
    const score = bricks >= 5 ? (100 - ftPct) : -1;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Bricks': bricks, 'FW %': ftPct.toFixed(1) + '%', 'Spiele': p.gamesPlayed }
    };
  }).filter(n => n.score >= 0).sort((a, b) => b.score - a.score);

  if (builderNominees.length > 0) {
    categories.push({
      id: 'builder',
      title: 'Freimaurer',
      description: 'Fleißig am Steine klopfen. Der Spieler mit der niedrigsten Freiwurfquote (mind. 5 Fehlwürfe).',
      winner: builderNominees[0],
      honorableMentions: builderNominees.slice(1, 3)
    });
  }

  // --- Bob der Baumeister ---
  const baumeisterNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const total2PM = data.vStats.reduce((sum, v) => sum + (v.twoPointersMade || 0), 0);
    const total2PA = data.vStats.reduce((sum, v) => sum + (v.twoPointersAttempted || 0), 0);
    const total3PM = data.vStats.reduce((sum, v) => sum + (v.threePointersMade || 0), 0);
    const total3PA = data.vStats.reduce((sum, v) => sum + (v.threePointersAttempted || 0), 0);
    const totalFGM = total2PM + total3PM;
    const totalFGA = total2PA + total3PA;
    const bricks = totalFGA - totalFGM;
    const fgPct = totalFGA > 0 ? (totalFGM / totalFGA) * 100 : 100;
    const score = bricks >= 10 ? (100 - fgPct) : -1;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Bricks': bricks, 'FG %': fgPct.toFixed(1) + '%', 'Spiele': data.videoGp }
    };
  }).filter(n => n.score >= 0).sort((a, b) => b.score - a.score);

  if (baumeisterNominees.length > 0) {
    categories.push({
      id: 'baumeister',
      title: 'Bob der Baumeister',
      description: 'Er baut das Fundament. Der Spieler mit der niedrigsten Feldwurfquote (mind. 10 Fehlwürfe).',
      winner: baumeisterNominees[0],
      honorableMentions: baumeisterNominees.slice(1, 3)
    });
  }

  // --- DPOY ---
  const dpoyNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalSTL = data.vStats.reduce((sum, v) => sum + (v.steals || 0), 0);
    const totalBLK = data.vStats.reduce((sum, v) => sum + (v.blocks || 0), 0);
    const totalREB = data.vStats.reduce((sum, v) => sum + (v.rebounds || 0), 0);
    const totalFouls = data.vStats.reduce((sum, v) => sum + (v.fouls || 0), 0);
    const vgp = data.videoGp || 1;
    const playerGames = new Set(data.logs.map(l => l.gameNumber));
    const opponentPointsWith = games.filter(g => playerGames.has(g.gameNumber)).map(g => {
        const scores = g.finalScore.split(':').map(Number);
        const isHome = g.homeTeam.toLowerCase().includes('neuenstadt') || g.homeTeam.toLowerCase().includes('pitbulls');
        return isHome ? (scores[1] || 0) : (scores[0] || 0);
    });
    const opponentPointsWithout = games.filter(g => !playerGames.has(g.gameNumber)).map(g => {
        const scores = g.finalScore.split(':').map(Number);
        const isHome = g.homeTeam.toLowerCase().includes('neuenstadt') || g.homeTeam.toLowerCase().includes('pitbulls');
        return isHome ? (scores[1] || 0) : (scores[0] || 0);
    });
    const avgOppWith = opponentPointsWith.length > 0 ? opponentPointsWith.reduce((a, b) => a + b, 0) / opponentPointsWith.length : teamAvgOpponentPoints;
    const avgOppWithout = opponentPointsWithout.length > 0 ? opponentPointsWithout.reduce((a, b) => a + b, 0) / opponentPointsWithout.length : teamAvgOpponentPoints;
    const defensivePlusMinus = avgOppWithout - avgOppWith;
    const spg = totalSTL / vgp;
    const bpg = totalBLK / vgp;
    const rpg = totalREB / vgp;
    const fpg = totalFouls / vgp;
    const score = (spg * 2) + (bpg * 2) + (rpg * 1) - (fpg * 0.5) + (defensivePlusMinus * 2);
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'STL': spg.toFixed(1), 'BLK': bpg.toFixed(1), 'REB': rpg.toFixed(1), 'Def +/-': defensivePlusMinus.toFixed(1) }
    };
  }).sort((a, b) => b.score - a.score);

  if (dpoyNominees.length > 0) {
    categories.push({
      id: 'dpoy',
      title: 'Defensive Player of the Year',
      description: 'Der Anker der Verteidigung, der Gegner durch Steals, Blocks und unerbittlichen Druck stoppt.',
      winner: dpoyNominees[0],
      honorableMentions: dpoyNominees.slice(1, 3)
    });
  }

  // --- 6th Man of the Year ---
  const sixthManNominees = activePlayers.map(p => ({
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score: p.minutesPerGame,
      stats: { 'Min/G': p.minutesPerGame.toFixed(1), 'Spiele': p.gamesPlayed, 'PPG': p.pointsPerGame.toFixed(1) }
    })).sort((a, b) => b.score - a.score);

  if (sixthManNominees.length >= 8) {
    categories.push({
      id: 'sixthman',
      title: '6th Man of the Year',
      description: 'Die wichtigste Verstärkung von der Bank. Spieler mit der 6., 7. und 8. höchsten Spielzeit.',
      winner: sixthManNominees[5],
      honorableMentions: [sixthManNominees[6], sixthManNominees[7]]
    });
  }

  // --- Sharp Shooter ---
  const shooterNominees = activePlayers.map(p => {
      const data = playerStatsMap.get(p.id)!;
      const totalFTM = data.logs.reduce((sum, l) => sum + (l.freeThrowsMade || 0), 0);
      const totalFTA = data.logs.reduce((sum, l) => sum + (l.freeThrowAttempts || 0), 0);
      const ftPct = totalFTA > 0 ? (totalFTM / totalFTA) * 100 : 0;
      const v3PM = data.vStats.reduce((sum, v) => sum + (v.threePointersMade || 0), 0);
      const v3PA = data.vStats.reduce((sum, v) => sum + (v.threePointersAttempted || 0), 0);
      const threePtPct = v3PA > 0 ? (v3PM / v3PA) * 100 : 0;
      const v2PM = data.vStats.reduce((sum, v) => sum + (v.twoPointersMade || 0), 0);
      const v2PA = data.vStats.reduce((sum, v) => sum + (v.twoPointersAttempted || 0), 0);
      const fgPct = (v2PA + v3PA) > 0 ? ((v2PM + v3PM) / (v2PA + v3PA)) * 100 : 0;
      const volumeFactor = Math.min(v3PA / 10, 1.0);
      const score = ((threePtPct * 1.5) + (ftPct * 1.0) + (fgPct * 0.5)) * (v3PA > 0 ? volumeFactor : 0);
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        imageUrl: p.imageUrl,
        score,
        stats: { '3P%': threePtPct.toFixed(1) + '%', 'FW%': ftPct.toFixed(1) + '%', 'FG%': fgPct.toFixed(1) + '%' }
      };
    }).filter(n => n.score > 0).sort((a, b) => b.score - a.score);

  if (shooterNominees.length > 0) {
    categories.push({
      id: 'shooter',
      title: 'Sharp Shooter of the Year',
      description: 'Die gefährlichste Bedrohung von der Dreierlinie und der Freiwurflinie.',
      winner: shooterNominees[0],
      honorableMentions: shooterNominees.slice(1, 3)
    });
  }

  // --- Dauerbrenner ---
  const ironmanNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalMinutes = data.logs.reduce((sum, l) => sum + l.minutesPlayed, 0);
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score: totalMinutes,
      stats: { 'Gesamt Min': Math.round(totalMinutes), 'Min/G': p.minutesPerGame.toFixed(1), 'Spiele': p.gamesPlayed }
    };
  }).sort((a, b) => b.score - a.score);

  categories.push({
    id: 'ironman',
    title: 'Dauerbrenner',
    description: 'Der Spieler mit der höchsten Gesamteinsatzzeit. Unermüdlich und immer bereit.',
    winner: ironmanNominees[0],
    honorableMentions: ironmanNominees.slice(1, 3)
  });

  // --- Der Architekt ---
  const architectNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalAST = data.vStats.reduce((sum, v) => sum + (v.assists || 0), 0);
    const totalTO = data.vStats.reduce((sum, v) => sum + (v.turnovers || 0), 0);
    const ratio = totalTO > 0 ? totalAST / totalTO : totalAST;
    const score = totalAST >= 5 ? ratio : 0;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Ratio': ratio.toFixed(2), 'Assists': totalAST, 'Turnovers': totalTO }
    };
  }).filter(n => n.score > 0).sort((a, b) => b.score - a.score);

  if (architectNominees.length > 0) {
    categories.push({
      id: 'architect',
      title: 'Der Architekt',
      description: 'Höchste Präzision im Spielaufbau. Der Spieler mit dem besten Assist-zu-Turnover-Verhältnis.',
      winner: architectNominees[0],
      honorableMentions: architectNominees.slice(1, 3)
    });
  }

  // --- Kalt wie Eis ---
  const clutchNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const closeGames = games.filter(g => {
      const scores = g.finalScore.split(':').map(Number);
      return Math.abs(scores[0] - scores[1]) <= 7;
    }).map(g => g.gameNumber);
    const closeLogs = data.logs.filter(l => closeGames.includes(l.gameNumber));
    if (closeLogs.length === 0) return { ...mvpNominees[0], score: 0 };
    const avgPoints = closeLogs.reduce((sum, l) => sum + l.points, 0) / closeLogs.length;
    const score = avgPoints * (closeLogs.length / 2);
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Clutch PPG': avgPoints.toFixed(1), 'Spiele': closeLogs.length, 'Pkt Total': closeLogs.reduce((sum, l) => sum + l.points, 0) }
    };
  }).filter(n => n.score > 0).sort((a, b) => b.score - a.score);

  if (clutchNominees.length > 0) {
    categories.push({
      id: 'clutch',
      title: 'Kalt wie Eis',
      description: 'Der Spieler, der in engen Spielen (≤ 7 Punkte Differenz) die meiste Verantwortung übernimmt.',
      winner: clutchNominees[0],
      honorableMentions: clutchNominees.slice(1, 3)
    });
  }

  // --- Der Staubsauger ---
  const vacuumNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalREB = data.vStats.reduce((sum, v) => sum + (v.rebounds || 0), 0);
    const vgp = data.videoGp || 1;
    const score = totalREB / vgp;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'RPG': score.toFixed(1), 'Total REB': totalREB, 'Spiele': vgp }
    };
  }).sort((a, b) => b.score - a.score);

  categories.push({
    id: 'vacuum',
    title: 'Der Staubsauger',
    description: 'Beherrscht die Zone. Der Spieler mit den meisten Rebounds pro Spiel.',
    winner: vacuumNominees[0],
    honorableMentions: vacuumNominees.slice(1, 3)
  });

  // --- Effizienz-Monster ---
  const efficiencyNominees = activePlayers.map(p => ({
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score: p.pointsPer40,
      stats: { 'Pkt/40': p.pointsPer40.toFixed(1), 'PPG': p.pointsPerGame.toFixed(1), 'Min/G': p.minutesPerGame.toFixed(1) }
    })).sort((a, b) => b.score - a.score);

  categories.push({
    id: 'efficiency',
    title: 'Effizienz-Monster',
    description: 'Maximale Ausbeute in minimaler Zeit. Höchste Punkte pro 40 Minuten.',
    winner: efficiencyNominees[0],
    honorableMentions: efficiencyNominees.slice(1, 3)
  });

  // --- Emotional Support ---
  const supportNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const totalMinutes = data.logs.reduce((sum, l) => sum + l.minutesPlayed, 0);
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score: -totalMinutes,
      stats: { 'Minuten': Math.round(totalMinutes), 'Bank-Power': '100%', 'Stimmung': 'Top' }
    };
  }).sort((a, b) => b.score - a.score);

  categories.push({
    id: 'support',
    title: 'Emotional Support',
    description: 'Die Seele der Bank. Sorgt für Stimmung, auch wenn die Spielzeit knapp ist.',
    winner: supportNominees[0],
    honorableMentions: supportNominees.slice(1, 3)
  });

  // --- Most Improved ---
  const improvementNominees = activePlayers.filter(p => p.gamesPlayed >= 4).map(p => {
      const data = playerStatsMap.get(p.id)!;
      const sortedLogs = [...data.logs].sort((a, b) => a.gameNumber - b.gameNumber);
      const half = Math.floor(sortedLogs.length / 2);
      const firstHalf = sortedLogs.slice(0, half);
      const lastHalf = sortedLogs.slice(-half);
      const firstAvg = firstHalf.reduce((sum, l) => sum + l.points, 0) / firstHalf.length;
      const lastAvg = lastHalf.reduce((sum, l) => sum + l.points, 0) / lastHalf.length;
      const score = lastAvg - firstAvg;
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        imageUrl: p.imageUrl,
        score,
        stats: { 'Start PPG': firstAvg.toFixed(1), 'End PPG': lastAvg.toFixed(1), 'Zuwachs': (score > 0 ? '+' : '') + score.toFixed(1) }
      };
    }).sort((a, b) => b.score - a.score);

  if (improvementNominees.length > 0) {
    categories.push({
      id: 'improved',
      title: 'Most Improved Player',
      description: 'Der Spieler, der über die Saison hinweg das größte Wachstum und die stärkste Entwicklung gezeigt hat.',
      winner: improvementNominees[0],
      honorableMentions: improvementNominees.slice(1, 3)
    });
  }

  // --- Enforcer ---
  const enforcerNominees = activePlayers.map(p => ({
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score: p.foulsPer40,
      stats: { 'Fouls/40': p.foulsPer40.toFixed(1), 'Fouls/G': p.foulsPerGame.toFixed(1), 'Spiele': p.gamesPlayed }
    })).sort((a, b) => b.score - a.score);

  if (enforcerNominees.length > 0) {
    categories.push({
      id: 'enforcer',
      title: 'Enforcer of the Year',
      description: 'Der Spieler, der keine körperliche Auseinandersetzung scheut. Höchste Foulrate pro 40 Minuten.',
      winner: enforcerNominees[0],
      honorableMentions: enforcerNominees.slice(1, 3)
    });
  }

  // --- Emotional Leader ---
  const leaderNominees = activePlayers.map(p => {
    const data = playerStatsMap.get(p.id)!;
    const playerGames = new Set(data.logs.map(l => l.gameNumber));
    const gamesWith = games.filter(g => playerGames.has(g.gameNumber));
    const gamesWithout = games.filter(g => !playerGames.has(g.gameNumber));
    const getWin = (g: GameStats) => {
      const scores = g.finalScore.split(':').map(Number);
      const isHome = g.homeTeam.toLowerCase().includes('neuenstadt') || g.homeTeam.toLowerCase().includes('pitbulls');
      return isHome ? (scores[0] > scores[1]) : (scores[1] > scores[0]);
    };
    const winsWith = gamesWith.filter(getWin).length;
    const winPctWith = gamesWith.length > 0 ? (winsWith / gamesWith.length) * 100 : teamWinPct;
    const winsWithout = gamesWithout.filter(getWin).length;
    const winPctWithout = gamesWithout.length > 0 ? (winsWithout / gamesWithout.length) * 100 : teamWinPct;
    const score = winPctWith - winPctWithout;
    return {
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
      score,
      stats: { 'Sieg% Mit': winPctWith.toFixed(0) + '%', 'Sieg% Ohne': winPctWithout.toFixed(0) + '%', 'Differenz': (score > 0 ? '+' : '') + score.toFixed(1) }
    };
  }).sort((a, b) => b.score - a.score);

  if (leaderNominees.length > 0) {
    categories.push({
      id: 'leader',
      title: 'Emotional Leader of the Year',
      description: 'Der Spieler, dessen Anwesenheit auf dem Feld am stärksten mit Teamerfolg und Siegen korreliert.',
      winner: leaderNominees[0],
      honorableMentions: leaderNominees.slice(1, 3)
    });
  }

  return categories;
};
