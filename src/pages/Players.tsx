import React, { useMemo } from 'react';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';

const Players: React.FC = () => {
  const { players, gameLogs, loading, error, games } = useStats();

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

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map(g => g.gameNumber)) : 0;
  }, [games]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Spielerstatistiken</h1>
          {latestGameNumber > 1 && (
            <div className="text-sm text-muted-foreground flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Letzte Spieltag: {latestGameNumber}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players
            .filter(player => player.firstName && player.firstName.trim() !== '' && player.gamesPlayed > 0)
            .map((player) => {
              return (
                <div key={player.id} className="h-full">
                  <PlayerCard 
                    player={player}
                    gameLogs={gameLogs}
                    currentGameNumber={latestGameNumber}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </Layout>
  );
};

// Helper component for displaying stats (kept for reference, not used in current implementation)
const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col bg-gray-50 p-2 rounded">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Players;
