import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/contexts/StatsContext";
import { PlayerTrendInfo, getPlayerImprovements } from "@/utils/statsTrends";
import { Flame } from "lucide-react";
import TeamBanner from "@/components/TeamBanner";
import TeamGallery from "@/components/TeamGallery";
import BirthdayNotification from "@/components/BirthdayNotification";
import { BASE_PATH } from "@/config";

import { useModernTheme } from "@/contexts/ModernThemeContext";
import { motion } from "framer-motion";

// Custom CSS for scrolling animation moved to index.css

const Home = () => {
  const navigate = useNavigate();
  const { games, players, gameLogs, loading, error } = useStats();
  const { isModernMode } = useModernTheme();

  // Get the last game (TSV Neuenstadt game with highest tsv_game_number that has a result)
  const lastGame = useMemo(() => {
    if (!games.length) return null;
    const now = new Date();
    const filtered = [...games]
      .filter(g => {
        // Filter out games without a valid score
        if (!g.finalScore || g.finalScore === '-' || g.finalScore === '-:-') return false;

        // Parse date to check if it's in the future
        try {
          // Format is typically "dd.MM.yyyy, HH:mm" or similar from de-DE locale
          // Simple parser for German date format
          const [datePart, timePart] = g.date.split(', ');
          if (!datePart) return true; // keep if can't parse

          const [day, month, year] = datePart.split('.').map(Number);
          const [hour, minute] = (timePart || '00:00').split(':').map(Number);

          const gameDate = new Date(year, month - 1, day, hour, minute);

          // Only show games that have happened (with a small buffer for ongoing games if needed, but 'finalScore' check should cover it)
          return gameDate <= now;
        } catch (e) {
          return true; // keep if can't parse
        }
      })
      .filter(g => {
        // Only TSV Neuenstadt games - check if either team is TSV Neuenstadt or Pitbulls
        const homeTeam = g.homeTeam?.toLowerCase() || '';
        const awayTeam = g.awayTeam?.toLowerCase() || '';
        return homeTeam.includes('neuenstadt') || homeTeam.includes('pitbull') ||
          awayTeam.includes('neuenstadt') || awayTeam.includes('pitbull');
      });

    return filtered[0];
  }, [games]);

  // Parse the final score into home and away scores
  const { homeScore, awayScore, homeTeam, awayTeam } = useMemo(() => {
    if (!lastGame) return {
      homeScore: '0',
      awayScore: '0',
      homeTeam: 'Pitbulls',
      awayTeam: 'Gegner'
    };

    // Get the team names
    const homeTeam = lastGame.homeTeam || 'Heimmannschaft';
    const awayTeam = lastGame.awayTeam || 'Gastmannschaft';

    // Handle the score format (it might be like '81:75' or '81-75')
    let homeScore = '0';
    let awayScore = '0';

    if (lastGame.finalScore) {
      const scoreParts = lastGame.finalScore.split(/[-:]/).map(s => s.trim());
      homeScore = scoreParts[0] || '0';
      awayScore = scoreParts[1] || '0';
    }

    return { homeScore, awayScore, homeTeam, awayTeam };
  }, [lastGame]);

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    if (!games.length) return 0;
    return Math.max(...games.map(g => g.gameNumber));
  }, [games]);

  // Pre-compute logs by player ID for O(1) access
  const logsByPlayer = useMemo(() => {
    const map = new Map();
    gameLogs.forEach(log => {
      if (!map.has(log.playerId)) map.set(log.playerId, []);
      map.get(log.playerId)!.push(log);
    });
    return map;
  }, [gameLogs]);

  // Calculate Win/Loss Streak
  const streak = useMemo(() => {
    if (!games.length) return null;

    const now = new Date();
    // Sort games by tsv_game_number descending (latest first) and only include TSV Neuenstadt games with results
    const sortedGames = [...games]
      .filter(g => {
        // Filter out games without a valid score
        if (!g.finalScore || g.finalScore === '-' || g.finalScore === '-:-') return false;

        // Parse date to check if it's in the future
        try {
          const [datePart, timePart] = g.date.split(', ');
          if (!datePart) return true;
          const [day, month, year] = datePart.split('.').map(Number);
          const [hour, minute] = (timePart || '00:00').split(':').map(Number);
          const gameDate = new Date(year, month - 1, day, hour, minute);
          return gameDate <= now;
        } catch (e) { return true; }
      })
      .filter(g => {
        // Only TSV Neuenstadt games - check if either team is TSV Neuenstadt or Pitbulls
        const homeTeam = g.homeTeam?.toLowerCase() || '';
        const awayTeam = g.awayTeam?.toLowerCase() || '';
        return homeTeam.includes('neuenstadt') || homeTeam.includes('pitbull') ||
          awayTeam.includes('neuenstadt') || awayTeam.includes('pitbull');
      });
    // Already sorted by date descending from service, so no need to sort by ID which is flawed

    if (sortedGames.length === 0) return null;

    let currentStreak = 0;
    let type: 'win' | 'loss' | null = null;

    for (const game of sortedGames) {
      if (!game.finalScore) continue;

      const [homeScore, awayScore] = game.finalScore.split(/[-:]/).map(s => parseInt(s.trim()));
      const isHomeGame = game.homeTeam?.toLowerCase().includes('neuenstadt') ||
        game.homeTeam?.toLowerCase().includes('pitbulls');

      const isWin = isHomeGame
        ? homeScore > awayScore
        : awayScore > homeScore;

      if (type === null) {
        type = isWin ? 'win' : 'loss';
        currentStreak = 1;
      } else if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { type, count: currentStreak };
  }, [games]);

  // Get top trending players (most improvements)
  const risingStars = useMemo<PlayerTrendInfo[]>(() => {
    if (!players.length || !gameLogs.length || latestGameNumber < 2) return [];

    const playersWithImprovements = players.map(player => {
      const specificLogs = logsByPlayer.get(player.id) || [];
      const improvements = getPlayerImprovements(
        player.id,
        latestGameNumber,
        specificLogs
      );

      return {
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        image: player.imageUrl || `${BASE_PATH}/placeholder-player.png`,
        improvements,
        improvementCount: improvements.length
      };
    });

    return playersWithImprovements
      .filter(player => player.improvementCount > 0)
      .sort((a, b) => b.improvementCount - a.improvementCount ||
        b.improvements[0]?.improvement - (a.improvements[0]?.improvement || 0))
      .slice(0, 3);
  }, [players, logsByPlayer, latestGameNumber, gameLogs.length]);

  // Get top 3 performers from all games (sorted by points per game)
  const topPerformers = useMemo(() => {
    if (!players.length || !gameLogs.length) return [];

    // Calculate stats for each player
    const playerStats = players.map(player => {
      // Skip non-player entries
      if (player.firstName === 'Gesamtsumme' || !player.firstName) return null;

      const playerGames = logsByPlayer.get(player.id) || [];
      const totalPoints = playerGames.reduce((sum, game) => sum + (game.points || 0), 0);
      const gamesPlayed = playerGames.length;

      // Use the player's average minutes directly from the player data
      const averageMinutes = player.minutesPerGame || 0;

      // Calculate other stats
      const totalThreePointers = playerGames.reduce((sum, game) => sum + (game.threePointers || 0), 0);
      const threePointersPerGame = gamesPlayed > 0 ? totalThreePointers / gamesPlayed : 0;

      const totalFreeThrowsMade = playerGames.reduce((sum, game) => sum + (game.freeThrowsMade || 0), 0);
      const totalFreeThrowAttempts = playerGames.reduce((sum, game) => sum + (game.freeThrowAttempts || 0), 0);
      const freeThrowPercentage = totalFreeThrowAttempts > 0
        ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%`
        : '0%';

      return {
        ...player,
        pointsPerGame: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
        threePointersPerGame,
        freeThrowPercentage,
        averageMinutes: averageMinutes,
        totalPoints,
        gamesPlayed
      };
    }).filter(Boolean); // Remove null entries

    // Sort by points per game and get top 3
    return [...playerStats]
      .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
      .slice(0, 3);
  }, [players, logsByPlayer, gameLogs.length]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl space-y-12 animate-fade-in">
          {/* Hero Section Skeleton */}
          <div className="text-center space-y-4">
            <div className="h-14 bg-muted/60 rounded-lg w-3/4 mx-auto skeleton-pulse" />
            <div className="h-6 bg-muted/60 rounded w-1/2 mx-auto skeleton-pulse" />
          </div>

          {/* Last Game Skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-muted/60 rounded w-48 mx-auto skeleton-pulse" />
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                  <div className="h-6 w-24 bg-muted/60 rounded skeleton-pulse" />
                  <div className="flex items-center justify-center gap-8 my-4">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                      <div className="h-12 w-20 bg-muted/60 rounded skeleton-pulse" />
                    </div>
                    <div className="h-8 w-12 bg-muted/60 rounded skeleton-pulse" />
                    <div className="text-center space-y-2">
                      <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                      <div className="h-12 w-20 bg-muted/60 rounded skeleton-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Skeleton */}
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-muted/60 rounded-full mx-auto skeleton-pulse" />
                    <div className="h-6 bg-muted/60 rounded w-3/4 mx-auto skeleton-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-16 bg-muted/60 rounded skeleton-pulse" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden der Daten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  if (!lastGame) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Keine Spieldaten verfügbar.</div>
        </div>
      </Layout>
    );
  }

  if (isModernMode) {
    return (
      <Layout>
        <BirthdayNotification players={players} />

        <div className="container mx-auto max-w-7xl px-4 space-y-12 pb-20">
          {/* Vision 2026 Hero */}
          <div className="relative pt-10 pb-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
                Pitbulls <span className="text-primary block md:inline">Stats</span> Hub
              </h1>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="h-[2px] w-12 bg-primary/50" />
                <span className="text-[10px] font-bold tracking-[0.5em] text-white/40 uppercase">Mehr als nur Zahlen</span>
                <div className="h-[2px] w-12 bg-primary/50" />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Last Game Result - Modern Bento */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-8 group"
            >
              <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden h-full bento-item">
                <div className="absolute top-0 right-0 p-8 text-[8rem] font-black text-white/[0.03] leading-none select-none">
                  {lastGame.gameNumber}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="px-4 py-1.5 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
                      Letztes Ergebnis
                    </span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lastGame.date}</span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-2">Heim</h4>
                      <h2 className="text-4xl font-black text-white tracking-tight">{homeTeam}</h2>
                      <div className="text-7xl font-black text-primary mt-4 select-none">{homeScore}</div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-[2px] bg-white/10" />
                      <div className="text-2xl font-black text-white/20 italic">VS</div>
                      <div className="w-12 h-[2px] bg-white/10" />
                    </div>

                    <div className="flex-1 text-center md:text-right">
                      <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-2">Gast</h4>
                      <h2 className="text-4xl font-black text-white tracking-tight">{awayTeam}</h2>
                      <div className="text-7xl font-black text-white mt-4 select-none">{awayScore}</div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                      className="group/btn relative px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-primary hover:border-primary transition-all duration-500 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Zum Spielbericht
                        <span className="translate-x-0 group-hover/btn:translate-x-1 transition-transform">→</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Streak Bento */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-4"
            >
              <div className="glass-card rounded-[2.5rem] p-8 h-full bento-item bg-gradient-to-br from-primary/20 via-transparent to-transparent">
                <h4 className="text-[10px] font-black uppercase text-white/50 tracking-[0.3em] mb-8">Aktuelle Serie</h4>

                <div className="flex flex-col items-center justify-center py-6">
                  <div className={`text-8xl font-black italic ${streak?.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {streak?.count}
                  </div>
                  <div className="text-xs font-black uppercase tracking-[0.5em] text-white/60 mt-2">
                    {streak?.type === 'win' ? 'Siegesserie' : 'Niederlagenserie'}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <span>Saison 2026</span>
                    <span className="text-primary">TSV 1892</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Performers Bento Section */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3 flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black italic text-white uppercase">Top-Leistungsträger</h3>
                <button onClick={() => navigate("/players")} className="text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-primary">Zur Datenbank →</button>
              </div>

              {topPerformers.map((performer, idx) => (
                <motion.div
                  key={performer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.1) }}
                  className="glass-card rounded-[2rem] p-6 bento-item group"
                  onClick={() => navigate(`/players/${performer.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Efficiency</div>
                      <div className="text-lg font-black text-primary">{performer.pointsPerGame.toFixed(1)} <span className="text-[10px] text-white/40">PPG</span></div>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-6 group-hover:translate-x-1 transition-transform">
                    {performer.firstName} <span className="text-primary">{performer.lastName}</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Pts</div>
                      <div className="text-md font-bold text-white">{performer.totalPoints}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">FT %</div>
                      <div className="text-md font-bold text-white">{performer.freeThrowPercentage}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rising Stars - Dynamic Scroll */}
            {risingStars.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="md:col-span-12 glass-card rounded-[2.5rem] p-8 overflow-hidden bento-item"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Aufsteiger</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Momentum-Spieler der Woche</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {risingStars.map((player, idx) => (
                    <div key={player.playerId} className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-orange-500/30 overflow-hidden">
                          <img src={player.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <div className="text-md font-black text-white">{player.firstName} {player.lastName}</div>
                          <div className="text-[10px] font-bold text-orange-400">+{player.improvementCount} MILIESTONES</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Videos Quick Link */}
            <motion.div
              className="md:col-span-12"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <button
                onClick={() => navigate("/videos")}
                className="w-full h-32 glass-card rounded-[2.5rem] flex items-center justify-center gap-8 group hover:bg-primary/10 transition-all border-white/5 hover:border-primary/30"
              >
                <div className="text-4xl group-hover:rotate-12 transition-transform">🎥</div>
                <div className="text-center md:text-left">
                  <div className="text-2xl font-black text-white uppercase tracking-tighter">Medienzentrum</div>
                  <div className="text-[10px] font-bold text-white/40 tracking-[0.3em] uppercase">Access Video Database</div>
                </div>
                <div className="hidden md:block w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all">→</div>
              </button>
            </motion.div>
          </div>

          {/* Team Gallery - Modern Integration */}
          <div id="team-gallery" className="pt-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1 bg-white/5" />
              <h3 className="text-xl font-black text-white/20 uppercase tracking-[1em] italic">Mannschafts-Archiv</h3>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <TeamGallery />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Birthday Notification Popup */}
      <BirthdayNotification players={players} />

      <div className="container mx-auto max-w-6xl space-y-12 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
            Pitbulls Stats Hub
          </h1>

        </div>

        {/* Team Banner */}
        <TeamBanner
          streak={streak}
          onBannerClick={() => {
            const galleryElement = document.getElementById('team-gallery');
            if (galleryElement) {
              galleryElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* Last Game Result */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Letztes Spiel</h3>
          <Card className="border-border shadow-elegant hover:shadow-elegant-lg transition-elegant">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold">Spieltag {lastGame.gameNumber}</div>
                <div className="text-lg">{lastGame.date}</div>
                <div className="w-full">
                  {/* Team names row - only on mobile */}
                  <div className="md:hidden flex items-center justify-center gap-2 mb-2">
                    <div className="text-sm font-medium text-center flex-1 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {homeTeam}
                    </div>
                    <div className="px-2 text-sm font-medium">vs</div>
                    <div className="text-sm font-medium text-center flex-1 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {awayTeam}
                    </div>
                  </div>

                  {/* Score row */}
                  <div className="flex items-center justify-center gap-4 md:gap-8 my-2">
                    {/* Hidden on mobile - team name is shown in the row above */}
                    <div className="hidden md:block text-center flex-1">
                      <div className="text-2xl font-bold line-clamp-2">{homeTeam}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-primary">
                        {homeScore}
                      </div>
                    </div>

                    <div className="text-2xl font-bold">:</div>

                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black">
                        {awayScore}
                      </div>
                    </div>

                    {/* Hidden on mobile - team name is shown in the row above */}
                    <div className="hidden md:block text-center flex-1">
                      <div className="text-2xl font-bold line-clamp-2">{awayTeam}</div>
                    </div>
                  </div>
                </div>
                {lastGame.finalScore && (lastGame.finalScore.includes('-') || lastGame.finalScore.includes(':')) ? (
                  <div className="text-xl font-bold">
                    {homeTeam === 'TSV Neuenstadt'
                      ? (Number(homeScore) > Number(awayScore) ? '🏆 Sieg' : '😞 Niederlage')
                      : (Number(awayScore) > Number(homeScore) ? '🏆 Sieg' : '😞 Niederlage')}
                  </div>
                ) : (
                  <div className="text-xl font-bold text-yellow-600">
                    ⏳ Spiel steht noch aus
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                  className="mt-4"
                >
                  Spielbericht ansehen
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('games')}
              className="text-muted-foreground hover:text-primary p-0 h-auto"
            >
              Alle Spiele →
            </Button>
          </div>

          {/* Top 3 Performers */}
          <div className="space-y-4 mt-12">
            <h3 className="text-2xl font-bold text-center">Top 3 Performer</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {topPerformers.map((performer, index) => (
                <Card
                  key={performer.id}
                  className="border-border shadow-elegant hover:shadow-elegant-lg transition-elegant cursor-pointer group"
                  onClick={() => navigate(`/players/${performer.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="text-3xl font-bold text-primary group-hover:scale-110 transition-elegant">#{index + 1}</div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {performer.firstName} {performer.lastName || ''}
                        </div>
                        {performer.averageMinutes > 0 && (
                          <div className="text-sm text-muted-foreground">
                            ⏱️ {performer.averageMinutes.toFixed(1)} Min/Spiel
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm w-full">
                        <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                          <div className="text-muted-foreground text-xs">Punkte/Spiel</div>
                          <div className="text-lg font-bold text-primary">{performer.pointsPerGame.toFixed(1)}</div>
                        </div>
                        <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                          <div className="text-muted-foreground text-xs">Gesamtpunkte</div>
                          <div className="text-lg font-bold">{performer.totalPoints}</div>
                        </div>
                        <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                          <div className="text-muted-foreground text-xs">3-Punkte/Spiel</div>
                          <div className="text-lg font-bold">{performer.threePointersPerGame.toFixed(1)}</div>
                        </div>
                        <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                          <div className="text-muted-foreground text-xs">FW-Quote</div>
                          <div className="text-lg font-bold">{performer.freeThrowPercentage}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/players")}
                className="text-muted-foreground hover:text-primary"
              >
                Alle Spieler →
              </Button>
            </div>
          </div>

          {/* Rising Stars Section */}
          {risingStars.length > 0 && (
            <div className="space-y-4 mt-12">
              <div className="w-full text-center">
                <h3 className="text-2xl font-bold">Aufsteiger der Woche</h3>
                <div className="flex justify-center items-center text-sm text-muted-foreground mt-1">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  <span>Verbesserungen im Vergleich zum letzten Spiel</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {risingStars.map((player, index) => (
                  <Card
                    key={player.playerId}
                    className="border-orange-100 shadow-elegant hover:shadow-elegant-lg transition-elegant cursor-pointer group"
                    onClick={() => navigate(`/players/${player.playerId}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative group-hover:scale-105 transition-elegant">
                          <img
                            src={player.image}
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                          />
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="flex items-center text-sm text-orange-600">
                            <Flame className="w-4 h-4 mr-1" />
                            <span>{player.improvementCount} Verbesserungen</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {player.improvements.slice(0, 3).map((improvement, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-muted-foreground">{improvement.category}:</span>
                            <span className="font-medium">
                              {improvement.previousValue} →{' '}
                              <span className="text-green-600">{improvement.currentValue}</span>
                              <span className="ml-1 text-xs text-green-600">
                                (+{improvement.improvement}%)
                              </span>
                            </span>
                          </div>
                        ))}
                        {player.improvements.length > 3 && (
                          <div className="text-xs text-muted-foreground text-right">
                            +{player.improvements.length - 3} weitere Verbesserungen
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/players')}
                  className="text-muted-foreground hover:text-primary"
                >
                  Alle Spieler →
                </Button>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid md:grid-cols-1 gap-4 pt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/videos")}
              className="h-20 shadow-elegant hover:shadow-elegant-lg transition-elegant group"
            >
              <div className="text-center">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-elegant">🎥</div>
                <div className="font-semibold">Videos</div>
              </div>
            </Button>
          </div>

          {/* Team Gallery */}
          <div id="team-gallery">
            <TeamGallery />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
