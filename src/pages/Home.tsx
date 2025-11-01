import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { games } from "@/data/games";
import { players } from "@/data/players";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Home = () => {
  const navigate = useNavigate();

  // Get the last game
  const lastGame = games[games.length - 1];
  
  // Calculate team totals for the last game
  const teamPoints = lastGame.playerStats.reduce((sum, ps) => sum + ps.points, 0);
  const opponentPoints = lastGame.result === "win" ? teamPoints - 10 : teamPoints + 8; // Mock opponent score
  
  // Get top 3 performers from the last game (sorted by points)
  const topPerformers = useMemo(() => 
    [...lastGame.playerStats]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3)
      .map(stat => ({
        ...stat,
        player: players.find(p => p.id === stat.playerId)!
      })),
    [lastGame.playerStats]
  );

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
                <div className="flex items-center justify-center gap-8 w-full">
                  <div className="text-center flex-1">
                    <div className="text-lg font-semibold">Pitbulls Neuenstadt</div>
                    <div className="text-4xl font-bold text-primary mt-2">{teamPoints}</div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">:</div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-semibold">{lastGame.opponent}</div>
                    <div className="text-4xl font-bold text-muted-foreground mt-2">{opponentPoints}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={lastGame.result === "win" ? "default" : "secondary"}>
                    {lastGame.result === "win" ? "Sieg" : "Niederlage"}
                  </Badge>
                  <span>•</span>
                  <span>{lastGame.location === "home" ? "Heimspiel" : "Auswärtsspiel"}</span>
                  <span>•</span>
                  <span>{new Date(lastGame.date).toLocaleDateString("de-DE")}</span>
                </div>
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
