import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, RefreshCw, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SaveData } from '@/lib/saveLoad';
import { useVideoStatsIntegration } from '@/hooks/useVideoStatsIntegration';
import { useStats } from '@/contexts/StatsContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { jsonbinStorage } from '@/lib/jsonbinStorage';
import { extractStatsFromVideoData } from '@/services/statsExtraction';

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
    taggedPoints: number;
    percentage: number;
    status: 'excellent' | 'good' | 'poor' | 'unknown';
  } | null>(null);

  // Auto-detect game info from Google Sheets mapping
  const getGameInfo = async (gameNum: number) => {
    setIsLoadingGameInfo(true);
    try {
      // Load from MasterBin index
      const masterBinData = await jsonbinStorage.readBin('693897a8ae596e708f8ea7c2') as { games: Record<string, Record<string, string>> } | null;
      
      if (masterBinData?.games?.[gameNum.toString()]) {
        const gameBinId = masterBinData.games[gameNum.toString()]['1']; // Get first video
        const gameData = await jsonbinStorage.readBin(gameBinId) as any;
        
        return {
          homeTeam: gameData?.metadata?.homeTeam || 'Pitbulls',
          awayTeam: gameData?.metadata?.awayTeam || 'Opponent',
          finalScore: gameData?.metadata?.finalScore,
          gameType: gameData?.metadata?.gameType || 'Heim'
        };
      }
      
      // Fallback to games context if MasterBin doesn't have it
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

  // Calculate validity check
  const performValidityCheck = async (gameNum: number) => {
    console.log('Performing validity check for game:', gameNum);
    if (!gameNum) return;
    
    try {
      // Get game info to find actual score
      const gameInfo = await getGameInfo(gameNum);
      console.log('Game info retrieved:', gameInfo);
      
      // For testing, show validity even without game info
      const extractedStats = extractStatsFromVideoData(saveData);
      const taggedPoints = extractedStats.teamStats.totalPoints;
      console.log('Tagged points:', taggedPoints);
      
      if (!gameInfo?.finalScore) {
        // Show test validity check even without game score
        setValidityCheck({
          actualScore: '?-?',
          taggedPoints,
          percentage: 0,
          status: 'unknown'
        });
        return;
      }
      
      // Extract TSV Neuenstadt's score from final score
      // Assuming format like "89-76" where first number is Pitbulls
      const scoreParts = gameInfo.finalScore.split('-');
      const pitbullsScore = parseInt(scoreParts[0]) || 0;
      const tsvScore = parseInt(scoreParts[1]) || 0;
      
      // Calculate percentage accuracy
      const percentage = pitbullsScore > 0 ? Math.round((taggedPoints / pitbullsScore) * 100) : 0;
      
      // Determine status
      let status: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
      if (percentage >= 90) status = 'excellent';
      else if (percentage >= 75) status = 'good';
      else status = 'poor';
      
      console.log('Setting validity check:', { actualScore: gameInfo.finalScore, taggedPoints, percentage, status });
      setValidityCheck({
        actualScore: gameInfo.finalScore,
        taggedPoints,
        percentage,
        status
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
              {validityCheck.taggedPoints} of {validityCheck.actualScore.split('-')[0]} points tagged ({validityCheck.percentage}%)
            </Badge>
          )}
          {/* Debug info */}
          <Badge variant="outline" className="text-xs">
            Debug: {validityCheck ? 'VC set' : 'VC null'} | GN: {gameNumber || 'none'}
          </Badge>
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
          Game details (teams, score, type) will be automatically extracted from Google Sheets mapping.
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
