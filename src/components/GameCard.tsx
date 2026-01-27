import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { GameStats, PlayerGameLog, PlayerStats } from '@/types/stats';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GameCardProps {
  game: GameStats;
  topScorers: PlayerGameLog[];
  playerMap: Map<string, PlayerStats>;
}

const GameCard: React.FC<GameCardProps> = React.memo(({ game, topScorers, playerMap }) => {
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation if the event target is not the card itself (e.g. inner buttons)
    if (e.target !== e.currentTarget) return;

    if (e.key === 'Enter' || e.key === ' ') {
      // Prevent scrolling for Space
      if (e.key === ' ') {
        e.preventDefault();
      }
      navigate(`/games/${game.gameNumber}`);
    }
  };

  const formatGameDate = (dateString: string) => {
    try {
      // Handle different date formats from Supabase
      let date: Date;

      // Try ISO format first (from Supabase)
      if (dateString.includes('T') || dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        // Try DD.MM.YYYY HH:mm format (old format)
        date = parse(dateString, 'dd.MM.yyyy HH:mm', new Date());
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }

      return format(date, 'EEEE, dd.MM.yyyy - HH:mm', { locale: de });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => navigate(`/games/${game.gameNumber}`)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Left side - Game details, teams, and top scorers */}
          <div className="flex-1 space-y-4">
            {/* Game details */}
            <div className="space-y-1">
              <div className="text-lg font-semibold text-foreground">
                Spieltag {game.gameNumber}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatGameDate(game.date)}
              </div>
            </div>

            {/* Teams and score */}
            <div className="py-2">
              <div className="hidden md:grid grid-cols-12 items-center gap-4">
                <div className="col-span-5 text-right">
                  <div className="font-medium text-base">{game.homeTeam || 'Pitbulls'}</div>
                  <div className="text-sm text-muted-foreground">Heim</div>
                </div>

                <div className="col-span-2">
                  {game.finalScore ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold">
                        {game.finalScore.split('-')[0].trim()}
                      </span>
                      <span className="text-xl">:</span>
                      <span className="text-3xl font-bold">
                        {game.finalScore.split('-')[1]?.trim()}
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl text-muted-foreground text-center">vs</div>
                  )}
                </div>

                <div className="col-span-5">
                  <div className="font-medium text-base">{game.awayTeam || 'Gegner'}</div>
                  <div className="text-sm text-muted-foreground">Gast</div>
                </div>
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{game.homeTeam || 'Pitbulls'}</div>
                  <div className="text-sm text-muted-foreground">Heim</div>
                </div>

                <div className="text-center py-1">
                  {game.finalScore ? (
                    <div className="text-2xl font-bold">
                      {game.finalScore}
                    </div>
                  ) : (
                    <div className="text-xl text-muted-foreground">vs</div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{game.awayTeam || 'Gegner'}</div>
                  <div className="text-sm text-muted-foreground">Gast</div>
                </div>

                {/* Mobile Top Scorers */}
                {topScorers.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-medium text-foreground mb-1">Topscorer</div>
                    <div className="flex justify-center gap-3">
                      {topScorers.slice(0, 2).map((player) => {
                        const playerData = playerMap.get(player.playerId);
                        const playerName = playerData ? `${playerData.firstName} ${playerData.lastName}` : 'Unbekannt';
                        return (
                          <div key={player.playerId} className="text-center">
                            <div className="text-xs font-medium">{playerName.split(' ')[0]}</div>
                            <div className="text-sm font-bold text-primary">{player.points}P</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top scorers - Desktop only */}
            <div className="hidden md:block pt-2">
              <div className="text-sm font-medium text-foreground mb-2">Topscorer</div>
              <div className="grid grid-cols-3 gap-2">
                {topScorers.slice(0, 3).map((player) => {
                  const playerData = playerMap.get(player.playerId);
                  const playerName = playerData ? `${playerData.firstName} ${playerData.lastName}` : 'Unbekannt';
                  const avatarSrc = playerData?.imageUrl || '/players/placeholder-player.png';

                  return (
                    <div key={player.playerId} className="bg-muted p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-10 w-10 border-2 border-primary">
                          <AvatarImage src={avatarSrc} alt={playerName} />
                          <AvatarFallback>
                            {playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{playerName.split(' ')[0]}</div>
                          <div className="text-primary font-bold">{player.points} P</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video Link - if available */}
            {(game.youtubeLink || (game.videoData && game.videoData.length > 0)) && (
              <div className="pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video-editor?game=${game.gameNumber}`);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  🎥 Video ansehen
                </button>
              </div>
            )}
          </div>

          {/* Right side - Chart */}
          <div className="mt-4 md:mt-0 md:w-2/5 lg:w-1/3">
            <div className="h-48 md:h-full">
              <ScoreProgressionChart game={game} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GameCard.displayName = 'GameCard';

interface ScoreProgressionChartProps {
  game: GameStats;
}

const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({ game }) => {
  // Hide chart if no score data is available
  if (!game.q1Score && !game.halfTimeScore && !game.q3Score && !game.finalScore) {
    return null;
  }

  const chartData = useMemo(() => {
    const parseScore = (score: string) => {
      if (!score) return { home: 0, away: 0 };
      // Handle both '14:14' and '14 - 14' formats
      const [home, away] = score.split(/[:\-]/).map(s => parseInt(s.trim()));
      return { home: isNaN(home) ? 0 : home, away: isNaN(away) ? 0 : away };
    };

    const isHomeGame = game.homeTeam?.toLowerCase().includes('neuenstadt') ||
      game.homeTeam?.toLowerCase().includes('pitbulls');

    const q1 = parseScore(game.q1Score);
    const ht = parseScore(game.halfTimeScore);
    const q3 = parseScore(game.q3Score);
    const ft = parseScore(game.finalScore);

    return [
      {
        period: 'Q1',
        'TSV Neuenstadt': isHomeGame ? q1.home : q1.away,
        'Gegner': isHomeGame ? q1.away : q1.home
      },
      {
        period: 'HT',
        'TSV Neuenstadt': isHomeGame ? ht.home : ht.away,
        'Gegner': isHomeGame ? ht.away : ht.home
      },
      {
        period: 'Q3',
        'TSV Neuenstadt': isHomeGame ? q3.home : q3.away,
        'Gegner': isHomeGame ? q3.away : q3.home
      },
      {
        period: 'FT',
        'TSV Neuenstadt': isHomeGame ? ft.home : ft.away,
        'Gegner': isHomeGame ? ft.away : ft.home
      }
    ];
  }, [game]);

  // Add starting point at 0
  const chartDataWithStart = [
    { period: 'Start', 'TSV Neuenstadt': 0, 'Gegner': 0 },
    ...chartData
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithStart}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: '#666', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.max(50, dataMax + 5)]}
            tick={{ fill: '#666', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={25}
            tickCount={6}
            tickFormatter={(value) => Math.floor(value) === value ? value.toString() : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '8px 12px',
              fontSize: '13px'
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            formatter={(value: number) => [value, 'Punkte']}
          />
          <Line
            type="monotone"
            dataKey="TSV Neuenstadt"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Gegner"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GameCard;
