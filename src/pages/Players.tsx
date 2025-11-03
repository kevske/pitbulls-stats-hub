import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import { Player } from '@/data/players';

// Generate player ID consistently with statsService.ts
const generatePlayerId = (firstName: string, lastName: string = ''): string => {
  const name = `${firstName} ${lastName}`.trim().toLowerCase();
  return name.replace(/\s+/g, '-');
};

const Players: React.FC = () => {
  const { players: playerStats, gameLogs, loading, error, games } = useStats();
  const navigate = useNavigate();

  // Map player stats to the Player type expected by PlayerCard
  const players = useMemo(() => {
    return playerStats.map(stat => {
      // Calculate total points from points per game and games played
      const totalPoints = Math.round((stat.pointsPerGame || 0) * (stat.gamesPlayed || 1));
      
      return {
        id: stat.id,
        firstName: stat.firstName,
        lastName: stat.lastName || '',
        team: 'Pitbulls Neuenstadt',
        bio: stat.bio || '',
        image: stat.imageUrl || '/placeholder-player.png',
        height: stat.position || '',
        weight: 0,
        age: stat.age || 0,
        rating: 0,
        status: 'Active',
        skills: [],
        stats: {
          games: stat.gamesPlayed || 0,
          points: totalPoints,
          assists: 0,
          rebounds: 0,
          steals: 0,
          blocks: 0
        },
        // Make sure all required Player properties are included
        pointsPerGame: stat.pointsPerGame || 0,
        threePointersPerGame: stat.threePointersPerGame || 0,
        freeThrowPercentage: stat.freeThrowPercentage || '0%',
        foulsPerGame: stat.foulsPerGame || 0,
        gamesPlayed: stat.gamesPlayed || 0
      } as unknown as Player;
    });
  }, [playerStats]);

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
            .filter(player => player.firstName && player.firstName.trim() !== 'Gesamtsumme')
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
