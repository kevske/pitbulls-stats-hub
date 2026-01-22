import React from 'react';
import { DangerousPlayer } from '@/types/supabase';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { getFoulOutInfo, getMissingTopPlayersInfo, getFreeThrowInfo } from '@/utils/spielplanUtils';

interface GameInsightsProps {
    players: DangerousPlayer[];
    leagueComparison?: string;
}

const GameInsights: React.FC<GameInsightsProps> = ({ players, leagueComparison }) => {
    const foulOutInfo = getFoulOutInfo(players);
    const missingPlayersInfo = getMissingTopPlayersInfo(players);
    const freeThrowInfo = getFreeThrowInfo(players);

    return (
        <div className="space-y-4">
            {foulOutInfo && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-800">
                    <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">{foulOutInfo}</span>
                    </div>
                </div>
            )}

            {leagueComparison && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/30 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">{leagueComparison}</span>
                    </div>
                </div>
            )}

            {missingPlayersInfo && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/30 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">{missingPlayersInfo}</span>
                    </div>
                </div>
            )}

            {freeThrowInfo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">{freeThrowInfo}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameInsights;
