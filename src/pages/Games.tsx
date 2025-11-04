import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/Layout';

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
              <CardHeader>
                <CardTitle className="text-lg">
                  Spieltag {game.gameNumber} • {formatGameDate(game.date)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Team names row - only on mobile */}
                <div className="md:hidden flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-right flex-1 pr-2 line-clamp-2">
                    {game.homeTeam || 'Pitbulls'}
                    <div className="text-xs text-gray-500">Heim</div>
                  </div>
                  <div className="px-2 text-sm font-medium">vs</div>
                  <div className="text-sm font-medium text-left flex-1 pl-2 line-clamp-2">
                    {game.awayTeam || 'Gegner'}
                    <div className="text-xs text-gray-500">Gast</div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Games;
