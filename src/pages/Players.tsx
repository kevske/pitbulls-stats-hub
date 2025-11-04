import React, { useMemo, useState } from 'react';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import { Home, Plane, Filter } from 'lucide-react';

type GameFilter = 'all' | 'home' | 'away';

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

  const [gameFilter, setGameFilter] = useState<GameFilter>('all');

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map(g => g.gameNumber)) : 0;
  }, [games]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Filter Toggle - Higher z-index to appear above header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            <button
              onClick={() => setGameFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                gameFilter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Alle Spiele
            </button>
            <button
              onClick={() => setGameFilter('home')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                gameFilter === 'home' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Home size={14} /> Heimspiele
            </button>
            <button
              onClick={() => setGameFilter('away')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                gameFilter === 'away' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Plane size={14} /> Auswärtsspiele
            </button>
          </div>
        </div>
      </div>
      
      {/* Add padding to account for fixed header and filter toggle */}
      <div className="pt-24">
        <Layout>
          <div className="container mx-auto p-4">
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Spielerstatistiken</h1>
            {latestGameNumber > 1 && (
              <div className="text-sm text-muted-foreground flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Letzter Spieltag: {latestGameNumber}
              </div>
            )}
          </div>
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
                    gameFilter={gameFilter}
                  />
                </div>
              );
            })}
        </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Players;
