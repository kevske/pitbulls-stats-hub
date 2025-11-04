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
                    <div className="mt-4 grid grid-cols-3 text-center text-sm text-gray-500">
                      <div>1. Q: {game.q1Score}</div>
                      <div>Halbzeit: {game.halfTimeScore}</div>
                      <div>3. Q: {game.q3Score}</div>
                    </div>
                  </div>
                  
                  {/* Chart - shown on right side on desktop, below scores on mobile */}
                  <div className="mt-4 md:mt-0 md:w-1/2 lg:w-2/5 xl:w-1/3">
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
  // Hide chart if no score data is available
  if (!game.q1Score && !game.halfTimeScore && !game.q3Score && !game.finalScore) {
    return null;
  }

  const chartData = useMemo(() => {
    const parseScore = (score: string, isHome: boolean) => {
      if (!score) return 0;
      const [home, away] = score.split('-').map(Number);
      return isHome ? home : away;
    };

    const isHomeGame = game.homeTeam?.toLowerCase().includes('neuenstadt') || 
                      game.homeTeam?.toLowerCase().includes('pitbulls');

    const tsvScores = [
      { period: 'Q1', score: parseScore(game.q1Score, isHomeGame) },
      { period: 'HT', score: parseScore(game.halfTimeScore, isHomeGame) },
      { period: 'Q3', score: parseScore(game.q3Score, isHomeGame) },
      { period: 'FT', score: parseScore(game.finalScore, isHomeGame) }
    ];

    const opponentScores = [
      { period: 'Q1', score: parseScore(game.q1Score, !isHomeGame) },
      { period: 'HT', score: parseScore(game.halfTimeScore, !isHomeGame) },
      { period: 'Q3', score: parseScore(game.q3Score, !isHomeGame) },
      { period: 'FT', score: parseScore(game.finalScore, !isHomeGame) }
    ];

    return tsvScores.map((tsv, index) => ({
      period: tsv.period,
      'TSV Neuenstadt': tsv.score,
      'Gegner': opponentScores[index].score
    }));
  }, [game]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="period" 
          tick={{ fill: '#666', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          domain={[0, 'dataMax + 10']}
          tick={{ fill: '#666', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={30}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        <Legend />
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
  );
};

export default Games;
