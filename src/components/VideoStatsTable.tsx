import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
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
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoStatsTableProps {
    stats: VideoStats[];
    players: PlayerStats[];
}

type SortField =
    | "name" | "games" | "points" | "twoPointPct" | "threePointPct" | "ftPct"
    | "steals" | "blocks" | "assists" | "rebounds" | "turnovers" | "fouls";

type SortDirection = "asc" | "desc" | null;

const VideoStatsTable = memo(({ stats, players }: VideoStatsTableProps) => {
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Build a player name lookup
    const playerNameMap = useMemo(() => {
        const map = new Map<string, string>();
        players.forEach(p => map.set(p.id, `${p.firstName} ${p.lastName}`));
        return map;
    }, [players]);

    // Aggregate video stats per player
    const aggregatedStats = useMemo(() => {
        const agg: Record<string, {
            playerId: string; playerName: string; games: number;
            twoMade: number; twoAtt: number; threeMade: number; threeAtt: number;
            ftMade: number; ftAtt: number; totalPoints: number; fouls: number;
            steals: number; blocks: number; assists: number; rebounds: number; turnovers: number;
        }> = {};

        stats.forEach(stat => {
            if (!agg[stat.playerId]) {
                agg[stat.playerId] = {
                    playerId: stat.playerId,
                    playerName: playerNameMap.get(stat.playerId) || stat.playerId,
                    games: 0, twoMade: 0, twoAtt: 0, threeMade: 0, threeAtt: 0,
                    ftMade: 0, ftAtt: 0, totalPoints: 0, fouls: 0,
                    steals: 0, blocks: 0, assists: 0, rebounds: 0, turnovers: 0,
                };
            }
            const p = agg[stat.playerId];
            // Only count this as a game played if the player had any activity
            const hadActivity = stat.twoPointersMade + stat.twoPointersAttempted +
                stat.threePointersMade + stat.threePointersAttempted +
                stat.freeThrowsMade + stat.freeThrowsAttempted +
                stat.steals + stat.blocks + stat.assists + stat.rebounds +
                stat.turnovers + stat.fouls > 0;
            if (hadActivity) p.games += 1;
            p.twoMade += stat.twoPointersMade;
            p.twoAtt += stat.twoPointersAttempted;
            p.threeMade += stat.threePointersMade;
            p.threeAtt += stat.threePointersAttempted;
            p.ftMade += stat.freeThrowsMade;
            p.ftAtt += stat.freeThrowsAttempted;
            p.totalPoints += stat.totalPoints;
            p.fouls += stat.fouls;
            p.steals += stat.steals;
            p.blocks += stat.blocks;
            p.assists += stat.assists;
            p.rebounds += stat.rebounds;
            p.turnovers += stat.turnovers;
        });

        // Keep all players, even those with 0 games (per-game stats will show '-')
        return Object.values(agg).map(s => ({
            ...s,
            twoPct: s.twoAtt > 0 ? s.twoMade / s.twoAtt : 0,
            threePct: s.threeAtt > 0 ? s.threeMade / s.threeAtt : 0,
            ftPct: s.ftAtt > 0 ? s.ftMade / s.ftAtt : 0,
            ppg: s.games > 0 ? s.totalPoints / s.games : 0,
            fpg: s.games > 0 ? s.fouls / s.games : 0,
            spg: s.games > 0 ? s.steals / s.games : 0,
            bpg: s.games > 0 ? s.blocks / s.games : 0,
            apg: s.games > 0 ? s.assists / s.games : 0,
            rpg: s.games > 0 ? s.rebounds / s.games : 0,
            tpg: s.games > 0 ? s.turnovers / s.games : 0,
        }));
    }, [stats, playerNameMap]);

    const taggedGamesCount = useMemo(() => new Set(stats.map(s => s.gameNumber)).size, [stats]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === "asc") setSortDirection("desc");
            else if (sortDirection === "desc") { setSortField(null); setSortDirection(null); }
            else setSortDirection("asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="opacity-40" />;
        if (sortDirection === "asc") return <ArrowUp size={14} className="text-orange-400" />;
        return <ArrowDown size={14} className="text-orange-400" />;
    };

    const sortedStats = useMemo(() => {
        return [...aggregatedStats]
            .filter(s => s.playerName.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                if (!sortField || !sortDirection) return b.ppg - a.ppg;
                let aV = 0, bV = 0;
                switch (sortField) {
                    case "name": { const aS = a.playerName.toLowerCase(), bS = b.playerName.toLowerCase(); return sortDirection === "asc" ? aS.localeCompare(bS) : bS.localeCompare(aS); }
                    case "games": aV = a.games; bV = b.games; break;
                    case "points": aV = a.ppg; bV = b.ppg; break;
                    case "twoPointPct": aV = a.twoPct; bV = b.twoPct; break;
                    case "threePointPct": aV = a.threePct; bV = b.threePct; break;
                    case "ftPct": aV = a.ftPct; bV = b.ftPct; break;
                    case "steals": aV = a.spg; bV = b.spg; break;
                    case "blocks": aV = a.bpg; bV = b.bpg; break;
                    case "assists": aV = a.apg; bV = b.apg; break;
                    case "rebounds": aV = a.rpg; bV = b.rpg; break;
                    case "turnovers": aV = a.tpg; bV = b.tpg; break;
                    case "fouls": aV = a.fpg; bV = b.fpg; break;
                }
                return sortDirection === "asc" ? aV - bV : bV - aV;
            });
    }, [aggregatedStats, search, sortField, sortDirection]);

    const fmtPct = (pct: number) => pct === 0 ? "-" : `${Math.round(pct * 100)}%`;
    const fmtAvg = (val: number) => val === 0 ? "-" : val.toFixed(1);
    const fmtRatio = (made: number, att: number) => att === 0 ? "" : ` (${made}/${att})`;

    const renderHeader = (label: string, field: SortField) => (
        <TableHead className="p-0">
            <Button
                variant="ghost"
                onClick={() => handleSort(field)}
                className="w-full h-full rounded-none font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 hover:text-orange-800 p-3 justify-center text-xs"
            >
                <div className="flex items-center gap-1">
                    {label}
                    {getSortIcon(field)}
                </div>
            </Button>
        </TableHead>
    );

    if (stats.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground border border-dashed border-orange-300/30 rounded-lg bg-orange-50/5">
                <Video className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Noch keine Video-Stats verfügbar.</p>
                <p className="text-xs mt-1 opacity-60">Tagge Spiele im Video-Editor und klicke "Feed to Stats Hub".</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Input
                placeholder="Spieler suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm border-orange-400/30 focus:border-orange-400"
            />
            <div className="rounded-lg border border-orange-400/20 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50/50 dark:hover:bg-orange-900/10">
                            {renderHeader("Name", "name")}
                            {renderHeader("Spiele", "games")}
                            {renderHeader("Pkt/g", "points")}
                            {renderHeader("2er %", "twoPointPct")}
                            {renderHeader("3er %", "threePointPct")}
                            {renderHeader("FW %", "ftPct")}
                            {renderHeader("Ast/g", "assists")}
                            {renderHeader("Reb/g", "rebounds")}
                            {renderHeader("Stl/g", "steals")}
                            {renderHeader("Blk/g", "blocks")}
                            {renderHeader("TO/g", "turnovers")}
                            {renderHeader("Fouls/g", "fouls")}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStats.length > 0 ? (
                            sortedStats.map((s) => (
                                <TableRow key={s.playerId} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5">
                                    <TableCell className="font-medium">
                                        <Link
                                            to={`/players/${s.playerId}`}
                                            className="text-orange-700 dark:text-orange-400 hover:underline hover:text-orange-900 dark:hover:text-orange-300 transition-colors"
                                        >
                                            {s.playerName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-center">{s.games}</TableCell>
                                    <TableCell className="text-center font-bold">{fmtAvg(s.ppg)}</TableCell>
                                    <TableCell className="text-center">
                                        {fmtPct(s.twoPct)}
                                        <span className="text-[10px] text-muted-foreground">{fmtRatio(s.twoMade, s.twoAtt)}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {fmtPct(s.threePct)}
                                        <span className="text-[10px] text-muted-foreground">{fmtRatio(s.threeMade, s.threeAtt)}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {fmtPct(s.ftPct)}
                                        <span className="text-[10px] text-muted-foreground">{fmtRatio(s.ftMade, s.ftAtt)}</span>
                                    </TableCell>
                                    <TableCell className="text-center text-yellow-600 dark:text-yellow-400">{fmtAvg(s.apg)}</TableCell>
                                    <TableCell className="text-center text-purple-600 dark:text-purple-400">{fmtAvg(s.rpg)}</TableCell>
                                    <TableCell className="text-center text-green-600 dark:text-green-400">{fmtAvg(s.spg)}</TableCell>
                                    <TableCell className="text-center text-blue-600 dark:text-blue-400">{fmtAvg(s.bpg)}</TableCell>
                                    <TableCell className="text-center text-red-600 dark:text-red-400">{fmtAvg(s.tpg)}</TableCell>
                                    <TableCell className="text-center">{fmtAvg(s.fpg)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground py-6">
                                        <Search className="h-8 w-8 mb-2 opacity-50" />
                                        <p>Keine Spieler gefunden</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="text-xs text-muted-foreground">
                Basiert auf <strong>{taggedGamesCount}</strong> getaggten {taggedGamesCount === 1 ? 'Spiel' : 'Spielen'}. Durchschnittswerte pro Spiel.
            </p>
        </div>
    );
});

VideoStatsTable.displayName = "VideoStatsTable";

export default VideoStatsTable;
