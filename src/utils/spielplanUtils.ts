import { DangerousPlayer, BoxScore } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export const formatGameDate = (gameDate: string, gameTime?: string) => {
    try {
        const dateTimeString = gameTime ? `${gameDate}T${gameTime}` : gameDate;
        const date = parseISO(dateTimeString);
        return format(date, 'EEEE, dd.MM.yyyy - HH:mm', { locale: de });
    } catch (e) {
        return gameDate;
    }
};

export const selectTop3DangerousPlayers = (allPlayerStats: DangerousPlayer[]): DangerousPlayer[] => {
    if (allPlayerStats.length === 0) return [];

    // Sort by different metrics
    const byPoints = [...allPlayerStats].sort((a, b) => b.seasonStats.avgPoints - a.seasonStats.avgPoints);
    const byThreePointers = [...allPlayerStats].sort((a, b) => b.seasonStats.avgThreePointers - a.seasonStats.avgThreePointers);
    const byFreeThrows = [...allPlayerStats].sort((a, b) => b.seasonStats.avgFreeThrows - a.seasonStats.avgFreeThrows);

    const selectedPlayers: DangerousPlayer[] = [];
    const usedPlayerNames = new Set<string>();

    // 1. Player with most points per game
    const topPointsPlayer = byPoints.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topPointsPlayer) {
        selectedPlayers.push(topPointsPlayer);
        usedPlayerNames.add(topPointsPlayer.player.full_name);
    }

    // 2. Player with most three pointers per game
    const topThreePointPlayer = byThreePointers.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topThreePointPlayer) {
        selectedPlayers.push(topThreePointPlayer);
        usedPlayerNames.add(topThreePointPlayer.player.full_name);
    }

    // 3. Player with most made free throws per game
    const topFreeThrowPlayer = byFreeThrows.find(p => !usedPlayerNames.has(p.player.full_name));
    if (topFreeThrowPlayer) {
        selectedPlayers.push(topFreeThrowPlayer);
        usedPlayerNames.add(topFreeThrowPlayer.player.full_name);
    }

    // If we have less than 3 players, fill with the next best by points
    if (selectedPlayers.length < 3) {
        for (const player of byPoints) {
            if (!usedPlayerNames.has(player.player.full_name)) {
                selectedPlayers.push(player);
                usedPlayerNames.add(player.player.full_name);
                if (selectedPlayers.length >= 3) break;
            }
        }
    }

    return selectedPlayers.slice(0, 3);
};

export const getFoulOutInfo = (allPlayers: DangerousPlayer[]) => {
    const playerWithMostFoulOuts = allPlayers.reduce((max, player) =>
        player.seasonStats.fouledOutGames > max.seasonStats.fouledOutGames ? player : max
        , allPlayers[0]);

    if (playerWithMostFoulOuts && playerWithMostFoulOuts.seasonStats.fouledOutGames > 1) {
        return `${playerWithMostFoulOuts.player.full_name} hat sich in ${playerWithMostFoulOuts.seasonStats.fouledOutGames} Spielen ausgefoult`;
    }
    return null;
};

export const getFreeThrowInfo = (allPlayers: DangerousPlayer[]) => {
    const playerWithMostMissedFT = allPlayers.reduce((max, player) => {
        const missedFT = player.seasonStats.avgFreeThrowAttempts - player.seasonStats.avgFreeThrows;
        const maxMissedFT = max.seasonStats.avgFreeThrowAttempts - max.seasonStats.avgFreeThrows;
        return missedFT > maxMissedFT ? player : max;
    }, allPlayers[0]);

    if (playerWithMostMissedFT && playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts > 0) {
        // Calculate freethrow percentage
        const freeThrowPercentage = (playerWithMostMissedFT.seasonStats.avgFreeThrows / playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts) * 100;

        // Only show message if percentage is 60% or lower
        if (freeThrowPercentage <= 60) {
            const missedFT = playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts - playerWithMostMissedFT.seasonStats.avgFreeThrows;
            return `${playerWithMostMissedFT.player.full_name} verfehlt im Schnitt ${missedFT.toFixed(1)} seiner ${playerWithMostMissedFT.seasonStats.avgFreeThrowAttempts.toFixed(1)} Freiwürfe pro Spiel`;
        }
    }
    return null;
};

export const getMissingTopPlayersInfo = (allPlayers: DangerousPlayer[]) => {
    // Get the top 3 players based on season stats (similar to selectTop3DangerousPlayers logic)
    const top3Players = selectTop3DangerousPlayers(allPlayers);

    if (top3Players.length === 0) return null;

    // Check if any of the top 3 players missed recent games
    const missingPlayers: { player: DangerousPlayer; missedGames: number }[] = [];

    for (const player of top3Players) {
        const recentGames = player.recentStats?.lastTwoGames || [];
        let missedCount = 0;

        for (const recentGame of recentGames) {
            // If points are 0 and the game was played, likely missed the game
            // This is a heuristic - in reality you'd check for actual game participation
            if ((recentGame.game as any)?.status === 'finished' && recentGame.points === 0) {
                missedCount++;
            }
        }

        if (missedCount > 0) {
            missingPlayers.push({ player, missedGames: missedCount });
        }
    }

    if (missingPlayers.length > 0) {
        const playerNames = missingPlayers.map(mp => mp.player.player.full_name);
        const totalMissed = missingPlayers.reduce((sum, mp) => sum + mp.missedGames, 0);

        if (missingPlayers.length === 1) {
            return `${playerNames[0]} hat ${totalMissed} der letzten Spiele verpasst`;
        } else if (missingPlayers.length === 2) {
            return `${playerNames[0]} und ${playerNames[1]} haben insgesamt ${totalMissed} der letzten Spiele verpasst`;
        } else {
            return `${playerNames[0]}, ${playerNames[1]} und ${playerNames[2]} haben insgesamt ${totalMissed} der letzten Spiele verpasst`;
        }
    }

    return null;
};
