import React from 'react';
import { StatCard } from './StatCard';

interface StatsGridProps {
    averageMinutes: string | number;
    ppg: string | number;
    threePointersPerGame: string | number;
    fpg: string | number;
    freeThrowPercentage: string | number;
    pointsPer40: string | number;
    threePointersPer40: string | number;
    foulsPer40: string | number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
    averageMinutes,
    ppg,
    threePointersPerGame,
    fpg,
    freeThrowPercentage,
    pointsPer40,
    threePointersPer40,
    foulsPer40
}) => {
    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Saisonstatistiken</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Minuten/Spiel" value={averageMinutes} />
                <StatCard label="Punkte/Spiel" value={ppg} />
                <StatCard label="3-Punkte/Spiel" value={threePointersPerGame} />
                <StatCard label="Fouls/Spiel" value={fpg} />
                <StatCard label="Freiwurfquote" value={freeThrowPercentage} />
                <StatCard label="Punkte/40 Min" value={pointsPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
                <StatCard label="3er/40 Min" value={threePointersPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
                <StatCard label="Fouls/40 Min" value={foulsPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
            </div>
        </div>
    );
};
