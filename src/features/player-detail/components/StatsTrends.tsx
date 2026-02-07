import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PlayerGameLog } from '@/types/stats';

interface StatsTrendsProps {
    gameLogs: PlayerGameLog[];
    hasBoxScoreData: (gameNumber: number) => boolean;
    getOpponentName: (gameNumber: number) => string;
}

export const StatsTrends: React.FC<StatsTrendsProps> = memo(({
    gameLogs,
    hasBoxScoreData,
    getOpponentName
}) => {
    // Bolt: Optimized data preparation
    // 1. Used useMemo to prevent re-calculation on every render
    // 2. Removed redundant .sort() as gameLogs are already sorted by gameNumber in parent hooks
    const data = useMemo(() => {
        return gameLogs.filter(log => hasBoxScoreData(log.gameNumber));
    }, [gameLogs, hasBoxScoreData]);

    if (gameLogs.length <= 1) return null;

    return (
        <div className="space-y-8">
            <h4 className="text-md font-semibold text-muted-foreground">Statistik-Trends</h4>

            {/* Points Trend */}
            <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">Punkte pro Spiel</h5>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="gameNumber"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `Sp. ${value}`}
                            />
                            <YAxis
                                tick={{ fill: '#666', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    border: '1px solid #e5e7eb',
                                    padding: '8px 12px'
                                }}
                                formatter={(value: number) => [value, 'Punkte']}
                                labelFormatter={(label: number | string) => getOpponentName(Number(label))}
                            />
                            <Line
                                type="monotone"
                                dataKey="points"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                                connectNulls={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Combined Stats Chart */}
            <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">Weitere Statistiken</h5>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="gameNumber"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `Sp. ${value}`}
                            />
                            <YAxis
                                tick={{ fill: '#666', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    border: '1px solid #e5e7eb',
                                    padding: '8px 12px'
                                }}
                                labelFormatter={(label: number | string) => getOpponentName(Number(label))}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="line"
                            />
                            <Line
                                type="monotone"
                                dataKey="threePointers"
                                name="3-Punkte"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#10b981' }}
                                connectNulls={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="fouls"
                                name="Fouls"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#ef4444' }}
                                connectNulls={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="minutesPlayed"
                                name="Minuten"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#f59e0b' }}
                                connectNulls={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

StatsTrends.displayName = 'StatsTrends';
