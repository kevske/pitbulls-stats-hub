import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStats } from "@/contexts/StatsContext";

const Home = () => {
  const navigate = useNavigate();
  const { games, players, gameLogs, loading, error } = useStats();

  // Get the last game
  const lastGame = useMemo(() => {
    if (!games.length) return null;
    return [...games].sort((a, b) => b.gameNumber - a.gameNumber)[0];
  }, [games]);
  
  // Get top 3 performers from all games (sorted by points per game)
  const topPerformers = useMemo(() => {
    if (!players.length || !gameLogs.length) return [];
    
    // Calculate points per game for each player
    const playerStats = players.map(player => {
      const playerGames = gameLogs.filter(log => log.playerId === player.id);
      const totalPoints = playerGames.reduce((sum, game) => sum + game.points, 0);
      const gamesPlayed = playerGames.length;
      
      return {
        ...player,
        pointsPerGame: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
        totalPoints
      };
    });
    
    // Sort by points per game and get top 3
    return [...playerStats]
      .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
      .slice(0, 3);
  }, [players, gameLogs]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
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
                    <div className="text-4xl font-bold">Pitbulls</div>
                    <div className="text-5xl font-black text-primary">
                      {lastGame.finalScore?.split('-')[0]?.trim() || '0'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">vs</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold">{lastGame.awayTeam}</div>
                    <div className="text-5xl font-black">
                      {lastGame.finalScore?.split('-')[1]?.trim() || '0'}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold">
                  {lastGame.finalScore && 
                    (parseInt(lastGame.finalScore.split('-')[0].trim()) > parseInt(lastGame.finalScore.split('-')[1].trim()) 
                      ? '🏆 Sieg' 
                      : '😞 Niederlage')}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/games/${lastGame.gameNumber}`)}
                >
                  Spielbericht ansehen
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/stats")}
              className="text-muted-foreground hover:text-primary"
            >
              Alle Spiele →
            </Button>
          </div>
        </div>

        {/* Top 3 Performers */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Top 3 Performer</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {topPerformers.map((performer, index) => (
              <Card 
                key={performer.playerId}
                className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/player/${performer.playerId}`)}
              >
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-primary">#{index + 1}</div>
                    <div className="text-lg font-semibold">{performer.player.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Punkte</div>
                        <div className="text-xl font-bold text-primary">{performer.points}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Assists</div>
                        <div className="text-xl font-bold">{performer.assists}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Rebounds</div>
                        <div className="text-xl font-bold">{performer.rebounds}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Steals</div>
                        <div className="text-xl font-bold">{performer.steals}</div>
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
    </Layout>
  );
};

export default Home;
