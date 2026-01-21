import { useState, useEffect, useCallback } from 'react';
import { GameStats } from '@/types/stats';

// Define a minimal interface for the log needed here to avoid circular deps or complex types if possible
// But mostly we just need { gameNumber: number, points: number } form the raw logs
interface SimpleGameLog {
    gameNumber: number;
    points: number;
}

export const useBoxScoreAvailability = (games: GameStats[], allGameLogs: SimpleGameLog[]) => {
    const [gamesWithBoxScores, setGamesWithBoxScores] = useState<Set<number>>(new Set());

    useEffect(() => {
        const checkGamesWithBoxScores = () => {
            const gameNumbers = new Set<number>();

            // A game has meaningful box score data if not all players have 0 points
            // Check across ALL players, not just the current player
            for (const game of games) {
                const gameLogsForThisGame = allGameLogs.filter(log => log.gameNumber === game.gameNumber);

                // If no logs found for the game, we can skip or assume no data
                if (gameLogsForThisGame.length === 0) continue;

                const allPlayersHaveZeroPoints = gameLogsForThisGame.every(log => log.points === 0);

                if (!allPlayersHaveZeroPoints) {
                    gameNumbers.add(game.gameNumber);
                }
            }

            setGamesWithBoxScores(gameNumbers);
        };

        if (games.length > 0 && allGameLogs.length > 0) {
            checkGamesWithBoxScores();
        }
    }, [games, allGameLogs]);

    const hasBoxScoreData = useCallback((gameNumber: number) => {
        return gamesWithBoxScores.has(gameNumber);
    }, [gamesWithBoxScores]);

    const getOpponentName = useCallback((gameNumber: number) => {
        const game = games.find(g => g.gameNumber === gameNumber);
        if (!game) return `Spiel ${gameNumber}`;

        // Determine opponent - assuming Pitbulls/Neuenstadt is always one side
        const isHome = game.homeTeam?.toLowerCase().includes('pitbulls') || game.homeTeam?.toLowerCase().includes('neuenstadt');
        return isHome ? `Gegen ${game.awayTeam}` : `Bei ${game.homeTeam}`;
    }, [games]);

    return {
        gamesWithBoxScores,
        hasBoxScoreData,
        getOpponentName
    };
};
