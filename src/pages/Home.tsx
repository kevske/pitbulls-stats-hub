import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useStats } from "@/contexts/StatsContext";
import { PlayerTrendInfo, getPlayerImprovements } from "@/utils/statsTrends";
import { PlayerGameLog, GameStats } from "@/types/stats";
import { Flame } from "lucide-react";
import TeamGallery from "@/components/TeamGallery";
import BirthdayNotification from "@/components/BirthdayNotification";
import { BASE_PATH } from "@/config";
import { useSeason } from "@/contexts/SeasonContext";
import { motion } from "framer-motion";

// Vision 2026 v2 — "Editorial Court". Ein einziges, theme-aware Design
// (Light + Dark über CSS-Tokens), kein isModernMode-Fork mehr.

const teamIsPitbulls = (team?: string) => {
  const t = (team ?? '').toLowerCase();
  return t.includes('neuenstadt') || t.includes('pitbull');
};

const gameIsWin = (g: GameStats) => {
  const [h, a] = (g.finalScore ?? '').split(/[-:]/).map(s => parseInt(s.trim(), 10));
  if (isNaN(h) || isNaN(a)) return false;
  return teamIsPitbulls(g.homeTeam) ? h > a : a > h;
};

const Home = () => {
  const navigate = useNavigate();
  const { games, players, gameLogs, loading, error } = useStats();
  const { selectedSeason } = useSeason();

  // Filter relevant games once (TSV Neuenstadt/Pitbulls games with valid results in the past)
  const relevantGames = useMemo(() => {
    if (!games.length) return [];
    const now = new Date();

    // Games are already sorted by date descending from service
    return games.filter(g => {
      // 1. Filter out games without a valid score
      if (!g.finalScore || g.finalScore === '-' || g.finalScore === '-:-') return false;

      // 2. Filter by team (TSV Neuenstadt or Pitbulls)
      const homeTeam = g.homeTeam?.toLowerCase() || '';
      const awayTeam = g.awayTeam?.toLowerCase() || '';
      const isRelevantTeam = homeTeam.includes('neuenstadt') || homeTeam.includes('pitbull') ||
        awayTeam.includes('neuenstadt') || awayTeam.includes('pitbull');

      if (!isRelevantTeam) return false;

      // 3. Filter out future games
      try {
        const [datePart, timePart] = g.date.split(', ');
        if (!datePart) return true; // keep if can't parse

        const [day, month, year] = datePart.split('.').map(Number);
        const [hour, minute] = (timePart || '00:00').split(':').map(Number);

        const gameDate = new Date(year, month - 1, day, hour, minute);
        return gameDate <= now;
      } catch (e) {
        return true; // keep if can't parse
      }
    });
  }, [games]);

  // Get the last game (TSV Neuenstadt game with highest tsv_game_number that has a result)
  const lastGame = useMemo(() => {
    return relevantGames[0] || null;
  }, [relevantGames]);

  // Parse the final score into home and away scores
  const { homeScore, awayScore, homeTeam, awayTeam } = useMemo(() => {
    if (!lastGame) return {
      homeScore: '0',
      awayScore: '0',
      homeTeam: 'Pitbulls',
      awayTeam: 'Gegner'
    };

    const homeTeam = lastGame.homeTeam || 'Heimmannschaft';
    const awayTeam = lastGame.awayTeam || 'Gastmannschaft';

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

    map.forEach((logs: PlayerGameLog[]) => {
      logs.sort((a, b) => b.gameNumber - a.gameNumber);
    });

    return map;
  }, [gameLogs]);

  // Calculate Win/Loss Streak
  const streak = useMemo(() => {
    if (relevantGames.length === 0) return null;

    let currentStreak = 0;
    let type: 'win' | 'loss' | null = null;

    for (const game of relevantGames) {
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
  }, [relevantGames]);

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

    const playerStats = players.map(player => {
      if (player.firstName === 'Gesamtsumme' || !player.firstName) return null;

      const playerGames = logsByPlayer.get(player.id) || [];
      const totalPoints = playerGames.reduce((sum, game) => sum + (game.points || 0), 0);
      const gamesPlayed = playerGames.length;

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
        totalPoints,
        gamesPlayed
      };
    }).filter(Boolean);

    return [...playerStats]
      .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
      .slice(0, 3);
  }, [players, logsByPlayer, gameLogs.length]);

  // ---- Editorial-spezifische Ableitungen ----
  const homeIsPitbulls = teamIsPitbulls(homeTeam);
  const opponent = homeIsPitbulls ? awayTeam : homeTeam;
  const seasonName = selectedSeason?.name ?? '2025/26';
  const form = relevantGames.slice(0, 5);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-5xl px-4 pt-10 space-y-10 animate-fade-in">
          <div className="h-3 w-48 bg-muted rounded skeleton-pulse" />
          <div className="h-32 md:h-48 w-3/4 bg-muted rounded-lg skeleton-pulse" />
          <div className="h-24 w-full bg-muted rounded-lg skeleton-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
            <div className="space-y-6">
              {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-muted rounded skeleton-pulse" />)}
            </div>
            <div className="aspect-[4/5] w-full bg-muted rounded-lg skeleton-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-destructive text-center py-8">
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
          <div className="text-center py-8 text-muted-foreground">Keine Spieldaten verfügbar.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BirthdayNotification players={players} />

      <div className="relative">
        {/* Dezenter blauer Verlauf oben — in beiden Themes zurückhaltend */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_55%_at_70%_-10%,hsl(var(--brand-blue)/0.12),transparent_60%)]" />

        <div className="relative z-10 container mx-auto max-w-5xl px-4 pb-20">
          {/* Vertikale Randspalte */}
          <div className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 origin-center -rotate-90 z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground/40 whitespace-nowrap">
              TSV Neuenstadt · Pitbulls · Saison {seasonName}
            </span>
          </div>

          {/* Kopfzeile */}
          <div className="pt-10 flex items-baseline justify-between border-b-2 border-border pb-3">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Pitbulls Stats Hub</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Ausgabe · Spieltag {lastGame.gameNumber}</span>
          </div>

          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="pt-12 pb-5">
              <span className="inline-block bg-brand-orange px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-white">
                {lastGame.date} — gegen {opponent}
              </span>
            </div>

            {/* Hero: der Endstand selbst ist die Riesen-Typografie */}
            <div className="font-display flex items-baseline gap-3 md:gap-8 leading-[0.8]">
              <span className={`text-[clamp(4.5rem,15vw,12rem)] font-black tabular-nums tracking-tighter ${homeIsPitbulls ? 'text-brand-orange' : 'text-foreground'}`}>{homeScore}</span>
              <span className="text-[clamp(2rem,6vw,5rem)] font-light text-muted-foreground/40">:</span>
              <span className={`text-[clamp(4.5rem,15vw,12rem)] font-black tabular-nums tracking-tighter ${homeIsPitbulls ? 'text-foreground' : 'text-brand-orange'}`}>{awayScore}</span>
            </div>

            {/* Meta-Leiste: Teams + Serie + Button */}
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-border py-4">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
                <span className={homeIsPitbulls ? 'text-brand-orange' : 'text-muted-foreground'}>●</span> {homeTeam}
              </span>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
                <span className={homeIsPitbulls ? 'text-muted-foreground' : 'text-brand-orange'}>●</span> {awayTeam}
              </span>
              {streak && (
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground md:ml-auto">
                  Serie <span className={`text-lg tracking-tight ${streak.type === 'win' ? 'text-brand-blue-bright' : 'text-destructive'}`}>{streak.count}{streak.type === 'win' ? 'W' : 'L'}</span>
                </span>
              )}
              <button
                onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground border-b-2 border-brand-orange pb-1 hover:text-brand-orange transition-colors"
              >
                Spielbericht lesen →
              </button>
            </div>

            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {homeTeam} gegen {awayTeam} — alle Zahlen, Trends und Leistungsträger des Spieltags.
              Mehr als nur Zahlen: die Geschichte der Saison {seasonName}, erzählt in Daten.
            </p>
          </motion.div>

          {/* Zwei Spalten: Performer-Liste + Team-Foto */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 pt-14">
            {/* Nummerierte Editorial-Liste */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-8">
                Leistungsträger <span className="text-brand-orange">/ Punkte pro Spiel</span>
              </h3>
              <ol>
                {topPerformers.map((p, idx) => (
                  <li
                    key={p.id}
                    onClick={() => navigate(`/players/${p.id}`)}
                    className="group cursor-pointer border-b border-border py-6 first:pt-0 flex items-baseline gap-6 hover:border-brand-orange/60 transition-colors"
                  >
                    <span className="text-sm font-black tabular-nums text-brand-blue w-8">0{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground group-hover:translate-x-2 transition-transform duration-300 truncate">
                        {p.firstName} <span className="text-muted-foreground group-hover:text-brand-orange transition-colors">{p.lastName}</span>
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">
                        {p.totalPoints} Pkt · {p.gamesPlayed} Spiele · FW {p.freeThrowPercentage}
                      </div>
                    </div>
                    <span className="font-display text-3xl font-black tabular-nums text-brand-orange">{p.pointsPerGame.toFixed(1)}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => navigate('/players')}
                className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
              >
                → Alle Spieler ansehen
              </button>

              {/* Aufsteiger der Woche */}
              {risingStars.length > 0 && (
                <div className="mt-14">
                  <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-6">
                    <Flame className="w-3.5 h-3.5 text-brand-orange" />
                    Aufsteiger <span className="text-brand-orange">/ der Woche</span>
                  </h3>
                  <div className="space-y-3">
                    {risingStars.map((player) => (
                      <div
                        key={player.playerId}
                        onClick={() => navigate(`/players/${player.playerId}`)}
                        className="group cursor-pointer flex items-center gap-4 border-l-2 border-brand-orange/40 pl-4 py-2 hover:border-brand-orange transition-colors"
                      >
                        <img src={player.image} alt="" className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black uppercase tracking-tight text-foreground truncate">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange">
                            +{player.improvementCount} Verbesserungen
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Team-Foto mit Blau-Overlay + Orange-Kante */}
            <div>
              <div className="relative border-l-4 border-brand-orange overflow-hidden">
                <img
                  src={`${BASE_PATH}/photos/Team-01.jpeg`}
                  alt="Team TSV Neuenstadt Pitbulls"
                  className="w-full aspect-[4/5] object-cover grayscale contrast-110"
                />
                {/* Festes dunkles TSV-Blau — als Foto-Overlay in beiden Themes gewollt dunkel */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16306b]/90 via-[#16306b]/30 to-transparent mix-blend-multiply" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-orange-bright">Das Team</p>
                  <p className="font-display text-2xl font-black uppercase tracking-tight text-white">Pitbulls {seasonName}</p>
                </div>
              </div>
              {/* Form als Textzeile */}
              <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                <span>Form</span>
                <span className="tracking-[0.5em] text-sm">
                  {form.map(g => (
                    <span key={g.gameNumber} className={gameIsWin(g) ? 'text-brand-orange' : 'text-muted-foreground/40'}>
                      {gameIsWin(g) ? 'W' : 'L'}
                    </span>
                  ))}
                </span>
              </div>

              {/* Schnellzugriff */}
              <nav className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { label: 'Spielplan', to: '/spielplan' },
                  { label: 'Statistiken', to: '/stats' },
                  { label: 'Ergebnisse', to: '/games' },
                  { label: 'Videos', to: '/videos' },
                ].map(l => (
                  <button
                    key={l.to}
                    onClick={() => navigate(l.to)}
                    className="border border-border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-brand-orange/60 transition-colors text-left"
                  >
                    {l.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Editorial-Schlusszeile */}
          <div className="mt-20 border-t-2 border-border pt-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <p className="font-display text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              <span className="text-muted-foreground">Mehr als</span><br />
              <span className="text-foreground">nur Zahlen<span className="text-brand-orange">.</span></span>
            </p>
            <nav className="flex gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              {[
                { label: 'News', to: '/news' },
                { label: 'Awards', to: '/awards' },
                { label: 'Playbook', to: '/playbook' },
              ].map(l => (
                <button key={l.to} onClick={() => navigate(l.to)} className="hover:text-brand-orange transition-colors">
                  {l.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mannschafts-Archiv */}
          <div id="team-gallery" className="pt-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-border" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Mannschafts-Archiv</h3>
              <div className="h-px flex-1 bg-border" />
            </div>
            <TeamGallery />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
