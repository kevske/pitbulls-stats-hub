import React from 'react';
import { Link } from 'react-router-dom';
import { PlayerGameLog } from '@/types/stats';

interface GameLogTableProps {
    gameLogs: PlayerGameLog[];
    hasBoxScoreData: (gameNumber: number) => boolean;
    getOpponentName: (gameNumber: number) => string;
}

export const GameLogTable: React.FC<GameLogTableProps> = ({
    gameLogs,
    hasBoxScoreData,
    getOpponentName
}) => {
    // Helper to display stats - show "N/A" for missing box score data
    const displayStat = (gameNumber: number, value: number, isDecimal: boolean = false) => {
        if (!hasBoxScoreData(gameNumber)) {
            return <span className="text-gray-400 italic">N/A</span>;
        }
        if (isDecimal) {
            return (value !== undefined && value !== null) ? value.toFixed(1) : '0.0';
        }
        return (value !== undefined && value !== null) ? value : 0;
    };

    return (
        <div className="p-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Spielverlauf</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-accent">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Spiel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Minuten</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Punkte</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">3P</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">FW</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fouls</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pkt/40</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">3er/40</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fouls/40</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {gameLogs.map((game, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-card' : 'bg-accent/50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link
                                        to={`/games/${game.gameNumber}`}
                                        className="text-primary hover:text-primary/80 hover:underline transition-colors"
                                    >
                                        {getOpponentName(game.gameNumber)}
                                    </Link>
                                    {!hasBoxScoreData(game.gameNumber) && (
                                        <div className="text-xs text-gray-400 italic mt-1">Keine Boxscore-Daten</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {displayStat(game.gameNumber, game.minutesPlayed, true)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {displayStat(game.gameNumber, game.points)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {displayStat(game.gameNumber, game.threePointers)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {hasBoxScoreData(game.gameNumber)
                                        ? `${game.freeThrowsMade || 0}/${game.freeThrowAttempts || 0}`
                                        : <span className="text-gray-400 italic">N/A</span>
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {displayStat(game.gameNumber, game.fouls)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {hasBoxScoreData(game.gameNumber) && game.pointsPer40
                                        ? game.pointsPer40.toFixed(1)
                                        : <span className="text-gray-400 italic">-</span>
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {hasBoxScoreData(game.gameNumber) && game.threePointersPer40
                                        ? game.threePointersPer40.toFixed(1)
                                        : <span className="text-gray-400 italic">-</span>
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {hasBoxScoreData(game.gameNumber) && game.foulsPer40
                                        ? game.foulsPer40.toFixed(1)
                                        : <span className="text-gray-400 italic">-</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
