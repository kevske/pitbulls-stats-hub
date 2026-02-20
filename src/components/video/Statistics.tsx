import { TaggedEvent, Player, DEFAULT_PLAYERS } from '@/types/basketball';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { extractStatsFromVideoData, PlayerGameStats, TeamGameStats, ExtractedGameStats } from '@/services/statsExtraction';
import { useState, useEffect } from 'react';
import { VideoProjectService } from '@/services/videoProjectService';
import { useSearchParams } from 'react-router-dom';

interface StatisticsProps {
  events: TaggedEvent[];
  players?: Player[];
}

export function Statistics({ events, players = DEFAULT_PLAYERS }: StatisticsProps) {
  const [searchParams] = useSearchParams();
  const gameNumber = searchParams.get('game');
  const [showWholeGame, setShowWholeGame] = useState(false);
  const [isLoadingWholeGame, setIsLoadingWholeGame] = useState(false);

  // Get stats for current quarter or whole game
  const getStats = async (wholeGame: boolean) => {
    if (!wholeGame || !gameNumber) {
      // Current quarter stats
      return extractStatsFromVideoData({
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        players,
        events,
        metadata: {
          totalEvents: events.length,
          totalTimeSpan: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : 0,
          exportFormat: 'youtube-timestamps'
        }
      });
    }

    // Whole game stats - fetch all videos from playlist
    setIsLoadingWholeGame(true);
    try {
      const projects = await VideoProjectService.getProjectsForGame(gameNumber);

      if (projects && projects.length > 0) {
        let allEvents: TaggedEvent[] = [];

        // Fetch all videos in the playlist
        for (const project of projects) {
          if (project.data && project.data.events) {
            allEvents = [...allEvents, ...project.data.events];
          }
        }

        return extractStatsFromVideoData({
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          players,
          events: allEvents,
          metadata: {
            totalEvents: allEvents.length,
            totalTimeSpan: allEvents.length > 0 ? Math.max(...allEvents.map(e => e.timestamp)) : 0,
            exportFormat: 'youtube-timestamps'
          }
        });
      }
    } catch (error) {
      console.error('Failed to load whole game stats:', error);
    } finally {
      setIsLoadingWholeGame(false);
    }

    // Fallback to current quarter
    return extractStatsFromVideoData({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      players,
      events,
      metadata: {
        totalEvents: events.length,
        totalTimeSpan: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : 0,
        exportFormat: 'youtube-timestamps'
      }
    });
  };

  const [extractedStats, setExtractedStats] = useState<ExtractedGameStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize stats on component mount
  useEffect(() => {
    const initializeStats = async () => {
      setIsLoading(true);
      const stats = await getStats(false);
      setExtractedStats(stats);
      setIsLoading(false);
    };
    initializeStats();
  }, []);

  // Update stats when toggle changes
  const handleToggle = async (wholeGame: boolean) => {
    setShowWholeGame(wholeGame);
    setIsLoading(true);
    const newStats = await getStats(wholeGame);
    setExtractedStats(newStats);
    setIsLoading(false);
  };

  if (!extractedStats || isLoading) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 text-center text-muted-foreground text-sm">
        {isLoading ? 'Loading statistics...' : 'Statistics will appear here after recording events.'}
      </Card>
    );
  }

  const { playerStats, teamStats } = extractedStats;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="font-semibold text-sm">Enhanced Statistics</h3>
        {gameNumber && (
          <div className="inline-flex rounded-md border border-border/50 overflow-hidden text-xs">
            <button
              onClick={() => handleToggle(false)}
              disabled={isLoading || isLoadingWholeGame}
              className={`px-3 py-1.5 transition-colors ${!showWholeGame
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-transparent text-muted-foreground hover:bg-accent'
                }`}
            >
              Quarter
            </button>
            <button
              onClick={() => handleToggle(true)}
              disabled={isLoading || isLoadingWholeGame}
              className={`px-3 py-1.5 transition-colors ${showWholeGame
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-transparent text-muted-foreground hover:bg-accent'
                }`}
            >
              {isLoadingWholeGame ? 'Loading...' : 'Whole Game'}
            </button>
          </div>
        )}
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-4">
          {/* Team Summary */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-medium text-sm mb-2 text-primary">Team Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Points: {teamStats.totalPoints}</div>
              <div>FG%: {teamStats.teamFieldGoalPercentage}%</div>
              <div>3P%: {teamStats.teamThreePointPercentage}%</div>
              <div>FT%: {teamStats.teamFreeThrowPercentage}%</div>
              <div>Assists: {teamStats.totalAssists}</div>
              <div>Rebounds: {teamStats.totalRebounds}</div>
              <div>Steals: {teamStats.totalSteals}</div>
              <div>Blocks: {teamStats.totalBlocks}</div>
              <div>Turnovers: {teamStats.totalTurnovers}</div>
              <div>Fouls: {teamStats.totalFouls}</div>
            </div>
          </div>

          {/* Individual Player Stats */}
          {playerStats.map((player) => (
            <div key={player.playerId} className="p-3 rounded-lg bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">
                  #{player.jerseyNumber} {player.playerName}
                </div>
                <div className="flex gap-1">
                  {player.totalPoints > 0 && (
                    <Badge variant="default" className="text-xs">
                      {player.totalPoints} pts
                    </Badge>
                  )}
                  {player.assists > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {player.assists} ast
                    </Badge>
                  )}
                  {player.rebounds > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {player.rebounds} reb
                    </Badge>
                  )}
                </div>
              </div>

              {/* Shooting Stats */}
              {(player.fieldGoalsAttempted > 0 || player.freeThrowsAttempted > 0) && (
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="text-center p-1 rounded bg-background/50">
                    <div className="font-medium">FG</div>
                    <div>{player.fieldGoalsMade}/{player.fieldGoalsAttempted}</div>
                    <div className="text-muted-foreground">{player.fieldGoalPercentage}%</div>
                  </div>
                  <div className="text-center p-1 rounded bg-background/50">
                    <div className="font-medium">3PT</div>
                    <div>{player.threePointersMade}/{player.threePointersAttempted}</div>
                    <div className="text-muted-foreground">{player.threePointPercentage}%</div>
                  </div>
                  <div className="text-center p-1 rounded bg-background/50">
                    <div className="font-medium">FT</div>
                    <div>{player.freeThrowsMade}/{player.freeThrowsAttempted}</div>
                    <div className="text-muted-foreground">{player.freeThrowPercentage}%</div>
                  </div>
                </div>
              )}

              {/* Other Stats */}
              <div className="flex flex-wrap gap-1 text-xs">
                {player.steals > 0 && (
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {player.steals} STL
                  </span>
                )}
                {player.blocks > 0 && (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {player.blocks} BLK
                  </span>
                )}
                {player.turnovers > 0 && (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {player.turnovers} TOV
                  </span>
                )}
                {player.fouls > 0 && (
                  <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {player.fouls} PF
                  </span>
                )}
                {player.substitutions > 0 && (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    {player.substitutions} SUB
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
