import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface GameLog {
  gameNumber: number;
  minutesPlayed: number;
  points: number;
  threePointers: number;
  freeThrowsMade: number;
  freeThrowAttempts: number;
  fouls: number;
  [key: string]: string | number | undefined;
}

// Using the main Player interface from data/players
import { Player as MainPlayer } from '@/data/players';

// Extend the main Player interface with any additional fields needed for this component
interface Player extends Omit<MainPlayer, 'jerseyNumber'> {
  jerseyNumber?: number;
  position?: string;
  bio?: string;
  imageUrl?: string;
}

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { player, gameLogs } = usePlayerStats(id) as { player: Player | null; gameLogs: GameLog[] };
  const navigate = useNavigate();

  if (!player || !player.firstName) {
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

  const calculateTotal = (stat: string): number => {
    return gameLogs.reduce((sum, log) => {
      const value = log[stat];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  // Calculate stats
  const totalGames = gameLogs.length;
  const totalPoints = calculateTotal('points');
  const totalThreePointers = calculateTotal('threePointers');
  const totalFreeThrowsMade = calculateTotal('freeThrowsMade');
  const totalFreeThrowAttempts = calculateTotal('freeThrowAttempts');
  const totalFouls = calculateTotal('fouls');

  // Calculate per game averages
  const ppg = totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : '0.0';
  const threePointersPerGame = totalGames > 0 ? (totalThreePointers / totalGames).toFixed(1) : '0.0';
  const freeThrowPercentage = totalFreeThrowAttempts > 0 
    ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%` 
    : '0%';
  const fpg = totalGames > 0 ? (totalFouls / totalGames).toFixed(1) : '0.0';

  // Calculate total minutes played (now in decimal format)
  const totalMinutes = gameLogs.reduce((sum, game) => {
    return sum + (game.minutesPlayed || 0);
  }, 0);
  
  const averageMinutes = totalGames > 0 ? (totalMinutes / totalGames).toFixed(1) : '0.0';

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Player Header */}
          <div className="bg-primary/10 p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 md:mb-0 md:mr-8">
                <img
                  src={player.imageUrl || '/pitbulls-stats-hub/placeholder-player.png'}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/pitbulls-stats-hub/placeholder-player.png';
                  }}
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  {player.firstName} <span className="text-primary">{player.lastName}</span>
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                  {player.jerseyNumber && (
                    <span className="text-gray-600">
                      <span className="font-medium">#</span>{player.jerseyNumber}
                    </span>
                  )}
                  {player.position && (
                    <span className="text-gray-600">
                      <span className="font-medium">Position:</span> {player.position}
                    </span>
                  )}
                  {player.age && (
                    <span className="text-gray-600">
                      <span className="font-medium">Alter:</span> {player.age}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player Bio */}
          {player.bio && (
            <div className="p-6 border-b">
              <p className="text-gray-700 italic">"{player.bio}"</p>
            </div>
          )}
          
          {/* Stats Grid */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Saisonstatistiken</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Minuten/Spiel" value={averageMinutes} />
              <StatCard label="Punkte/Spiel" value={ppg} />
              <StatCard label="3-Punkte/Spiel" value={threePointersPerGame} />
              <StatCard label="Freiwurfquote" value={freeThrowPercentage} />
              <StatCard label="Fouls/Spiel" value={fpg} />
            </div>
          </div>

          {/* Game Log */}
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Spielverlauf</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spiel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minuten</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punkte</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3P</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FW</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fouls</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gameLogs.map((game, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Spiel {game.gameNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {game.minutesPlayed.toFixed(1) || '0.0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {game.points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {game.threePointers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {game.freeThrowsMade || 0}/{game.freeThrowAttempts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {game.fouls || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 p-4 rounded-lg text-center">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default PlayerDetail;
