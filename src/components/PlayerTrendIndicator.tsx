import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayerGameLog } from "@/types/stats";
import { getTopImprovement } from "@/utils/statsTrends";
import { Flame } from "lucide-react";

interface PlayerTrendIndicatorProps {
  playerId: string;
  currentGameNumber: number;
  playerLogs: PlayerGameLog[];
  className?: string;
}

export function PlayerTrendIndicator({
  playerId,
  currentGameNumber,
  playerLogs,
  className = ""
}: PlayerTrendIndicatorProps) {
  // We pass playerLogs (which are likely already filtered by player) to getTopImprovement.
  // The utility function will filter by ID again, but filtering a small array is fast (O(K)).
  const improvement = getTopImprovement(playerId, currentGameNumber, playerLogs);

  if (!improvement) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center text-orange-500 ${className}`}
            aria-label="Aufwärtstrend"
          >
            <Flame size={16} className="mr-1" />
            <span className="text-xs font-medium">+{improvement.improvement}%</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-bold">Verbesserung um {improvement.improvement}%</div>
            <div className="text-muted-foreground">
              {improvement.category}: {improvement.previousValue} → {improvement.currentValue}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
