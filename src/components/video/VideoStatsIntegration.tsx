import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, RefreshCw, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SaveData } from '@/services/saveLoad';
import { useVideoStatsIntegration } from '@/hooks/useVideoStatsIntegration';
import { useStats } from '@/contexts/StatsContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { VideoProjectService } from '@/services/videoProjectService';
import { extractStatsFromVideoData } from '@/services/statsExtraction';
import { calculateTaggingStatus } from '@/utils/taggingStatus';

interface VideoStatsIntegrationProps {
  saveData: SaveData;
  gameNumber?: string | null;
  onIntegrationComplete?: (result: any) => void;
}

export function VideoStatsIntegration({ saveData, gameNumber: urlGameNumber, onIntegrationComplete }: VideoStatsIntegrationProps) {
  const { integrateVideoData, isIntegrating, integrationError } = useVideoStatsIntegration();
  const { refresh: refreshStatsHub, games } = useStats();

  const [gameNumber, setGameNumber] = useState(urlGameNumber || '');
  const [isLoadingGameInfo, setIsLoadingGameInfo] = useState(false);
  const [validityCheck, setValidityCheck] = useState<{
    actualScore: string;
    targetScore: number;
    taggedPoints: number;
    percentage: number;
    status: 'excellent' | 'good' | 'poor' | 'unknown';
  } | null>(null);

  // Auto-detect game info from Supabase database
  const getGameInfo = async (gameNum: number) => {
    setIsLoadingGameInfo(true);
    try {
      // Load from Supabase
      const projects = await VideoProjectService.getProjectsForGame(gameNum.toString());

      if (projects && projects.length > 0) {
        const gameData = projects[0]?.data;

        return {
          homeTeam: gameData?.metadata?.homeTeam || 'Pitbulls',
          awayTeam: gameData?.metadata?.awayTeam || 'Opponent',
          finalScore: gameData?.metadata?.finalScore,
          gameType: gameData?.metadata?.gameType || 'Heim'
        };
      }

      // Fallback to games context if Supabase doesn't have it
      const gameFromContext = games.find(g => g.gameNumber === gameNum);
      if (gameFromContext) {
        return {
          homeTeam: gameFromContext.homeTeam,
          awayTeam: gameFromContext.awayTeam,
          finalScore: gameFromContext.finalScore,
          gameType: gameFromContext.homeTeam === 'Pitbulls' ? 'Heim' : 'Auswärts'
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to load game info:', error);
      return null;
    } finally {
      setIsLoadingGameInfo(false);
    }
  };

  // Calculate validity check for all videos in playlist
  const performValidityCheck = async (gameNum: number) => {
    console.log('Performing validity check for game:', gameNum);
    if (!gameNum) return;

    try {
      // Get game info from games context (Supabase data)
      const gameFromContext = games.find(g => g.gameNumber === gameNum);
      console.log('Game from context:', gameFromContext);

      // Get all videos for this game from Supabase
      const projects = await VideoProjectService.getProjectsForGame(gameNum.toString());
      let totalTaggedPoints = 0;

      if (projects && projects.length > 0) {
        console.log('Game videos:', projects.length);

        // Fetch and process each video in the playlist
        for (const project of projects) {
          if (project.data && project.data.events) {
            // Construct pseudo-SaveData for extraction
            const tempData: any = {
              events: project.data.events,
              players: project.data.players || [],
              metadata: project.data.metadata || {}
            };

            const extractedStats = extractStatsFromVideoData(tempData);
            totalTaggedPoints += extractedStats.teamStats.totalPoints;
            console.log(`Video ${project.video_index} points:`, extractedStats.teamStats.totalPoints);
          }
        }
      } else {
        // Fallback to current video if no playlist found
        const extractedStats = extractStatsFromVideoData(saveData);
        totalTaggedPoints = extractedStats.teamStats.totalPoints;
      }

      console.log('Total tagged points from all videos:', totalTaggedPoints);

      if (!gameFromContext?.finalScore) {
        // Show test validity check even without game score
        setValidityCheck({
          actualScore: 'Score unknown',
          targetScore: 0,
          taggedPoints: totalTaggedPoints,
          percentage: 0,
          status: 'unknown'
        });
        return;
      }

      const taggingStatus = calculateTaggingStatus(
        totalTaggedPoints,
        gameFromContext.finalScore,
        { home: gameFromContext.homeTeam, away: gameFromContext.awayTeam }
      );

      console.log('Setting validity check:', taggingStatus);
      setValidityCheck({
        actualScore: gameFromContext.finalScore,
        targetScore: taggingStatus.targetScore,
        taggedPoints: taggingStatus.taggedPoints,
        percentage: taggingStatus.percentage,
        status: taggingStatus.status
      });
    } catch (error) {
      console.error('Failed to perform validity check:', error);
    }
  };

  // Auto-check validity when game number or events change
  useEffect(() => {
    console.log('Validity check useEffect:', { gameNumber, eventCount: saveData.events.length, shouldRun: !!(gameNumber && saveData.events.length > 0) });
    if (gameNumber && saveData.events.length > 0) {
      console.log('Calling performValidityCheck');
      performValidityCheck(parseInt(gameNumber));
    } else {
      console.log('Not running validity check - missing game number or events');
    }
  }, [gameNumber, saveData.events.length]);

  const handleIntegrate = async () => {
    if (!gameNumber || isNaN(Number(gameNumber))) {
      toast.error('Please enter a valid game number');
      return;
    }

    const gameInfo = await getGameInfo(Number(gameNumber));

    const result = await integrateVideoData(saveData, Number(gameNumber), {
      homeTeam: gameInfo?.homeTeam || 'Pitbulls',
      awayTeam: gameInfo?.awayTeam || 'Opponent',
      finalScore: gameInfo?.finalScore || undefined,
      gameType: gameInfo?.gameType || 'Heim',
      updateExistingTotals: true
    });

    if (result.success) {
      toast.success(`Successfully integrated ${result.gameLogs.length} player stats into Stats Hub!`);

      // Refresh the stats hub to show new data
      await refreshStatsHub();

      onIntegrationComplete?.(result);
    } else {
      toast.error(`Integration failed: ${result.error}`);
    }
  };

  const eventCount = saveData.events.length;
  const playerCount = new Set(saveData.events.map(e => e.player).filter(Boolean)).size;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Feed to Stats Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex gap-2 text-xs flex-wrap">
          <Badge variant="secondary">{eventCount} events</Badge>
          <Badge variant="secondary">{playerCount} players</Badge>
          {validityCheck && (
            <Badge
              className={
                validityCheck.status === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  validityCheck.status === 'good' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    validityCheck.status === 'unknown' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }
            >
              {validityCheck.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
              {validityCheck.status === 'good' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {validityCheck.status === 'poor' && <XCircle className="h-3 w-3 mr-1" />}
              {validityCheck.status === 'unknown' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {validityCheck && `${validityCheck.taggedPoints} of ${validityCheck.targetScore} points tagged (${validityCheck.percentage}%)`}
            </Badge>
          )}

        </div>

        {/* Game Number Input */}
        <div>
          <Label htmlFor="gameNumber" className="text-xs">Game Number *</Label>
          <Input
            id="gameNumber"
            type="number"
            placeholder={urlGameNumber || "e.g., 8"}
            value={gameNumber}
            onChange={(e) => setGameNumber(e.target.value)}
            className="h-8 text-sm"
            disabled={!!urlGameNumber}
          />
          {urlGameNumber && (
            <div className="text-xs text-muted-foreground mt-1">
              Game number auto-detected from URL
            </div>
          )}
        </div>


        {/* Auto-detection Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
          <div className="flex items-center gap-1 mb-1">
            <Info className="h-3 w-3" />
            Auto-detection enabled
          </div>
          Game details (teams, score, type) will be automatically extracted from Supabase database.
        </div>

        {/* Integration Button */}
        <Button
          onClick={handleIntegrate}
          disabled={!gameNumber || isIntegrating || isLoadingGameInfo || eventCount === 0}
          className="w-full"
          size="sm"
        >
          {isIntegrating || isLoadingGameInfo ? (
            <>
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              {isLoadingGameInfo ? 'Loading Game Info...' : 'Integrating...'}
            </>
          ) : (
            <>
              <ArrowRight className="h-3 w-3 mr-2" />
              Feed to Stats Hub
            </>
          )}
        </Button>

        {/* Error Display */}
        {integrationError && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            {integrationError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
