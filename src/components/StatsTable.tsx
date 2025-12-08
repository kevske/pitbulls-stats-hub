import { useState } from "react";
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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface StatsTableProps {
  players: PlayerStats[];
}

type SortField = "name" | "games" | "points" | "threePointers" | "fouls" | "minutes" | "freeThrowPercentage" | "pointsPer40" | "threePointersPer40" | "foulsPer40";
type SortDirection = "asc" | "desc" | null;

const StatsTable = ({ players }: StatsTableProps) => {
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

  const playersWithStats = players;

  const sortedPlayers = [...playersWithStats]
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
              <TableHead
                className="text-primary font-bold cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("games")}
              >
                <div className="flex items-center justify-center gap-2">
                  Spiele
                  {getSortIcon("games")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("points")}
              >
                <div className="flex items-center justify-center gap-2">
                  Punkte
                  {getSortIcon("points")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("threePointers")}
              >
                <div className="flex items-center justify-center gap-2">
                  3-Punkte
                  {getSortIcon("threePointers")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("fouls")}
              >
                <div className="flex items-center justify-center gap-2">
                  Fouls
                  {getSortIcon("fouls")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("minutes")}
              >
                <div className="flex items-center justify-center gap-2">
                  Minuten
                  {getSortIcon("minutes")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("freeThrowPercentage")}
              >
                <div className="flex items-center justify-center gap-2">
                  FW-Quote
                  {getSortIcon("freeThrowPercentage")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("pointsPer40")}
              >
                <div className="flex items-center justify-center gap-2">
                  Pkt/40
                  {getSortIcon("pointsPer40")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("threePointersPer40")}
              >
                <div className="flex items-center justify-center gap-2">
                  3er/40
                  {getSortIcon("threePointersPer40")}
                </div>
              </TableHead>
              <TableHead
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("foulsPer40")}
              >
                <div className="flex items-center justify-center gap-2">
                  Fouls/40
                  {getSortIcon("foulsPer40")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player) => (
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
                <TableCell className="text-center font-semibold">{player.pointsPerGame.toFixed(1)}</TableCell>
                <TableCell className="text-center">{player.threePointersPerGame.toFixed(1)}</TableCell>
                <TableCell className="text-center">{player.foulsPerGame.toFixed(1)}</TableCell>
                <TableCell className="text-center">{player.minutesPerGame.toFixed(1)}</TableCell>
                <TableCell className="text-center">{player.freeThrowPercentage || '-'}</TableCell>
                <TableCell className="text-center">{player.pointsPer40?.toFixed(1) || '-'}</TableCell>
                <TableCell className="text-center">{player.threePointersPer40?.toFixed(1) || '-'}</TableCell>
                <TableCell className="text-center">{player.foulsPer40?.toFixed(1) || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StatsTable;
