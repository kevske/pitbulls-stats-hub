import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameStats, PlayerGameLog, PlayerStats } from '@/types/stats';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatGameDate } from '@/utils/spielplanUtils';
import { useModernTheme } from '@/contexts/ModernThemeContext';

// Vision 2026 v2 — "Editorial Court": theme-aware, Vereinsfarben.
const teamIsPitbulls = (team?: string) => {
  const t = (team ?? '').toLowerCase();
  return t.includes('neuenstadt') || t.includes('pitbull');
};

interface GameCardProps {
  game: GameStats;
  topScorers: PlayerGameLog[];
  playerMap: Map<string, PlayerStats>;
}

const GameCard: React.FC<GameCardProps> = React.memo(({ game, topScorers, playerMap }) => {
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') e.preventDefault();
      navigate(`/games/${game.gameNumber}`);
    }
  };

  // Score + Win/Loss aus Pitbulls-Sicht
  const { homeScore, awayScore, homeIsPb, pbWin, hasScore } = useMemo(() => {
    const parts = (game.finalScore ?? '').split(/[-:]/).map(s => s.trim());
    const h = parseInt(parts[0], 10);
    const a = parseInt(parts[1], 10);
    const homeIsPb = teamIsPitbulls(game.homeTeam);
    const valid = !isNaN(h) && !isNaN(a);
    return {
      homeScore: parts[0] ?? '',
      awayScore: parts[1] ?? '',
      homeIsPb,
      pbWin: valid ? (homeIsPb ? h > a : a > h) : false,
      hasScore: valid,
    };
  }, [game.finalScore, game.homeTeam]);

  // Akzentkante: Sieg = Orange, Niederlage = gedämpft
  const accent = !hasScore ? 'border-l-border' : pbWin ? 'border-l-brand-orange' : 'border-l-muted-foreground/30';

  return (
    <div
      className={`group glass-card border-l-4 ${accent} cursor-pointer transition-all duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      onClick={() => navigate(`/games/${game.gameNumber}`)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Left: Spieldetails, Teams, Topscorer */}
          <div className="flex-1 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm font-black uppercase tracking-[0.2em] text-foreground">
                Spieltag {game.gameNumber}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {formatGameDate(game.date)}
              </span>
            </div>

            {/* Teams + Score */}
            <div className="border-y border-border py-3">
              <div className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-5 text-right min-w-0">
                  <div className="font-black uppercase tracking-tight text-sm md:text-base truncate text-foreground">{game.homeTeam || 'Pitbulls'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Heim</div>
                </div>
                <div className="col-span-2">
                  {hasScore ? (
                    <div className="flex items-center justify-center gap-1.5 font-display">
                      <span className={`text-2xl md:text-3xl font-black tabular-nums ${homeIsPb ? 'text-brand-orange' : 'text-foreground'}`}>{homeScore}</span>
                      <span className="text-base text-muted-foreground/40">:</span>
                      <span className={`text-2xl md:text-3xl font-black tabular-nums ${homeIsPb ? 'text-foreground' : 'text-brand-orange'}`}>{awayScore}</span>
                    </div>
                  ) : (
                    <div className="text-lg text-muted-foreground/50 text-center italic font-black">vs</div>
                  )}
                </div>
                <div className="col-span-5 min-w-0">
                  <div className="font-black uppercase tracking-tight text-sm md:text-base truncate text-foreground">{game.awayTeam || 'Gegner'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gast</div>
                </div>
              </div>
            </div>

            {/* Topscorer */}
            {topScorers.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Topscorer
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {topScorers.slice(0, 3).map((player, index) => {
                    const playerData = playerMap.get(player.playerId);
                    const playerName = playerData ? `${playerData.firstName} ${playerData.lastName}` : 'Unbekannt';
                    const avatarSrc = playerData?.imageUrl || '/players/placeholder-player.png';
                    return (
                      <div key={player.playerId} className="flex items-center gap-2 min-w-0">
                        <Avatar className={`h-9 w-9 border-2 ${index === 0 ? 'border-brand-orange' : 'border-border'}`}>
                          <AvatarImage src={avatarSrc} alt={playerName} className="grayscale" />
                          <AvatarFallback className="text-[10px] font-black">
                            {playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-tight truncate text-foreground">{playerName.split(' ')[0]}</div>
                          <div className="font-display font-black text-base leading-none text-brand-orange">
                            {player.points}<span className="text-[9px] font-bold tracking-normal text-muted-foreground uppercase ml-0.5">Pkt</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(game.youtubeLink || (game.videoData && game.videoData.length > 0)) && (
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video-editor?game=${game.gameNumber}`);
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  🎥 Video ansehen
                </button>
              </div>
            )}
          </div>

          {/* Right: Verlaufs-Chart */}
          <div className="mt-4 md:mt-0 md:w-2/5 lg:w-1/3">
            <div className="h-48 md:h-full">
              <ScoreProgressionChart game={game} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GameCard.displayName = 'GameCard';

interface ScoreProgressionChartProps {
  game: GameStats;
}

const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({ game }) => {
  const { theme } = useModernTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    const parseScore = (score: string) => {
      if (!score) return { home: 0, away: 0 };
      const [home, away] = score.split(/[:-]/).map(s => parseInt(s.trim()));
      return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
    };

    const isHomeGame = game.homeTeam?.toLowerCase().includes('neuenstadt') ||
      game.homeTeam?.toLowerCase().includes('pitbulls');

    const q1 = parseScore(game.q1Score);
    const ht = parseScore(game.halfTimeScore);
    const q3 = parseScore(game.q3Score);
    const ft = parseScore(game.finalScore);

    return [
      { period: 'Q1', 'TSV Neuenstadt': isHomeGame ? q1.home : q1.away, 'Gegner': isHomeGame ? q1.away : q1.home },
      { period: 'HT', 'TSV Neuenstadt': isHomeGame ? ht.home : ht.away, 'Gegner': isHomeGame ? ht.away : ht.home },
      { period: 'Q3', 'TSV Neuenstadt': isHomeGame ? q3.home : q3.away, 'Gegner': isHomeGame ? q3.away : q3.home },
      { period: 'FT', 'TSV Neuenstadt': isHomeGame ? ft.home : ft.away, 'Gegner': isHomeGame ? ft.away : ft.home }
    ];
  }, [game]);

  // Hide chart if no score data is available
  if (!game.q1Score && !game.halfTimeScore && !game.q3Score && !game.finalScore) {
    return null;
  }

  const chartDataWithStart = [
    { period: 'Start', 'TSV Neuenstadt': 0, 'Gegner': 0 },
    ...chartData
  ];

  // Theme-aware Chart-Farben (Vereinsfarben: TSV = Orange, Gegner = gedämpft)
  const gridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const tickFill = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';
  const tsvColor = '#E87722';
  const oppColor = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartDataWithStart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="period" tick={{ fill: tickFill, fontSize: 12 }} tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
          <YAxis
            domain={[0, (dataMax: number) => Math.max(50, dataMax + 5)]}
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={25}
            tickCount={6}
            tickFormatter={(value) => Math.floor(value) === value ? value.toString() : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0A1428' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              padding: '8px 12px',
              fontSize: '13px',
              color: isDark ? '#fff' : '#0A1428',
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#fff' : '#0A1428' }}
            formatter={(value: number) => [value, 'Punkte']}
          />
          <Line type="monotone" dataKey="TSV Neuenstadt" stroke={tsvColor} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Gegner" stroke={oppColor} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GameCard;
