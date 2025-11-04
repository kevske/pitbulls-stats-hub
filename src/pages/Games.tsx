import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Games: React.FC = () => {
  const { games, loading, error } = useStats();
  const navigate = useNavigate();

  const formatGameDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'dd.MM.yyyy HH:mm', new Date());
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
        <h1 className="text-3xl font-bold mb-6">Spiele</h1>
        
        {/* YouTube Video Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Letztes Spiel</h2>
          <div className="aspect-w-16 aspect-h-9 w-full max-w-4xl mx-auto">
            <iframe 
              className="w-full h-[315px] rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/videoseries?si=yV-ubstdCCUPmekk&amp;list=PLo9Gj2rLRK5xZB-MKl2i8T1gEyCti4Y71" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen>
            </iframe>
          </div>
        </div>
        
        <div className="space-y-4">
          {games.map((game) => (
            <Card 
              key={game.gameNumber}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/games/${game.gameNumber}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Spieltag {game.gameNumber} • {formatGameDate(game.date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="md:flex md:gap-6">
                  <div className="md:flex-1">
                    {/* Team names row - only on mobile */}
                    <div className="md:hidden flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-right flex-1 pr-2 line-clamp-2">
                    {game.homeTeam || 'Pitbulls'}
                  </div>
                  <div className="px-1 text-sm font-medium">vs</div>
                  <div className="text-sm font-medium text-left flex-1 pl-2 line-clamp-2">
                    {game.awayTeam || 'Gegner'}
                  </div>
                </div>
                
                {/* Score row */}
                <div className="flex justify-center my-2">
                  <div className="text-3xl font-bold text-center">
                    {game.finalScore ? (
                      <div>
                        {(() => {
                          const scoreParts = game.finalScore.split('-');
                          if (scoreParts.length === 2) {
                            const homeScore = scoreParts[0].trim();
                            const awayScore = scoreParts[1].trim();
                            return (
                              <div className="flex items-center justify-center gap-2">
                                <span className="md:hidden">{homeScore}</span>
                                <span className="hidden md:inline-block w-16 text-right">{homeScore}</span>
                                <span>:</span>
                                <span className="md:hidden">{awayScore}</span>
                                <span className="hidden md:inline-block w-16 text-left">{awayScore}</span>
                              </div>
                            );
                          }
                          return game.finalScore;
                        })()}
                      </div>
                    ) : (
                      <div className="text-gray-400">vs</div>
                    )}
                  </div>
                </div>
                
                {/* Desktop team names - hidden on mobile */}
                <div className="hidden md:grid grid-cols-3 items-center">
                  <div className="text-right pr-4">
                    <div className="font-medium line-clamp-2">{game.homeTeam || 'Pitbulls'}</div>
                    <div className="text-sm text-gray-500">Heim</div>
                  </div>
                  <div></div>
                  <div className="pl-4">
                    <div className="font-medium line-clamp-2">{game.awayTeam || 'Gegner'}</div>
                    <div className="text-sm text-gray-500">Gast</div>
                  </div>
                </div>
                  </div>
                  
                  {/* Chart - shown on right side on desktop, below scores on mobile */}
                  <div className="mt-4 md:mt-0 md:w-2/5 lg:w-1/3">
                    <div className="h-64">
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

export default Games;
