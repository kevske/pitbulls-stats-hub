import { Player } from "@/data/players";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateTotals, calculateAverages } from "@/utils/statsCalculations";
import { PlayerGameLog, GameStats } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";
import { useStats } from "@/contexts/StatsContext";

interface PlayerCardProps {
  player: Player;
  gameLogs?: PlayerGameLog[];
  currentGameNumber?: number;
}

const PlayerCard = ({ player, gameLogs = [], currentGameNumber = 0 }: PlayerCardProps) => {
  const navigate = useNavigate();
  const { games } = useStats();

  // Find the player's stats from the players array
  const playerStats = games.length > 0 ? games[0].playerStats.find(p => p.playerId === player.id) : null;
  
  // If we have game logs, use those, otherwise fall back to the hardcoded games
  const gamesToUse = gameLogs.length > 0 ? gameLogs : [];
  
  // Calculate stats using the game logs
  const stats = {
    points: playerStats?.points || 0,
    twoPointers: 0, // Not available in the current data structure
    threePointers: playerStats?.threePointers || 0,
    freeThrowsMade: playerStats?.freeThrowsMade || 0,
    freeThrowAttempts: playerStats?.freeThrowAttempts || 0,
    fouls: playerStats?.fouls || 0,
    minutesPlayed: playerStats?.minutesPlayed || 0
  };

const renderStats = () => (
    <div className="grid grid-cols-5 gap-3 text-center">
      <div>
        <p className="text-xl font-bold text-primary">{stats.points || 0}</p>
        <p className="text-xs text-muted-foreground">PTS</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{stats.twoPointers || 0}</p>
        <p className="text-xs text-muted-foreground">2P</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{stats.threePointers || 0}</p>
        <p className="text-xs text-muted-foreground">3P</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">
          {stats.freeThrowsMade || 0}
          {stats.freeThrowAttempts ? `/${stats.freeThrowAttempts}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">FT</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{stats.fouls || 0}</p>
        <p className="text-xs text-muted-foreground">FLS</p>
      </div>
    </div>
  );

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border overflow-hidden"
      onClick={() => navigate(`/player/${player.id}`)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Player Image */}
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0 relative bg-secondary">
            <img
              src="/placeholder-player.png"
              alt={`${player.firstName} ${player.lastName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground rounded-full p-1.5">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Right side - Player Info */}
          <div className="flex-1 p-6">
            {/* Header with Name and Status */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {player.firstName} {player.lastName}
                    {currentGameNumber > 1 && gameLogs.length > 1 && (
                      <PlayerTrendIndicator 
                        playerId={player.id}
                        currentGameNumber={currentGameNumber}
                        allGameLogs={gameLogs}
                        className="ml-2 -mt-1"
                      />
                    )}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{player.team}</p>
              </div>
              <Badge 
                variant="outline" 
                className="bg-green-50 text-green-600 border-green-200"
              >
                {player.status}
              </Badge>
            </div>

{/* Physical Stats */}
            <div className="flex gap-6 mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Height</div>
                <div className="text-sm font-semibold text-foreground">{player.height}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Weight</div>
                <div className="text-sm font-semibold text-foreground">{player.weight}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Age</div>
                <div className="text-sm font-semibold text-foreground">{player.age}</div>
              </div>
            </div>

            {/* Badge */}
            {player.badge && (
              <div className="mb-4">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                  {player.badge}
                </Badge>
              </div>
            )}

            {/* Bio */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {player.bio}
            </p>

            {/* Stats with Tabs */}
            <div className="mt-4">
              {renderStats(stats)}
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  ⏱️ {stats.minutesPlayed ? stats.minutesPlayed.toFixed(1) : '0.0'} Min/Spiel
                </p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="totals" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-4 mb-3">
                <TabsTrigger value="totals" className="text-xs">Gesamt</TabsTrigger>
                <TabsTrigger value="average" className="text-xs">Ø</TabsTrigger>
                <TabsTrigger value="home" className="text-xs">Heim</TabsTrigger>
                <TabsTrigger value="away" className="text-xs">Auswärts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="totals" className="mt-0">
                {renderStats(totals)}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {totals.games} Spiele
                </p>
              </TabsContent>
              
              <TabsContent value="average" className="mt-0">
                {renderStats(averages)}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ø pro Spiel ({averages.games} Spiele)
                </p>
              </TabsContent>
              
              <TabsContent value="home" className="mt-0">
                {renderStats(homeAverages)}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Heim-Ø ({homeAverages.games} Spiele)
                </p>
              </TabsContent>
              
              <TabsContent value="away" className="mt-0">
                {renderStats(awayAverages)}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Auswärts-Ø ({awayAverages.games} Spiele)
                </p>
              </TabsContent>
            </Tabs>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {player.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-foreground font-medium">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
