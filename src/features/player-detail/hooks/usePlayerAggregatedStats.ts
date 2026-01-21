import { useMemo } from 'react';
import { PlayerGameLog } from '@/types/stats';

export const usePlayerAggregatedStats = (gameLogs: PlayerGameLog[]) => {
    return useMemo(() => {
        const calculateTotal = (stat: keyof PlayerGameLog): number => {
            return gameLogs.reduce((sum, log) => {
                const value = log[stat];
                return sum + (typeof value === 'number' ? value : 0);
            }, 0);
        };

        // Calculate stats
        const totalGames = gameLogs.length;
        const totalPoints = calculateTotal('points');
        const totalThreePointers = calculateTotal('threePointers');
        const totalFreeThrowsMade = calculateTotal('freeThrowsMade');
        const totalFreeThrowAttempts = calculateTotal('freeThrowAttempts');
        const totalFouls = calculateTotal('fouls');

        // Calculate per game averages
        const ppg = totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : '0.0';
        const threePointersPerGame = totalGames > 0 ? (totalThreePointers / totalGames).toFixed(1) : '0.0';
        const freeThrowPercentage = totalFreeThrowAttempts > 0
            ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%`
            : '0%';
        const fpg = totalGames > 0 ? (totalFouls / totalGames).toFixed(1) : '0.0';

        // Calculate total minutes played (now in decimal format)
        const totalMinutes = gameLogs.reduce((sum, game) => {
            return sum + (game.minutesPlayed || 0);
        }, 0);

        const averageMinutes = totalGames > 0 ? (totalMinutes / totalGames).toFixed(1) : '0.0';

        // Calculate per 40 min stats
        const pointsPer40 = totalMinutes > 0 ? ((totalPoints / totalMinutes) * 40).toFixed(1) : '0.0';
        const threePointersPer40 = totalMinutes > 0 ? ((totalThreePointers / totalMinutes) * 40).toFixed(1) : '0.0';
        const foulsPer40 = totalMinutes > 0 ? ((totalFouls / totalMinutes) * 40).toFixed(1) : '0.0';

        return {
            ppg,
            threePointersPerGame,
            freeThrowPercentage,
            fpg,
            averageMinutes,
            pointsPer40,
            threePointersPer40,
            foulsPer40
        };
    }, [gameLogs]);
};
