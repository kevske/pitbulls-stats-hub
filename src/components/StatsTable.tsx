import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { PlayerStats } from "@/types/stats";
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

interface AggregatedVideoStats {
  games: number;
  twoPointersMade: number;
  twoPointersAttempted: number;
  twoPointerPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPercentage: number;
  steals: number;
  blocks: number;
  assists: number;
  rebounds: number;
  turnovers: number;
  stealsPerGame: number;
  blocksPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  turnoversPerGame: number;
}

interface StatsTableProps {
  players: PlayerStats[];
  videoStatsData?: Record<string, AggregatedVideoStats>;
  showVideoStats?: boolean;
}

type SortField =
  | "name" | "games" | "points" | "threePointers" | "fouls" | "minutes" | "freeThrowPercentage"
  | "pointsPer40" | "threePointersPer40" | "foulsPer40"
  | "v_twoPointPct" | "v_threePointPct" | "v_steals" | "v_blocks" | "v_assists" | "v_rebounds" | "v_turnovers";
type SortDirection = "asc" | "desc" | null;

// Memoized to prevent re-renders when parent updates but players prop is unchanged
const StatsTable = memo(({ players, videoStatsData = {}, showVideoStats = false }: StatsTableProps) => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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

  const getAriaSort = (field: SortField) => {
    if (sortField !== field) {
      return "none";
    }
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  // Memoize sorted/filtered players to prevent expensive recalculation on every render
  const sortedPlayers = useMemo(() => {
    return [...players]
      .filter((player) => {
        const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) ||
          player.firstName.toLowerCase().includes(search.toLowerCase()) ||
          player.lastName.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        if (!sortField || !sortDirection) return 0;

        let aValue: number | string;
        let bValue: number | string;

        if (sortField === "name") {
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        } else if (sortField === "games") {
          aValue = a.gamesPlayed;
          bValue = b.gamesPlayed;
        } else if (sortField === "points") {
          aValue = a.pointsPerGame;
          bValue = b.pointsPerGame;
        } else if (sortField === "threePointers") {
          aValue = a.threePointersPerGame;
          bValue = b.threePointersPerGame;
        } else if (sortField === "fouls") {
          aValue = a.foulsPerGame;
          bValue = b.foulsPerGame;
        } else if (sortField === "minutes") {
          aValue = a.minutesPerGame;
          bValue = b.minutesPerGame;
        } else if (sortField === "freeThrowPercentage") {
          // Convert percentage string to number for proper sorting
          aValue = parseFloat(a.freeThrowPercentage) || 0;
          bValue = parseFloat(b.freeThrowPercentage) || 0;
        } else if (sortField === "pointsPer40") {
          aValue = a.pointsPer40;
          bValue = b.pointsPer40;
        } else if (sortField === "threePointersPer40") {
          aValue = a.threePointersPer40;
          bValue = b.threePointersPer40;
        } else if (sortField === "foulsPer40") {
          aValue = a.foulsPer40;
          bValue = b.foulsPer40;
        } else if (showVideoStats && videoStatsData) {
          // Video Stats Sorting
          const aStats = videoStatsData[a.id];
          const bStats = videoStatsData[b.id];

          // Helper to safely get value
          const getVal = (stats: AggregatedVideoStats | undefined, key: keyof AggregatedVideoStats) => stats ? stats[key] : 0;

          // helper for type narrowing
          const sField = sortField as string;

          if (sField === "v_twoPointPct") {
            aValue = getVal(aStats, 'twoPointerPercentage');
            bValue = getVal(bStats, 'twoPointerPercentage');
          } else if (sField === "v_threePointPct") {
            aValue = getVal(aStats, 'threePointerPercentage');
            bValue = getVal(bStats, 'threePointerPercentage');
          } else if (sField === "v_steals") {
            aValue = getVal(aStats, 'stealsPerGame');
            bValue = getVal(bStats, 'stealsPerGame');
          } else if (sField === "v_blocks") {
            aValue = getVal(aStats, 'blocksPerGame');
            bValue = getVal(bStats, 'blocksPerGame');
          } else if (sField === "v_assists") {
            aValue = getVal(aStats, 'assistsPerGame');
            bValue = getVal(bStats, 'assistsPerGame');
          } else if (sField === "v_rebounds") {
            aValue = getVal(aStats, 'reboundsPerGame');
            bValue = getVal(bStats, 'reboundsPerGame');
          } else if (sField === "v_turnovers") {
            aValue = getVal(aStats, 'turnoversPerGame');
            bValue = getVal(bStats, 'turnoversPerGame');
          } else {
            aValue = 0;
            bValue = 0;
          }
        } else {
          aValue = 0;
          bValue = 0;
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [players, search, sortField, sortDirection, showVideoStats, videoStatsData]);

  const renderHeader = (label: string, field: SortField, alignCenter = true) => (
    <TableHead
      aria-sort={getAriaSort(field)}
      className="p-0"
    >
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className={`w-full h-full rounded-none font-bold text-primary hover:bg-transparent hover:text-primary p-4 ${alignCenter ? 'justify-center' : 'justify-start'}`}
      >
        <div className="flex items-center gap-2">
          {label}
          {getSortIcon(field)}
        </div>
      </Button>
    </TableHead>
  );

  const renderVideoHeader = (label: string, field: SortField) => (
    <TableHead aria-sort={getAriaSort(field)} className="p-0 bg-orange-50/50 dark:bg-orange-900/10 border-l border-r border-orange-200/20">
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="w-full h-full rounded-none font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100/50 hover:text-orange-800 p-2 justify-center text-xs"
        title="Daten aus Video-Analyse"
      >
        <div className="flex flex-col items-center gap-1">
          <span>{label}</span>
          {getSortIcon(field)}
        </div>
      </Button>
    </TableHead>
  );

  const formatPct = (pct: number) => {
    if (!pct && pct !== 0) return "-";
    return `${Math.round(pct * 100)}%`;
  };

  const formatAvg = (val: number) => {
    if (!val && val !== 0) return "-";
    return val.toFixed(1);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Spieler suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm border-primary/30 focus:border-primary"
        aria-label="Nach Spielern suchen"
      />
      <div className="rounded-lg border border-primary/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              {renderHeader("Name", "name", false)}
              {renderHeader("Spiele", "games")}
              {renderHeader("Punkte", "points")}
              {showVideoStats && renderVideoHeader("2er %", "v_twoPointPct")}
              {showVideoStats && renderVideoHeader("3er % (V)", "v_threePointPct")}
              {renderHeader("3-Punkte", "threePointers")}
              {renderHeader("Fouls", "fouls")}
              {showVideoStats && renderVideoHeader("Stl", "v_steals")}
              {showVideoStats && renderVideoHeader("Blk", "v_blocks")}
              {showVideoStats && renderVideoHeader("Ast", "v_assists")}
              {showVideoStats && renderVideoHeader("Reb", "v_rebounds")}
              {showVideoStats && renderVideoHeader("TO", "v_turnovers")}
              {renderHeader("Minuten", "minutes")}
              {renderHeader("FW-Quote", "freeThrowPercentage")}
              {renderHeader("Pkt/40", "pointsPer40")}
              {renderHeader("3er/40", "threePointersPer40")}
              {renderHeader("Fouls/40", "foulsPer40")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.length > 0 ? (
              sortedPlayers.map((player) => (
                <TableRow key={player.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <Link
                        to={`/players/${player.id}`}
                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                      <span className="text-xs text-muted-foreground">{player.position || 'Position nicht angegeben'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{player.gamesPlayed}</TableCell>


                  {showVideoStats && (
                    <>
                      <TableCell className="text-center bg-orange-50/30 dark:bg-orange-900/5 border-l border-orange-200/10">
                        {videoStatsData[player.id] ? formatPct(videoStatsData[player.id].twoPointerPercentage) : '-'}
                      </TableCell>
                      <TableCell className="text-center bg-orange-50/30 dark:bg-orange-900/5 border-r border-orange-200/10">
                        {videoStatsData[player.id] ? formatPct(videoStatsData[player.id].threePointerPercentage) : '-'}
                      </TableCell>
                    </>
                  )}

                  <TableCell className="text-center">{player.threePointersPerGame.toFixed(1)}</TableCell>
                  <TableCell className="text-center">{player.foulsPerGame.toFixed(1)}</TableCell>

                  {showVideoStats && (
                    <>
                      <TableCell className="text-center font-bold text-green-600/80 dark:text-green-400/80 bg-orange-50/30 dark:bg-orange-900/5 border-l border-orange-200/10">{videoStatsData[player.id] ? formatAvg(videoStatsData[player.id].stealsPerGame) : '-'}</TableCell>
                      <TableCell className="text-center font-bold text-blue-600/80 dark:text-blue-400/80 bg-orange-50/30 dark:bg-orange-900/5">{videoStatsData[player.id] ? formatAvg(videoStatsData[player.id].blocksPerGame) : '-'}</TableCell>
                      <TableCell className="text-center font-bold text-yellow-600/80 dark:text-yellow-400/80 bg-orange-50/30 dark:bg-orange-900/5">{videoStatsData[player.id] ? formatAvg(videoStatsData[player.id].assistsPerGame) : '-'}</TableCell>
                      <TableCell className="text-center font-bold text-purple-600/80 dark:text-purple-400/80 bg-orange-50/30 dark:bg-orange-900/5">{videoStatsData[player.id] ? formatAvg(videoStatsData[player.id].reboundsPerGame) : '-'}</TableCell>
                      <TableCell className="text-center font-bold text-red-600/80 dark:text-red-400/80 bg-orange-50/30 dark:bg-orange-900/5 border-r border-orange-200/10">{videoStatsData[player.id] ? formatAvg(videoStatsData[player.id].turnoversPerGame) : '-'}</TableCell>
                    </>
                  )}

                  <TableCell className="text-center">{player.minutesPerGame.toFixed(1)}</TableCell>
                  <TableCell className="text-center">{player.freeThrowPercentage || '-'}</TableCell>
                  <TableCell className="text-center">{player.pointsPer40?.toFixed(1) || '-'}</TableCell>
                  <TableCell className="text-center">{player.threePointersPer40?.toFixed(1) || '-'}</TableCell>
                  <TableCell className="text-center">{player.foulsPer40?.toFixed(1) || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showVideoStats ? 17 : 10} className="h-24 text-center">
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
    </div>
  );
});

export default StatsTable;

StatsTable.displayName = 'StatsTable';
