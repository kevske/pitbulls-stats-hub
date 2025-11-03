import { Player } from "@/data/players";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerGameLog } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";

interface PlayerCardProps {
  player: Player;
  gameLogs?: PlayerGameLog[];
  currentGameNumber?: number;
}

const PlayerCard = ({ player, gameLogs = [], currentGameNumber = 0 }: PlayerCardProps) => {
  const navigate = useNavigate();

  // Calculate stats from gameLogs instead of hardcoded games
  const playerGameLogs = gameLogs.filter(log => log.playerId === player.id);
  
  const totals = {
    games: playerGameLogs.length,
    points: playerGameLogs.reduce((sum, log) => sum + (log.points || 0), 0),
    twoPointers: playerGameLogs.reduce((sum, log) => sum + (log.twoPointers || 0), 0),
    threePointers: playerGameLogs.reduce((sum, log) => sum + (log.threePointers || 0), 0),
    freeThrowsMade: playerGameLogs.reduce((sum, log) => sum + (log.freeThrowsMade || 0), 0),
    freeThrowAttempts: playerGameLogs.reduce((sum, log) => sum + (log.freeThrowAttempts || 0), 0),
    fouls: playerGameLogs.reduce((sum, log) => sum + (log.fouls || 0), 0)
  };
  
  const gamesPlayed = totals.games || 1;
  const averages = {
    games: totals.games,
    points: parseFloat((totals.points / gamesPlayed).toFixed(1)),
    twoPointers: parseFloat((totals.twoPointers / gamesPlayed).toFixed(1)),
    threePointers: parseFloat((totals.threePointers / gamesPlayed).toFixed(1)),
    freeThrowsMade: parseFloat((totals.freeThrowsMade / gamesPlayed).toFixed(1)),
    freeThrowAttempts: parseFloat((totals.freeThrowAttempts / gamesPlayed).toFixed(1)),
    fouls: parseFloat((totals.fouls / gamesPlayed).toFixed(1))
  };
  
  // For now, use same values for home/away until we have location data in gameLogs
  const homeAverages = averages;
  const awayAverages = averages;

const renderStats = (stats: any) => (
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
            <Tabs defaultValue="totals" className="w-full">
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
