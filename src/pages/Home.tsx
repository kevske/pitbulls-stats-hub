import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStats } from "@/contexts/StatsContext";
import { PlayerTrendInfo, getTopTrendingPlayers } from "@/utils/statsTrends";
import { Player } from "@/data/players";
import { Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

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
        averageMinutes: Number(averageMinutes).toFixed(1),
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
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Spielerstatistiken</h1>
          </div>
          <div className="text-center py-8">Lade Daten...</div>
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
      <div className="container mx-auto max-w-6xl space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-primary">
            Willkommen bei den Pitbulls
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Verfolgen Sie unsere Mannschaft, Statistiken und Videos aus der aktuellen Saison.
          </p>
        </div>

        {/* Last Game Result */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Letztes Spiel</h3>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold">Spieltag {lastGame.gameNumber}</div>
                <div className="text-lg">{lastGame.date}</div>
                <div className="flex items-center justify-center gap-8 my-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{homeTeam}</div>
                    <div className="text-5xl font-black text-primary">
                      {homeScore}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{awayTeam}</div>
                    <div className="text-5xl font-black">
                      {awayScore}
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
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                  className="mt-4"
                >
                  Spielbericht ansehen
                </Button>
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
                className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/players/${performer.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-primary">#{index + 1}</div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {performer.firstName} {performer.lastName || ''}
                      </div>
                      {performer.averageMinutes > 0 && (
                        <div className="text-sm text-muted-foreground">
                          ⏱️ {Number(performer.averageMinutes).toFixed(1)} Min/Spiel
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm w-full">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-muted-foreground text-xs">Punkte/Spiel</div>
                        <div className="text-lg font-bold text-primary">{performer.pointsPerGame.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-muted-foreground text-xs">Gesamtpunkte</div>
                        <div className="text-lg font-bold">{performer.totalPoints}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-muted-foreground text-xs">3-Punkte/Spiel</div>
                        <div className="text-lg font-bold">{performer.threePointersPerGame.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
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
                <h3 className="text-2xl font-bold">Aufsteigende Sterne</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  <span>Verbesserungen im Vergleich zum letzten Spiel</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {risingStars.map((player, index) => (
                  <Card 
                    key={player.playerId}
                    className="border-orange-100 hover:border-orange-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/players/${player.playerId}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
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
        <div className="grid md:grid-cols-2 gap-4 pt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/videos")}
            className="h-20"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🎥</div>
              <div className="font-semibold">Videos</div>
            </div>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/upload-game")}
            className="h-20"
          >
            <div className="text-center">
              <div className="text-2xl mb-1">➕</div>
              <div className="font-semibold">Spiel hochladen</div>
            </div>
          </Button>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
