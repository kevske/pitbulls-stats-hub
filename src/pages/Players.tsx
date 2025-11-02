import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';

const Players: React.FC = () => {
  const { players, loading, error } = useStats();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Lade Spielerdaten...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden der Spielerdaten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Spielerstatistiken</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Card 
              key={player.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/players/${player.id}`)}
            >
              <CardHeader className="flex flex-row items-center space-x-4 p-4">
                <img
                  src={player.imageUrl}
                  alt={player.firstName}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-player.png';
                  }}
                />
                <div>
                  <CardTitle className="text-xl">
                    {player.firstName} {player.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {player.gamesPlayed} Spiele
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <StatItem label="Punkte/Spiel" value={player.pointsPerGame.toFixed(1)} />
                  <StatItem label="3-Punkte/Spiel" value={player.threePointersPerGame.toFixed(1)} />
                  <StatItem label="Freiwurfquote" value={player.freeThrowPercentage} />
                  <StatItem label="Fouls/Spiel" value={player.foulsPerGame.toFixed(1)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col bg-gray-50 p-2 rounded">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Players;
