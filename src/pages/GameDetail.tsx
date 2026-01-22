import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { BoxscoreService } from '@/services/boxscoreService';
import { BoxScore } from '@/types/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { games, gameLogs, players } = useStats();
  const navigate = useNavigate();
  const [boxScores, setBoxScores] = useState<BoxScore[]>([]);
  const [boxScoresLoading, setBoxScoresLoading] = useState(false);
  const [boxScoresError, setBoxScoresError] = useState<string | null>(null);

  if (!id) {
    navigate('/games');
    return null;
  }

  const game = games.find(g => g.gameNumber === parseInt(id));
  const gamePlayersLogs = gameLogs.filter(log => log.gameNumber === parseInt(id));

  // Load box scores for the game
  useEffect(() => {
    const loadBoxScores = async () => {
      if (!game) return;

      setBoxScoresLoading(true);
      setBoxScoresError(null);

      try {
        // Use the real game ID from Supabase if available (e.g., "2786721")
        // Fallback to constructed ID for older records or video-only games
        const gameId = game.gameId || `game-${game.gameNumber}-${game.date.replace(/[^\d]/g, '')}`;
        const scores = await BoxscoreService.getBoxScoresByGame(gameId);
        setBoxScores(scores);
      } catch (error) {
        console.error('Failed to load box scores:', error);
        setBoxScoresError('Box scores konnten nicht geladen werden');
      } finally {
        setBoxScoresLoading(false);
      }
    };

    loadBoxScores();
  }, [game]);

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
                <div className="text-sm text-muted-foreground">Heim</div>
              </div>
              <div className="text-4xl font-bold">{game.finalScore}</div>
              <div>
                <div className="text-xl font-bold">{game.awayTeam}</div>
                <div className="text-sm text-muted-foreground">Gast</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center mb-6">
              <div>
                <div className="text-sm text-muted-foreground">1. Viertel</div>
                <div className="font-medium">{game.q1Score}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Halbzeit</div>
                <div className="font-medium">{game.halfTimeScore}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">3. Viertel</div>
                <div className="font-medium">{game.q3Score}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Endstand</div>
                <div className="font-bold text-lg">{game.finalScore}</div>
              </div>
            </div>

            {/* Minutes Editor Link - if no minute data available or manually requested */}
            {(!gamePlayersLogs.some(l => l.minutesPlayed > 0) || gamePlayersLogs.every(l => l.minutesPlayed === 0)) && (
              <div className="mt-4 mb-2 flex justify-center">
                <button
                  onClick={() => navigate(`/games/minutes/${game.gameNumber}`)}
                  className="text-sm text-amber-600 hover:text-amber-800 hover:underline flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Gespielte Minuten eintragen
                </button>
              </div>
            )}

            {/* Box Score URL Link - if available */}
            {game.boxScoreUrl && (
              <div className="mt-6">
                <a
                  href={game.boxScoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📊 Offiziellen Boxscore prüfen
                </a>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Top-Scorer</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((player, index) => (
                  <div key={player.playerId} className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{getPlayerName(player.playerId, true)}</div>
                        <div className="text-2xl font-bold">{player.points} Punkte</div>
                        <div className="text-sm text-muted-foreground">
                          {player.threePointers} 3P • {player.twoPointers} 2P • {player.freeThrowsMade}/{player.freeThrowAttempts} FT
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Link - if available */}
            {game.youtubeLink && (
              <div className="mt-6 pt-6 border-t border-border">
                <button
                  onClick={() => navigate('/videos')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🎥 Video ansehen
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unified Stats Section */}
        <div className="mt-8">
          <Tabs defaultValue="our-team" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="our-team">
                  {game.homeTeam.includes('Neuenstadt') || game.homeTeam.includes('Pitbulls') ? game.homeTeam : game.awayTeam} (Stats)
                </TabsTrigger>
                <TabsTrigger value="opponent">
                  {!game.homeTeam.includes('Neuenstadt') && !game.homeTeam.includes('Pitbulls') ? game.homeTeam : game.awayTeam} (Stats)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="our-team">
              <Card>
                <CardHeader>
                  <CardTitle>Spielerstatistiken ({game.homeTeam.includes('Neuenstadt') || game.homeTeam.includes('Pitbulls') ? game.homeTeam : game.awayTeam})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-background">
                      <thead>
                        <tr className="bg-muted">
                          <th className="py-2 px-4 border text-left">Spieler</th>
                          <th className="py-2 px-4 border text-center">Min</th>
                          <th className="py-2 px-4 border text-center">Punkte</th>
                          <th className="py-2 px-4 border text-center">2P</th>
                          <th className="py-2 px-4 border text-center">3P</th>
                          <th className="py-2 px-4 border text-center">FT</th>
                          <th className="py-2 px-4 border text-center">Fouls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boxScores.length > 0 ? (
                          // If we have box scores, try to identify our team
                          (() => {
                            // Identify our team ID by finding a player that exists in gamePlayersLogs or by name matching
                            // Simple heuristic: If we have gamePlayersLogs, use that for 'Match' detection
                            // Or simpler: Group box scores by team_id
                            const teams = Array.from(new Set(boxScores.map(bs => bs.team_id)));
                            let ourTeamId = '';

                            // If we have 2 teams, try to find which is ours
                            if (teams.length > 0) {
                              // Check if any player in the first team is in our gameLogs
                              const team1Players = boxScores.filter(bs => bs.team_id === teams[0]);
                              const isTeam1Ours = team1Players.some(p =>
                                gamePlayersLogs.some(log =>
                                  // Fuzzy name match or just assume if one matches it's our team
                                  // We don't have name in logs easily matching first/last perfectly without lookup
                                  // But we have playerId usually being slug.
                                  // BoxScore has player_slug if linked.
                                  (p.player_slug && p.player_slug === log.playerId)
                                )
                              );

                              ourTeamId = isTeam1Ours ? teams[0] : (teams.length > 1 ? teams[1] : teams[0]);

                              // Fallback: if we didn't match anyone (e.g. no logs), assume the one with most linked players is ours
                              if (!ourTeamId && teams.length > 1) {
                                const team1Linked = team1Players.filter(p => p.player_slug).length;
                                const team2Linked = boxScores.filter(bs => bs.team_id === teams[1]).filter(p => p.player_slug).length;
                                ourTeamId = team1Linked >= team2Linked ? teams[0] : teams[1];
                              }
                            }

                            const ourStats = boxScores.filter(bs => bs.team_id === ourTeamId);

                            // Merge with minutes from gameLogs if available
                            const mergedStats = ourStats.map(stat => {
                              const log = stat.player_slug ? gamePlayersLogs.find(l => l.playerId === stat.player_slug) : null;
                              return {
                                ...stat,
                                minutes: log?.minutesPlayed || '-'
                              };
                            }).sort((a, b) => b.points - a.points);

                            // If NO box scores for our team found (rare), fallback to logs
                            if (mergedStats.length === 0 && gamePlayersLogs.length > 0) {
                              return gamePlayersLogs
                                .sort((a, b) => b.points - a.points)
                                .map((log) => (
                                  <tr key={log.playerId} className="hover:bg-muted/50">
                                    <td className="py-2 px-4 border">{getPlayerName(log.playerId, true)}</td>
                                    <td className="py-2 px-4 border text-center">{log.minutesPlayed}</td>
                                    <td className="py-2 px-4 border text-center font-medium">{log.points}</td>
                                    <td className="py-2 px-4 border text-center">{log.twoPointers}</td>
                                    <td className="py-2 px-4 border text-center">{log.threePointers}</td>
                                    <td className="py-2 px-4 border text-center">{log.freeThrowsMade}/{log.freeThrowAttempts}</td>
                                    <td className="py-2 px-4 border text-center">{log.fouls}</td>
                                  </tr>
                                ));
                            }

                            return mergedStats.map((stat) => (
                              <tr key={stat.id} className="hover:bg-muted/50">
                                <td className="py-2 px-4 border">
                                  <div className="font-medium">
                                    {stat.player_slug ? (
                                      <Link to={`/players/${stat.player_slug}`} className="text-blue-600 hover:underline">
                                        {stat.player_first_name} {stat.player_last_name}
                                      </Link>
                                    ) : (
                                      `${stat.player_first_name} ${stat.player_last_name}`
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-4 border text-center">{stat.minutes}</td>
                                <td className="py-2 px-4 border text-center font-medium">{stat.points}</td>
                                <td className="py-2 px-4 border text-center">{stat.two_pointers}</td>
                                <td className="py-2 px-4 border text-center">{stat.three_pointers}</td>
                                <td className="py-2 px-4 border text-center text-nowrap">{stat.free_throws_made}/{stat.free_throw_attempts}</td>
                                <td className="py-2 px-4 border text-center">{stat.fouls}</td>
                              </tr>
                            ));
                          })()
                        ) : (
                          // Fallback to purely gameLogs if no box scores at all
                          gamePlayersLogs
                            .sort((a, b) => b.points - a.points)
                            .map((log) => (
                              <tr key={log.playerId} className="hover:bg-muted/50">
                                <td className="py-2 px-4 border">{getPlayerName(log.playerId, true)}</td>
                                <td className="py-2 px-4 border text-center">{log.minutesPlayed}</td>
                                <td className="py-2 px-4 border text-center font-medium">{log.points}</td>
                                <td className="py-2 px-4 border text-center">{log.twoPointers}</td>
                                <td className="py-2 px-4 border text-center">{log.threePointers}</td>
                                <td className="py-2 px-4 border text-center">{log.freeThrowsMade}/{log.freeThrowAttempts}</td>
                                <td className="py-2 px-4 border text-center">{log.fouls}</td>
                              </tr>
                            ))
                        )}
                        {boxScores.length === 0 && gamePlayersLogs.length === 0 && (
                          <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">Keine Statistiken verfügbar</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opponent">
              <Card>
                <CardHeader>
                  <CardTitle>Spielerstatistiken ({!game.homeTeam.includes('Neuenstadt') && !game.homeTeam.includes('Pitbulls') ? game.homeTeam : game.awayTeam})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-background">
                      <thead>
                        <tr className="bg-muted">
                          <th className="py-2 px-4 border text-left">Spieler</th>
                          <th className="py-2 px-4 border text-center">Punkte</th>
                          <th className="py-2 px-4 border text-center">2P</th>
                          <th className="py-2 px-4 border text-center">3P</th>
                          <th className="py-2 px-4 border text-center">FT</th>
                          <th className="py-2 px-4 border text-center">Fouls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Identify opponent team ID 
                          // It's the one that is NOT 'ourTeamId' calculated above
                          // To avoid code duplication, we re-derive or should have stored it. 
                          // Since this is inside a render block, we re-derive quickly.

                          const teams = Array.from(new Set(boxScores.map(bs => bs.team_id)));
                          if (teams.length === 0) return <tr><td colSpan={6} className="text-center py-4">Keine Daten verfügbar</td></tr>;

                          let ourTeamId = '';
                          const team1Players = boxScores.filter(bs => bs.team_id === teams[0]);
                          // Try to match specific player ID known to be ours (e.g. from logs)
                          // This duplicate logic is acceptable for inline simplicity but could be refactored
                          const isTeam1Ours = team1Players.some(p =>
                            (p.player_slug && gamePlayersLogs.some(log => log.playerId === p.player_slug))
                          );

                          // If we have 2 teams
                          if (teams.length > 1) {
                            ourTeamId = isTeam1Ours ? teams[0] : teams[1];
                          } else {
                            // Only 1 team found. If it matched ours, assume it's ours. If not, assume it's opponent (rare).
                            ourTeamId = isTeam1Ours ? teams[0] : '';
                          }

                          const opponentStats = boxScores.filter(bs => bs.team_id !== ourTeamId);

                          if (opponentStats.length === 0) {
                            return <tr><td colSpan={6} className="text-center py-4">Keine Daten verfügbar</td></tr>;
                          }

                          return opponentStats.sort((a, b) => b.points - a.points).map((stat) => (
                            <tr key={stat.id} className="hover:bg-muted/50">
                              <td className="py-2 px-4 border">
                                <div className="font-medium">
                                  {stat.player_first_name} {stat.player_last_name}
                                </div>
                              </td>
                              <td className="py-2 px-4 border text-center font-medium">{stat.points}</td>
                              <td className="py-2 px-4 border text-center">{stat.two_pointers}</td>
                              <td className="py-2 px-4 border text-center">{stat.three_pointers}</td>
                              <td className="py-2 px-4 border text-center text-nowrap">{stat.free_throws_made}/{stat.free_throw_attempts}</td>
                              <td className="py-2 px-4 border text-center">{stat.fouls}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </Layout>
  );
};

export default GameDetail;
