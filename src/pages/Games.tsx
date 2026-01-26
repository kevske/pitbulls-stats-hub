import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useStats } from '@/contexts/StatsContext';
import { GameStats } from '@/types/stats';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Settings } from 'lucide-react';

const Games: React.FC = () => {
  const { games, gameLogs, players, loading, error } = useStats();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>('TSV Neuenstadt');
  const [hideUpcoming, setHideUpcoming] = useState<boolean>(true); // Hide upcoming games by default

  // Extract unique teams from games data
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    games.forEach(game => {
      if (game.homeTeam) teams.add(game.homeTeam);
      if (game.awayTeam) teams.add(game.awayTeam);
    });
    return Array.from(teams).sort();
  }, [games]);

  // Filter games based on selected team and upcoming games toggle
  const filteredGames = useMemo(() => {
    let filtered = games.filter(game =>
      game.homeTeam === selectedTeam || game.awayTeam === selectedTeam
    );

    // Filter out upcoming games if toggle is enabled
    if (hideUpcoming) {
      filtered = filtered.filter(game => {
        // First check if game has a final score (indicating it's been played)
        if (!game.finalScore || game.finalScore.trim() === '' || game.finalScore === '-' || game.finalScore === '-:-') {
          return false; // No valid score means game hasn't been played
        }

        // Additionally check if the game date is in the past or today
        try {
          // Format is typically "dd.MM.yyyy, HH:mm" or similar from de-DE locale
          const [datePart, timePart] = game.date.split(', ');

          let gameDate: Date;
          if (datePart && timePart) {
            const [day, month, year] = datePart.split('.').map(Number);
            const [hour, minute] = timePart.split(':').map(Number);
            gameDate = new Date(year, month - 1, day, hour, minute);
          } else {
            // Fallback to existing logic if format differs
            if (game.date.includes('T') || game.date.includes('-')) {
              gameDate = new Date(game.date);
            } else {
              gameDate = parse(game.date, 'dd.MM.yyyy HH:mm', new Date());
            }
          }

          // Check if date is valid and not in the future
          if (isNaN(gameDate.getTime())) {
            return true; // If we can't parse the date, include it (it has a score, so assume played)
          }

          const now = new Date();
          // Include games that have already happened or are happening today
          return gameDate <= now;
        } catch (e) {
          return true; // If date parsing fails, include it
        }
      });
    }

    return filtered;
  }, [games, selectedTeam, hideUpcoming]);

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Lade Spielplan...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden des Spielplans: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Spiele</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-upcoming"
                checked={hideUpcoming}
                onCheckedChange={(checked) => setHideUpcoming(checked as boolean)}
              />
              <label
                htmlFor="hide-upcoming"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Zukünftige Spiele ausblenden
              </label>
            </div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Team auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => navigate('/games/minutes')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <Clock className="h-4 w-4" />
              Minuten verwalten
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <Card
              key={game.gameNumber}
              className="hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => navigate(`/games/${game.gameNumber}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/games/${game.gameNumber}`);
                }
              }}
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
                        {gameLogs
                          .filter(log => log.gameNumber === game.gameNumber)
                          .sort((a, b) => b.points - a.points)
                          .slice(0, 2).length > 0 && (
                            <div className="pt-2">
                              <div className="text-xs font-medium text-foreground mb-1">Topscorer</div>
                              <div className="flex justify-center gap-3">
                                {gameLogs
                                  .filter(log => log.gameNumber === game.gameNumber)
                                  .sort((a, b) => b.points - a.points)
                                  .slice(0, 2)
                                  .map((player) => {
                                    const playerData = players.find(p => p.id === player.playerId);
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
                        {gameLogs
                          .filter(log => log.gameNumber === game.gameNumber)
                          .sort((a, b) => b.points - a.points)
                          .slice(0, 3)
                          .map((player, index) => {
                            const playerData = players.find(p => p.id === player.playerId);
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
          ))}
        </div>
      </div>
    </Layout>
  );
};

interface ScoreProgressionChartProps {
  game: GameStats;
}

const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({ game }) => {
  const chartData = useMemo(() => {
    const parseScore = (score: string) => {
      if (!score) return { home: 0, away: 0 };
      // Handle both '14:14' and '14 - 14' formats
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

  // Hide chart if no score data is available
  if (!game.q1Score && !game.halfTimeScore && !game.q3Score && !game.finalScore) {
    return null;
  }

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

export default Games;
