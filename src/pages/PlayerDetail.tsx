import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { player, gameLogs } = usePlayerStats(id);
  const navigate = useNavigate();

  if (!player) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800">Spieler nicht gefunden</h2>
            <p className="text-gray-500 mt-2">Der angeforderte Spieler konnte nicht gefunden werden.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const calculateTotal = (stat: keyof typeof gameLogs[0]) => {
    return gameLogs.reduce((sum, log) => sum + (log[stat] as number), 0);
  };

  const totalPoints = calculateTotal('points');

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <img
                  src={player.imageUrl || '/placeholder-player.png'}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-auto rounded-lg shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-player.png';
                  }}
                />
              </div>
              <div className="w-full md:w-2/3">
                <h1 className="text-3xl font-bold mb-2">
                  {player.firstName} {player.lastName}
                </h1>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <StatCard label="Spiele" value={player.gamesPlayed.toString()} />
                  <StatCard label="Punkte/Spiel" value={player.pointsPerGame.toFixed(1)} />
                  <StatCard label="3-Punkte/Spiel" value={player.threePointersPerGame.toFixed(1)} />
                  <StatCard label="Freiwurfquote" value={player.freeThrowPercentage} />
                  <StatCard label="Fouls/Spiel" value={player.foulsPerGame.toFixed(1)} />
                  <StatCard label="Gesamtpunkte" value={totalPoints.toString()} />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Spielstatistiken</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border text-left">Spieltag</th>
                      <th className="py-2 px-4 border">Min</th>
                      <th className="py-2 px-4 border">Punkte</th>
                      <th className="py-2 px-4 border">2P</th>
                      <th className="py-2 px-4 border">3P</th>
                      <th className="py-2 px-4 border">FT</th>
                      <th className="py-2 px-4 border">Fouls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameLogs.map((game) => (
                      <tr key={game.gameNumber} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border">{game.gameNumber}</td>
                        <td className="py-2 px-4 border text-center">{game.minutesPlayed}</td>
                        <td className="py-2 px-4 border text-center font-medium">{game.points}</td>
                        <td className="py-2 px-4 border text-center">{game.twoPointers}</td>
                        <td className="py-2 px-4 border text-center">{game.threePointers}</td>
                        <td className="py-2 px-4 border text-center">
                          {game.freeThrowsMade}/{game.freeThrowAttempts}
                        </td>
                        <td className="py-2 px-4 border text-center">{game.fouls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default PlayerDetail;
