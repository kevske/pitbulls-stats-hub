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
        <h1 className="text-3xl font-bold mb-6">Spielplan</h1>
        
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
                <div className="grid grid-cols-3 items-center">
                  <div className="text-right">
                    <div className="font-medium">{game.homeTeam || 'Pitbulls'}</div>
                    <div className="text-sm text-gray-500">Heim</div>
                  </div>
                  <div className="text-2xl font-bold mx-4 text-center">
                    {game.finalScore ? (
                      <>
                        <div className="text-3xl">
                          {game.finalScore.split('-')[0]?.trim() || '0'} : {game.finalScore.split('-')[1]?.trim() || '0'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {game.finalScore}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">vs</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{game.awayTeam || 'Gegner'}</div>
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
