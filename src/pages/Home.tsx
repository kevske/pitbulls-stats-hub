import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/contexts/StatsContext";
import { PlayerTrendInfo, getTopTrendingPlayers } from "@/utils/statsTrends";
import { Flame } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { games, players, gameLogs, loading, error } = useStats();

  // Get the last game (game with highest gameNumber)
  const lastGame = useMemo(() => {
    if (!games.length) return null;
    return [...games].sort((a, b) => b.gameNumber - a.gameNumber)[0];
  }, [games]);
  
  // Parse the final score into home and away scores
  const { homeScore, awayScore, homeTeam, awayTeam } = useMemo(() => {
    if (!lastGame) return { 
      homeScore: '0', 
      awayScore: '0',
      homeTeam: 'Pitbulls', 
      awayTeam: 'Gegner' 
    };
    
    // Get the team names
    const homeTeam = lastGame.homeTeam || 'Heimmannschaft';
    const awayTeam = lastGame.awayTeam || 'Gastmannschaft';
    
    // Handle the score format (it might be like '81:75' or '81-75')
    let homeScore = '0';
    let awayScore = '0';
    
    if (lastGame.finalScore) {
      const scoreParts = lastGame.finalScore.split(/[-:]/).map(s => s.trim());
      homeScore = scoreParts[0] || '0';
      awayScore = scoreParts[1] || '0';
    }
    
    return { homeScore, awayScore, homeTeam, awayTeam };
  }, [lastGame]);
  
  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    if (!games.length) return 0;
    return Math.max(...games.map(g => g.gameNumber));
  }, [games]);

  // Get top trending players (most improvements)
  const risingStars = useMemo<PlayerTrendInfo[]>(() => {
    if (!players.length || !gameLogs.length || latestGameNumber < 2) return [];
    
    return getTopTrendingPlayers(
      players.map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName || '',
        image: p.imageUrl || '/placeholder-player.png'
      })),
      latestGameNumber,
      gameLogs,
      3
    );
  }, [players, gameLogs, latestGameNumber]);

  // Get top 3 performers from all games (sorted by points per game)
  const topPerformers = useMemo(() => {
    if (!players.length || !gameLogs.length) return [];
    
    // Calculate stats for each player
    const playerStats = players.map(player => {
      // Skip non-player entries
      if (player.firstName === 'Gesamtsumme' || !player.firstName) return null;
      
      const playerGames = gameLogs.filter(log => log.playerId === player.id);
      const totalPoints = playerGames.reduce((sum, game) => sum + (game.points || 0), 0);
      const gamesPlayed = playerGames.length;
      
      // Use the player's average minutes directly from the player data
      const averageMinutes = player.minutesPerGame || 0;
      
      // Calculate other stats
      const totalThreePointers = playerGames.reduce((sum, game) => sum + (game.threePointers || 0), 0);
      const threePointersPerGame = gamesPlayed > 0 ? totalThreePointers / gamesPlayed : 0;
      
      const totalFreeThrowsMade = playerGames.reduce((sum, game) => sum + (game.freeThrowsMade || 0), 0);
      const totalFreeThrowAttempts = playerGames.reduce((sum, game) => sum + (game.freeThrowAttempts || 0), 0);
      const freeThrowPercentage = totalFreeThrowAttempts > 0 
        ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%` 
        : '0%';
      
      return {
        ...player,
        pointsPerGame: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
        threePointersPerGame,
        freeThrowPercentage,
        averageMinutes: averageMinutes,
        totalPoints,
        gamesPlayed
      };
    }).filter(Boolean); // Remove null entries
    
    // Sort by points per game and get top 3
    return [...playerStats]
      .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
      .slice(0, 3);
  }, [players, gameLogs]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl space-y-12 animate-fade-in">
          {/* Hero Section Skeleton */}
          <div className="text-center space-y-4">
            <div className="h-14 bg-muted/60 rounded-lg w-3/4 mx-auto skeleton-pulse" />
            <div className="h-6 bg-muted/60 rounded w-1/2 mx-auto skeleton-pulse" />
          </div>

          {/* Last Game Skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-muted/60 rounded w-48 mx-auto skeleton-pulse" />
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                  <div className="h-6 w-24 bg-muted/60 rounded skeleton-pulse" />
                  <div className="flex items-center justify-center gap-8 my-4">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                      <div className="h-12 w-20 bg-muted/60 rounded skeleton-pulse" />
                    </div>
                    <div className="h-8 w-12 bg-muted/60 rounded skeleton-pulse" />
                    <div className="text-center space-y-2">
                      <div className="h-8 w-32 bg-muted/60 rounded skeleton-pulse" />
                      <div className="h-12 w-20 bg-muted/60 rounded skeleton-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Skeleton */}
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-muted/60 rounded-full mx-auto skeleton-pulse" />
                    <div className="h-6 bg-muted/60 rounded w-3/4 mx-auto skeleton-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-16 bg-muted/60 rounded skeleton-pulse" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden der Daten: {error}
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!lastGame) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Keine Spieldaten verfügbar.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl space-y-12 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
            Pitbulls Stats Hub
          </h1>
        </div>

        {/* Last Game Result */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Letztes Spiel</h3>
          <Card className="border-border shadow-elegant hover:shadow-elegant-lg transition-elegant">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold">Spieltag {lastGame.gameNumber}</div>
                <div className="text-lg">{lastGame.date}</div>
                <div className="w-full">
                  {/* Team names row - only on mobile */}
                  <div className="md:hidden flex items-center justify-center gap-2 mb-2">
                    <div className="text-sm font-medium text-center flex-1 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {homeTeam}
                    </div>
                    <div className="px-2 text-sm font-medium">vs</div>
                    <div className="text-sm font-medium text-center flex-1 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {awayTeam}
                    </div>
                  </div>
                  
                  {/* Score row */}
                  <div className="flex items-center justify-center gap-4 md:gap-8 my-2">
                    {/* Hidden on mobile - team name is shown in the row above */}
                    <div className="hidden md:block text-center flex-1">
                      <div className="text-2xl font-bold line-clamp-2">{homeTeam}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-primary">
                        {homeScore}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold">:</div>
                    
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black">
                        {awayScore}
                      </div>
                    </div>
                    
                    {/* Hidden on mobile - team name is shown in the row above */}
                    <div className="hidden md:block text-center flex-1">
                      <div className="text-2xl font-bold line-clamp-2">{awayTeam}</div>
                    </div>
                  </div>
                </div>
                {lastGame.finalScore && (lastGame.finalScore.includes('-') || lastGame.finalScore.includes(':')) ? (
                  <div className="text-xl font-bold">
                    {homeTeam === 'TSV Neuenstadt' 
                      ? (Number(homeScore) > Number(awayScore) ? '🏆 Sieg' : '😞 Niederlage')
                      : (Number(awayScore) > Number(homeScore) ? '🏆 Sieg' : '😞 Niederlage')}
                  </div>
                ) : (
                  <div className="text-xl font-bold text-yellow-600">
                    ⏳ Spiel steht noch aus
                  </div>
                )}
                <div className="flex flex-col space-y-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                  >
                    Spielbericht ansehen
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/games')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Alle Spiele →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 3 Performers */}
          <div className="space-y-4 mt-12">
            <h3 className="text-2xl font-bold text-center">Top 3 Performer</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {topPerformers.map((performer, index) => (
              <Card 
                key={performer.id}
                className="border-border shadow-elegant hover:shadow-elegant-lg transition-elegant cursor-pointer group"
                onClick={() => navigate(`/players/${performer.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-primary group-hover:scale-110 transition-elegant">#{index + 1}</div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {performer.firstName} {performer.lastName || ''}
                      </div>
                      {performer.averageMinutes > 0 && (
                        <div className="text-sm text-muted-foreground">
                          ⏱️ {performer.averageMinutes.toFixed(1)} Min/Spiel
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm w-full">
                      <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                        <div className="text-muted-foreground text-xs">Punkte/Spiel</div>
                        <div className="text-lg font-bold text-primary">{performer.pointsPerGame.toFixed(1)}</div>
                      </div>
                      <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                        <div className="text-muted-foreground text-xs">Gesamtpunkte</div>
                        <div className="text-lg font-bold">{performer.totalPoints}</div>
                      </div>
                      <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                        <div className="text-muted-foreground text-xs">3-Punkte/Spiel</div>
                        <div className="text-lg font-bold">{performer.threePointersPerGame.toFixed(1)}</div>
                      </div>
                      <div className="bg-accent p-2 rounded transition-elegant group-hover:bg-accent/70">
                        <div className="text-muted-foreground text-xs">FW-Quote</div>
                        <div className="text-lg font-bold">{performer.freeThrowPercentage}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/players")}
                className="text-muted-foreground hover:text-primary"
              >
                Alle Spieler →
              </Button>
            </div>
          </div>

          {/* Rising Stars Section */}
          {risingStars.length > 0 && (
            <div className="space-y-4 mt-12">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-center">Aufsteiger der Woche</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  <span>Verbesserungen im Vergleich zum letzten Spiel</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {risingStars.map((player, index) => (
                  <Card 
                    key={player.playerId}
                    className="border-orange-100 shadow-elegant hover:shadow-elegant-lg transition-elegant cursor-pointer group"
                    onClick={() => navigate(`/players/${player.playerId}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative group-hover:scale-105 transition-elegant">
                          <img 
                            src={player.image} 
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                          />
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="flex items-center text-sm text-orange-600">
                            <Flame className="w-4 h-4 mr-1" />
                            <span>{player.improvementCount} Verbesserungen</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {player.improvements.slice(0, 3).map((improvement, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-muted-foreground">{improvement.category}:</span>
                            <span className="font-medium">
                              {improvement.previousValue} →{' '}
                              <span className="text-green-600">{improvement.currentValue}</span>
                              <span className="ml-1 text-xs text-green-600">
                                (+{improvement.improvement}%)
                              </span>
                            </span>
                          </div>
                        ))}
                        {player.improvements.length > 3 && (
                          <div className="text-xs text-muted-foreground text-right">
                            +{player.improvements.length - 3} weitere Verbesserungen
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-1 gap-4 pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/videos")}
            className="h-20 shadow-elegant hover:shadow-elegant-lg transition-elegant group"
          >
            <div className="text-center">
              <div className="text-2xl mb-1 group-hover:scale-110 transition-elegant">🎥</div>
              <div className="font-semibold">Videos</div>
            </div>
          </Button>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
