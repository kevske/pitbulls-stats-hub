import React from 'react';
import { DangerousPlayer } from '@/types/supabase';

interface DangerousPlayersTableProps {
    players: DangerousPlayer[];
    extendedPlayers?: DangerousPlayer[];
}

const DangerousPlayersTable: React.FC<DangerousPlayersTableProps> = ({ players, extendedPlayers }) => {
    const allPlayers = extendedPlayers || players;
    const bestPoints = Math.max(...allPlayers.map(p => p.seasonStats.avgPoints));
    const best3Pointers = Math.max(...allPlayers.map(p => p.seasonStats.avgThreePointers));
    const bestFreeThrows = Math.max(...allPlayers.map(p => p.seasonStats.avgFreeThrows));

    return (
        <div className="mb-6">
            <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">Punkte</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">3er</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">FW</th>
                            <th className="border border-gray-300 px-4 py-2 text-center">Fouls</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={`${player.player.first_name}_${player.player.last_name}`}>
                                <td className="border border-gray-300 px-4 py-2 font-medium">
                                    {player.player.full_name}
                                </td>
                                <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgPoints === bestPoints ? 'bg-yellow-100 font-bold' : ''}`}>
                                    {player.seasonStats.avgPoints.toFixed(1)}
                                </td>
                                <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgThreePointers === best3Pointers ? 'bg-yellow-100 font-bold' : ''}`}>
                                    {player.seasonStats.avgThreePointers.toFixed(1)}
                                </td>
                                <td className={`border border-gray-300 px-4 py-2 text-center ${player.seasonStats.avgFreeThrows === bestFreeThrows ? 'bg-yellow-100 font-bold' : ''}`}>
                                    {player.seasonStats.avgFreeThrows.toFixed(1)}/{player.seasonStats.avgFreeThrowAttempts.toFixed(1)}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-center">
                                    {player.seasonStats.avgFouls.toFixed(1)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DangerousPlayersTable;
