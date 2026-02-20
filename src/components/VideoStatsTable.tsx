import { useState, useMemo, memo } from "react";
import { VideoStats, PlayerStats } from "@/types/stats";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoStatsTableProps {
    stats: VideoStats[];
    players: PlayerStats[];
}

type SortField = "name" | "gameNumber" | "twoPointers" | "threePointers" | "steals" | "blocks" | "assists" | "rebounds" | "turnovers";
type SortDirection = "asc" | "desc" | null;

const VideoStatsTable = memo(({ stats, players }: VideoStatsTableProps) => {
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Helper to get player name
    const getPlayerName = (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : playerId;
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection("asc");
            }
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown size={16} className="opacity-40" />;
        }
        if (sortDirection === "asc") {
            return <ArrowUp size={16} className="text-primary" />;
        }
        return <ArrowDown size={16} className="text-primary" />;
    };

    const sortedStats = useMemo(() => {
        return [...stats]
            .filter((stat) => {
                const playerName = getPlayerName(stat.playerId).toLowerCase();
                return playerName.includes(search.toLowerCase());
            })
            .sort((a, b) => {
                if (!sortField || !sortDirection) return 0;

                let aValue: number | string = 0;
                let bValue: number | string = 0;

                switch (sortField) {
                    case "name":
                        aValue = getPlayerName(a.playerId).toLowerCase();
                        bValue = getPlayerName(b.playerId).toLowerCase();
                        break;
                    case "gameNumber":
                        aValue = a.gameNumber;
                        bValue = b.gameNumber;
                        break;
                    case "twoPointers":
                        {
                            // Sort by percentage
                            const aPct = a.twoPointersAttempted > 0 ? a.twoPointersMade / a.twoPointersAttempted : 0;
                            const bPct = b.twoPointersAttempted > 0 ? b.twoPointersMade / b.twoPointersAttempted : 0;
                            aValue = aPct;
                            bValue = bPct;
                        }
                        break;
                    case "threePointers":
                        {
                            const aPct = a.threePointersAttempted > 0 ? a.threePointersMade / a.threePointersAttempted : 0;
                            const bPct = b.threePointersAttempted > 0 ? b.threePointersMade / b.threePointersAttempted : 0;
                            aValue = aPct;
                            bValue = bPct;
                        }
                        break;
                    case "steals":
                        aValue = a.steals;
                        bValue = b.steals;
                        break;
                    case "blocks":
                        aValue = a.blocks;
                        bValue = b.blocks;
                        break;
                    case "assists":
                        aValue = a.assists;
                        bValue = b.assists;
                        break;
                    case "rebounds":
                        aValue = a.rebounds;
                        bValue = b.rebounds;
                        break;
                    case "turnovers":
                        aValue = a.turnovers;
                        bValue = b.turnovers;
                        break;
                }

                if (sortDirection === "asc") {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
    }, [stats, players, search, sortField, sortDirection]);

    const renderHeader = (label: string, field: SortField) => (
        <TableHead className="p-0">
            <Button
                variant="ghost"
                onClick={() => handleSort(field)}
                className="w-full h-full rounded-none font-bold text-primary hover:bg-transparent hover:text-primary p-4 justify-center"
            >
                <div className="flex items-center gap-2">
                    {label}
                    {getSortIcon(field)}
                </div>
            </Button>
        </TableHead>
    );

    const formatPct = (made: number, attempted: number) => {
        if (attempted === 0) return "-";
        return `${Math.round((made / attempted) * 100)}% (${made}/${attempted})`;
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Spieler suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm border-primary/30 focus:border-primary"
            />
            <div className="rounded-lg border border-primary/20 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary hover:bg-secondary">
                            {renderHeader("Name", "name")}
                            {renderHeader("Spiel #", "gameNumber")}
                            {renderHeader("2er Quote", "twoPointers")}
                            {renderHeader("3er Quote", "threePointers")}
                            {renderHeader("Steals", "steals")}
                            {renderHeader("Blocks", "blocks")}
                            {renderHeader("Assists", "assists")}
                            {renderHeader("Rebounds", "rebounds")}
                            {renderHeader("Turnovers", "turnovers")}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStats.length > 0 ? (
                            sortedStats.map((stat) => (
                                <TableRow key={stat.id || `${stat.playerId}-${stat.gameNumber}`} className="hover:bg-accent/50">
                                    <TableCell className="font-medium text-foreground text-center">
                                        {getPlayerName(stat.playerId)}
                                    </TableCell>
                                    <TableCell className="text-center">{stat.gameNumber}</TableCell>
                                    <TableCell className="text-center">{formatPct(stat.twoPointersMade, stat.twoPointersAttempted)}</TableCell>
                                    <TableCell className="text-center">{formatPct(stat.threePointersMade, stat.threePointersAttempted)}</TableCell>
                                    <TableCell className="text-center font-bold text-green-600 dark:text-green-400">{stat.steals}</TableCell>
                                    <TableCell className="text-center font-bold text-blue-600 dark:text-blue-400">{stat.blocks}</TableCell>
                                    <TableCell className="text-center font-bold text-yellow-600 dark:text-yellow-400">{stat.assists}</TableCell>
                                    <TableCell className="text-center font-bold text-purple-600 dark:text-purple-400">{stat.rebounds}</TableCell>
                                    <TableCell className="text-center font-bold text-red-600 dark:text-red-400">{stat.turnovers}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground py-6">
                                        <Search className="h-8 w-8 mb-2 opacity-50" />
                                        <p>Keine Video-Stats gefunden</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});

export default VideoStatsTable;
