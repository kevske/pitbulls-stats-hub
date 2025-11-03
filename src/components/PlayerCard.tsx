import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Home, Plane } from "lucide-react";
import { PlayerGameLog, PlayerStats } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";
import { useStats } from "@/contexts/StatsContext";
import { useState, useMemo } from "react";

interface PlayerCardProps {
  player: PlayerStats;
  gameLogs?: PlayerGameLog[];
  currentGameNumber?: number;
  gameFilter?: 'all' | 'home' | 'away';
}

const PlayerCard = ({ player, gameLogs = [], currentGameNumber = 0, gameFilter = 'all' }: PlayerCardProps) => {
  const navigate = useNavigate();
  // Game filter is now controlled by parent component
  
  // Calculate filtered stats based on game type
  const filteredStats = useMemo(() => {
    const filter = gameFilter || 'all';
    if (filter === 'all') {
      return {
        points: player.pointsPerGame,
        threePointers: player.threePointersPerGame,
        freeThrowsMade: player.freeThrowsMadePerGame,
        fouls: player.foulsPerGame,
        minutesPlayed: player.minutesPerGame,
        gamesPlayed: player.gamesPlayed,
        freeThrowPercentage: player.freeThrowPercentage
      };
    }
    
    // Filter game logs by type
    const playerGameLogs = gameLogs.filter(log => 
      log.playerId === player.id && 
      (filter === 'home' ? log.gameType === 'Heim' : log.gameType === 'Auswärts')
    );
    
    if (playerGameLogs.length === 0) {
      return {
        points: 0,
        threePointers: 0,
        freeThrowsMade: 0,
        fouls: 0,
        minutesPlayed: 0,
        gamesPlayed: 0,
        freeThrowPercentage: ''
      };
    }
    
    const totalPoints = playerGameLogs.reduce((sum, log) => sum + log.points, 0);
    const totalThreePointers = playerGameLogs.reduce((sum, log) => sum + log.threePointers, 0);
    const totalFreeThrowsMade = playerGameLogs.reduce((sum, log) => sum + log.freeThrowsMade, 0);
    const totalFreeThrowAttempts = playerGameLogs.reduce((sum, log) => sum + log.freeThrowAttempts, 0);
    const totalFouls = playerGameLogs.reduce((sum, log) => sum + log.fouls, 0);
    const totalMinutes = playerGameLogs.reduce((sum, log) => sum + log.minutesPlayed, 0);
    const games = playerGameLogs.length;
    
    return {
      points: parseFloat((totalPoints / games).toFixed(1)),
      threePointers: parseFloat((totalThreePointers / games).toFixed(1)),
      freeThrowsMade: parseFloat((totalFreeThrowsMade / games).toFixed(1)),
      fouls: parseFloat((totalFouls / games).toFixed(1)),
      minutesPlayed: parseFloat((totalMinutes / games).toFixed(1)),
      gamesPlayed: games,
      freeThrowPercentage: totalFreeThrowAttempts > 0 
        ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%` 
        : ''
    };
  }, [player, gameLogs, gameFilter]);

const renderStats = () => (
    <div className="grid grid-cols-4 gap-3 text-center">
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.points}</p>
        <p className="text-xs text-muted-foreground">PTS</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.threePointers}</p>
        <p className="text-xs text-muted-foreground">3P</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">
          {filteredStats.freeThrowsMade}
        </p>
        <p className="text-xs text-muted-foreground">FTM</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.fouls}</p>
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
            {/* Header with Name and Position */}
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
                <p className="text-sm text-muted-foreground">{player.position || 'Position nicht angegeben'}</p>
              </div>
              {player.jerseyNumber && player.jerseyNumber > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 text-blue-600 border-blue-200 text-lg font-bold"
                >
                  #{player.jerseyNumber}
                </Badge>
              )}
            </div>

{/* Physical Stats */}
            <div className="flex gap-6 mb-4">
              {player.height && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Größe</div>
                  <div className="text-sm font-semibold text-foreground">{player.height} cm</div>
                </div>
              )}
              {player.age && player.age > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Alter</div>
                  <div className="text-sm font-semibold text-foreground">{player.age}</div>
                </div>
              )}
            </div>

            {/* Bio */}
            {player.bio && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {player.bio}
              </p>
            )}


            {/* Stats */}
            <div className="mt-4">
              {renderStats()}
              <div className="mt-2 text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  ⏱️ {filteredStats.minutesPlayed} Min/Spiel
                  {filteredStats.gamesPlayed > 0 && ` (${filteredStats.gamesPlayed} Spiele)`}
                </p>
                {filteredStats.freeThrowPercentage && (
                  <p className="text-sm text-muted-foreground">
                    🏀 FW-Quote: {filteredStats.freeThrowPercentage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
