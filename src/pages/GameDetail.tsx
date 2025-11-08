import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/Layout';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { games, gameLogs, players } = useStats();
  const navigate = useNavigate();

  if (!id) {
    navigate('/games');
    return null;
  }

  const game = games.find(g => g.gameNumber === parseInt(id));
  const gamePlayersLogs = gameLogs.filter(log => log.gameNumber === parseInt(id));

  if (!game) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Spiel nicht gefunden</div>
        </div>
      </Layout>
    );
  }

  const formatGameDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'dd.MM.yyyy HH:mm', new Date());
      return format(date, "EEEE, dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de });
    } catch (e) {
      return dateString;
    }
  };

  const getPlayerName = (playerId: string, asLink: boolean = false) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return 'Unbekannter Spieler';
    
    const playerName = `${player.firstName} ${player.lastName}`;
    
    if (asLink) {
      return (
        <Link 
          to={`/players/${player.id}`}
          className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
        >
          {playerName}
        </Link>
      );
    }
    
    return playerName;
  };

  const topPerformers = [...gamePlayersLogs]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline flex items-center"
        >
          ← Zurück zur Übersicht
        </button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              Spieltag {game.gameNumber} • {formatGameDate(game.date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 items-center text-center mb-6">
              <div>
                <div className="text-xl font-bold">{game.homeTeam}</div>
                <div className="text-sm text-gray-500">Heim</div>
              </div>
              <div className="text-4xl font-bold">{game.finalScore}</div>
              <div>
                <div className="text-xl font-bold">{game.awayTeam}</div>
                <div className="text-sm text-gray-500">Gast</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-sm text-gray-500">1. Viertel</div>
                <div className="font-medium">{game.q1Score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Halbzeit</div>
                <div className="font-medium">{game.halfTimeScore}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">3. Viertel</div>
                <div className="font-medium">{game.q3Score}</div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Top-Scorer</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((player, index) => (
                  <div key={player.playerId} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{getPlayerName(player.playerId, true)}</div>
                        <div className="text-2xl font-bold">{player.points} Punkte</div>
                        <div className="text-sm text-gray-500">
                          {player.threePointers} 3P • {player.twoPointers} 2P • {player.freeThrowsMade}/{player.freeThrowAttempts} FT
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spielerstatistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border text-left">Spieler</th>
                    <th className="py-2 px-4 border">Min</th>
                    <th className="py-2 px-4 border">Punkte</th>
                    <th className="py-2 px-4 border">2P</th>
                    <th className="py-2 px-4 border">3P</th>
                    <th className="py-2 px-4 border">FT</th>
                    <th className="py-2 px-4 border">Fouls</th>
                  </tr>
                </thead>
                <tbody>
                  {gamePlayersLogs
                    .sort((a, b) => b.points - a.points)
                    .map((log) => (
                      <tr key={log.playerId} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border">
                          {getPlayerName(log.playerId, true)}
                        </td>
                        <td className="py-2 px-4 border text-center">{log.minutesPlayed}</td>
                        <td className="py-2 px-4 border text-center font-medium">{log.points}</td>
                        <td className="py-2 px-4 border text-center">{log.twoPointers}</td>
                        <td className="py-2 px-4 border text-center">{log.threePointers}</td>
                        <td className="py-2 px-4 border text-center">
                          {log.freeThrowsMade}/{log.freeThrowAttempts}
                        </td>
                        <td className="py-2 px-4 border text-center">{log.fouls}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GameDetail;
