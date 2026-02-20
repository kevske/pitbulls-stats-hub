import React from 'react';
import { Link } from 'react-router-dom';
import { VideoStats } from '@/types/stats';

interface VideoStatsTableProps {
    videoGameLogs: VideoStats[];
    getOpponentName: (gameNumber: number) => string;
}

export const VideoStatsTable: React.FC<VideoStatsTableProps> = ({
    videoGameLogs,
    getOpponentName
}) => {
    // Only show games where the player has actual stats
    const gamesWithStats = videoGameLogs.filter(g =>
        g.totalPoints > 0 || g.assists > 0 || g.rebounds > 0 ||
        g.steals > 0 || g.blocks > 0 || g.turnovers > 0 ||
        g.fouls > 0 || g.twoPointersAttempted > 0 ||
        g.threePointersAttempted > 0 || g.freeThrowsAttempted > 0
    );

    if (gamesWithStats.length === 0) return null;

    return (
        <div className="p-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-1">Video-Statistiken</h3>
            <p className="text-xs text-muted-foreground mb-4">Detaillierte Statistiken aus der Videoanalyse</p>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-accent">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Spiel</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">PTS</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">2P</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">3P</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">FT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">AST</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">REB</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">STL</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">BLK</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">TO</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fouls</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {gamesWithStats.map((game, index) => (
                            <tr key={game.id || index} className={index % 2 === 0 ? 'bg-card' : 'bg-accent/50'}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link
                                        to={`/games/${game.gameNumber}`}
                                        className="text-primary hover:text-primary/80 hover:underline transition-colors"
                                    >
                                        {getOpponentName(game.gameNumber)}
                                    </Link>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    {game.totalPoints}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.twoPointersMade}/{game.twoPointersAttempted}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.threePointersMade}/{game.threePointersAttempted}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.freeThrowsMade}/{game.freeThrowsAttempted}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.assists}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.rebounds}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.steals}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.blocks}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.turnovers}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {game.fouls}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
