import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import { formatGameDate } from '@/utils/spielplanUtils';
import { BoxscoreService } from '@/services/boxscoreService';
import { BoxScore } from '@/types/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, ArrowUp, ArrowDown, Video as VideoIcon } from 'lucide-react';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { games, gameLogs, players, videoStats } = useStats();
  const navigate = useNavigate();
  const [boxScores, setBoxScores] = useState<BoxScore[]>([]);
  const [boxScoresLoading, setBoxScoresLoading] = useState(false);
  const [boxScoresError, setBoxScoresError] = useState<string | null>(null);
  const [videoSortField, setVideoSortField] = useState<string | null>(null);
  const [videoSortDirection, setVideoSortDirection] = useState<'asc' | 'desc' | null>(null);
  // Store the actual team IDs from the games table
  const [gameTeamIds, setGameTeamIds] = useState<{ homeTeamId: string | null; awayTeamId: string | null }>({
    homeTeamId: null,
    awayTeamId: null
  });

  if (!id) {
    navigate('/games');
    return null;
  }

  const game = games.find(g =>
    g.gameNumber === parseInt(id) ||
    g.gameId === id
  );
  const gamePlayersLogs = game ? gameLogs.filter(log => log.gameNumber === game.gameNumber) : [];

  // Determine which team ID belongs to Neuenstadt/Pitbulls (our team) vs opponent
  // Using the actual home_team_id and away_team_id from the games table
  const getTeamMapping = () => {
    const homeIsNeuenstadt = game?.homeTeam?.toLowerCase().includes('neuenstadt') ||
      game?.homeTeam?.toLowerCase().includes('pitbulls');

    // Use actual team IDs from the game data
    if (gameTeamIds.homeTeamId && gameTeamIds.awayTeamId) {
      return {
        ourTeamId: homeIsNeuenstadt ? gameTeamIds.homeTeamId : gameTeamIds.awayTeamId,
        opponentTeamId: homeIsNeuenstadt ? gameTeamIds.awayTeamId : gameTeamIds.homeTeamId,
        ourTeamName: homeIsNeuenstadt ? (game?.homeTeam || 'Unser Team') : (game?.awayTeam || 'Unser Team'),
        opponentName: homeIsNeuenstadt ? (game?.awayTeam || 'Gegner') : (game?.homeTeam || 'Gegner')
      };
    }

    // Fallback: try to identify from box scores using player_slug matching
    if (boxScores.length > 0) {
      const teams = Array.from(new Set(boxScores.map(bs => bs.team_id)));
      if (teams.length > 0) {
        const team1Players = boxScores.filter(bs => bs.team_id === teams[0]);
        const isTeam1Ours = team1Players.some(p =>
          p.player_slug && (
            players.some(pl => pl.id === p.player_slug) ||
            gamePlayersLogs.some(log => log.playerId === p.player_slug)
          )
        );

        const ourTeamId = isTeam1Ours ? teams[0] : (teams.length > 1 ? teams[1] : teams[0]);
        const opponentTeamId = isTeam1Ours ? (teams.length > 1 ? teams[1] : '') : teams[0];

        return {
          ourTeamId,
          opponentTeamId,
          ourTeamName: homeIsNeuenstadt ? (game?.homeTeam || 'Unser Team') : (game?.awayTeam || 'Unser Team'),
          opponentName: homeIsNeuenstadt ? (game?.awayTeam || 'Gegner') : (game?.homeTeam || 'Gegner')
        };
      }
    }

    // Ultimate fallback
    return {
      ourTeamId: '',
      opponentTeamId: '',
      ourTeamName: homeIsNeuenstadt ? (game?.homeTeam || 'Unser Team') : (game?.awayTeam || 'Unser Team'),
      opponentName: homeIsNeuenstadt ? (game?.awayTeam || 'Gegner') : (game?.homeTeam || 'Gegner')
    };
  };

  const { ourTeamId, opponentTeamId, ourTeamName, opponentName } = getTeamMapping();
  const gameVideoStats = game ? videoStats.filter(vs => vs.gameNumber === game.gameNumber) : [];

  const sortedVideoStats = React.useMemo(() => {
    let stats = gameVideoStats.map(s => ({
      ...s,
      twoPct: s.twoPointersAttempted > 0 ? (s.twoPointersMade / s.twoPointersAttempted) : 0,
      threePct: s.threePointersAttempted > 0 ? (s.threePointersMade / s.threePointersAttempted) : 0,
      ftPct: s.freeThrowsAttempted > 0 ? (s.freeThrowsMade / s.freeThrowsAttempted) : 0,
    }));

    if (videoSortField && videoSortDirection) {
      stats.sort((a, b) => {
        let aVal = (a as any)[videoSortField] || 0;
        let bVal = (b as any)[videoSortField] || 0;
        
        if (videoSortField === 'playerName') {
          const nameA = getPlayerNameString(a.playerId).toLowerCase();
          const nameB = getPlayerNameString(b.playerId).toLowerCase();
          return videoSortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        
        return videoSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else {
      stats.sort((a, b) => b.totalPoints - a.totalPoints);
    }
    return stats;
  }, [gameVideoStats, videoSortField, videoSortDirection, players]);

  const handleVideoSort = (field: string) => {
    if (videoSortField === field) {
      if (videoSortDirection === 'asc') setVideoSortDirection('desc');
      else if (videoSortDirection === 'desc') { setVideoSortField(null); setVideoSortDirection(null); }
      else setVideoSortDirection('asc');
    } else {
      setVideoSortField(field);
      setVideoSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (videoSortField !== field) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
    if (videoSortDirection === 'asc') return <ArrowUp size={12} className="text-orange-500 ml-1" />;
    return <ArrowDown size={12} className="text-orange-500 ml-1" />;
  };

  const fmtPct = (pct: number, att: number) => att === 0 ? "-" : `${Math.round(pct * 100)}%`;

  // Load box scores for the game with team ID info
  useEffect(() => {
    const loadBoxScores = async () => {
      if (!game) return;

      setBoxScoresLoading(true);
      setBoxScoresError(null);

      try {
        // Use the real game ID from Supabase if available (e.g., "2786721")
        // Fallback to constructed ID for older records or video-only games
        const gameId = game.gameId || `game-${game.gameNumber}-${game.date.replace(/[^\d]/g, '')}`;
        const result = await BoxscoreService.getBoxScoresByGameWithTeamInfo(gameId);
        setBoxScores(result.boxScores);
        setGameTeamIds({
          homeTeamId: result.homeTeamId,
          awayTeamId: result.awayTeamId
        });
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

  const getPlayerName = (playerId: string, asLink: boolean = false, fallbackName?: string) => {
    // Check both slug and internal UUID for matching
    const player = players.find(p => p.id === playerId || (p as any).internalId === playerId);
    if (!player) return fallbackName || 'Unbekannter Spieler';

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

  const getPlayerNameString = (playerId: string, fallbackName?: string) => {
    const player = players.find(p => p.id === playerId || (p as any).internalId === playerId);
    return player ? `${player.firstName} ${player.lastName}` : (fallbackName || 'Unbekannter Spieler');
  };

  // Determine top performers, preferring box scores (live data) over logs (potentially cached/incomplete)
  const getTopPerformers = () => {
    if (boxScores.length > 0) {
      if (!ourTeamId) return [];

      const ourStats = boxScores.filter(bs => bs.team_id === ourTeamId);

      // 2. Map to format expected by UI
      if (ourStats.length > 0) {
        return ourStats.map(bs => {
          // Try to resolve player ID using the same logic as the stats table
          const resolvedPlayerId = bs.player_slug || players.find(p =>
            p.firstName.toLowerCase() === bs.player_first_name?.toLowerCase() &&
            p.lastName.toLowerCase() === bs.player_last_name?.toLowerCase()
          )?.id || '';

          return {
            playerId: resolvedPlayerId,
            firstName: bs.player_first_name,
            lastName: bs.player_last_name,
            points: bs.points,
            threePointers: bs.three_pointers,
            twoPointers: bs.two_pointers,
            freeThrowsMade: bs.free_throws_made,
            freeThrowAttempts: bs.free_throw_attempts
          };
        });
      }
    }

    // Fallback
    return gamePlayersLogs;
  };

  const topPerformers = [...getTopPerformers()]
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
              Spieltag {game.gameNumber} • {formatGameDate(game.date, undefined, "EEEE, dd.MM.yyyy 'um' HH:mm 'Uhr'")}
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
                  onClick={() => navigate(`/games/minutes/${game.gameId || game.gameNumber}`)}
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
                        <div className="font-medium">
                          {(() => {
                            const p = player as any;
                            const fallback = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : undefined;
                            return getPlayerName(player.playerId, true, fallback);
                          })()}
                        </div>
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
                  {ourTeamName} (Stats)
                </TabsTrigger>
                <TabsTrigger value="opponent">
                  {opponentName} (Stats)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="our-team">
              <Card>
                <CardHeader>
                  <CardTitle>Spielerstatistiken ({ourTeamName})</CardTitle>
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
                          // Use pre-computed ourTeamId for filtering
                          (() => {
                            const ourStats = boxScores.filter(bs => bs.team_id === ourTeamId);

                            // Merge with minutes from gameLogs if available
                            const mergedStats = ourStats.map(stat => {
                              const log = stat.player_slug ? gamePlayersLogs.find(l => l.playerId === stat.player_slug) : null;
                              return {
                                ...stat,
                                minutes: (stat.minutes_played !== undefined && stat.minutes_played !== null) ? stat.minutes_played : (log?.minutesPlayed || '-')
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
                                    {(() => {
                                      // Try to find player by slug first, then by name matching
                                      const playerSlug = stat.player_slug || players.find(p =>
                                        p.firstName.toLowerCase() === stat.player_first_name?.toLowerCase() &&
                                        p.lastName.toLowerCase() === stat.player_last_name?.toLowerCase()
                                      )?.id;

                                      if (playerSlug) {
                                        return (
                                          <Link to={`/players/${playerSlug}`} className="text-blue-600 hover:underline">
                                            {stat.player_first_name} {stat.player_last_name}
                                          </Link>
                                        );
                                      }
                                      return `${stat.player_first_name} ${stat.player_last_name}`;
                                    })()}
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

                  {gameVideoStats.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video text-orange-600"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                          Video-Boxscore (Erweiterte Stats)
                        </h4>
                        <span className="text-xs text-muted-foreground bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                          Aus Video-Tagging berechnet
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-background">
                          <thead>
                            <tr className="bg-orange-50/50 dark:bg-orange-900/10">
                              <th className="py-2 px-4 border text-left text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('playerName')}>
                                <div className="flex items-center">Spieler {getSortIcon('playerName')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('totalPoints')}>
                                <div className="flex items-center justify-center">Pkt {getSortIcon('totalPoints')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('twoPct')}>
                                <div className="flex items-center justify-center">2P% {getSortIcon('twoPct')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('threePct')}>
                                <div className="flex items-center justify-center">3P% {getSortIcon('threePct')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('ftPct')}>
                                <div className="flex items-center justify-center">FT% {getSortIcon('ftPct')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('rebounds')}>
                                <div className="flex items-center justify-center">Reb {getSortIcon('rebounds')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('assists')}>
                                <div className="flex items-center justify-center">Ast {getSortIcon('assists')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('steals')}>
                                <div className="flex items-center justify-center">Stl {getSortIcon('steals')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('blocks')}>
                                <div className="flex items-center justify-center">Blk {getSortIcon('blocks')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('turnovers')}>
                                <div className="flex items-center justify-center">TO {getSortIcon('turnovers')}</div>
                              </th>
                              <th className="py-2 px-4 border text-center text-xs font-bold uppercase cursor-pointer hover:bg-orange-100/50" onClick={() => handleVideoSort('fouls')}>
                                <div className="flex items-center justify-center">F {getSortIcon('fouls')}</div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedVideoStats.map((stat) => (
                              <tr key={stat.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5">
                                <td className="py-2 px-4 border text-nowrap">
                                  <div className="font-medium">
                                    {getPlayerName(stat.playerId, true)}
                                  </div>
                                </td>
                                <td className="py-2 px-4 border text-center font-bold">{stat.totalPoints}</td>
                                <td className="py-2 px-4 border text-center text-xs">
                                  <div className="font-bold">{fmtPct(stat.twoPct, stat.twoPointersAttempted)}</div>
                                  <div className="text-[10px] text-muted-foreground">({stat.twoPointersMade}/{stat.twoPointersAttempted})</div>
                                </td>
                                <td className="py-2 px-4 border text-center text-xs">
                                  <div className="font-bold">{fmtPct(stat.threePct, stat.threePointersAttempted)}</div>
                                  <div className="text-[10px] text-muted-foreground">({stat.threePointersMade}/{stat.threePointersAttempted})</div>
                                </td>
                                <td className="py-2 px-4 border text-center text-xs">
                                  <div className="font-bold">{fmtPct(stat.ftPct, stat.freeThrowsAttempted)}</div>
                                  <div className="text-[10px] text-muted-foreground">({stat.freeThrowsMade}/{stat.freeThrowsAttempted})</div>
                                </td>
                                <td className="py-2 px-4 border text-center text-purple-600 dark:text-purple-400 font-bold">{stat.rebounds}</td>
                                <td className="py-2 px-4 border text-center text-yellow-600 dark:text-yellow-400 font-bold">{stat.assists}</td>
                                <td className="py-2 px-4 border text-center text-green-600 dark:text-green-400 font-bold">{stat.steals}</td>
                                <td className="py-2 px-4 border text-center text-blue-600 dark:text-blue-400 font-bold">{stat.blocks}</td>
                                <td className="py-2 px-4 border text-center text-red-600 dark:text-red-400 font-bold">{stat.turnovers}</td>
                                <td className="py-2 px-4 border text-center">{stat.fouls}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opponent">
              <Card>
                <CardHeader>
                  <CardTitle>Spielerstatistiken ({opponentName})</CardTitle>
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
                          // Use pre-computed opponentTeamId for filtering
                          const opponentStats = boxScores.filter(bs => bs.team_id === opponentTeamId);

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
      </div>
    </Layout>
  );
};

export default GameDetail;
