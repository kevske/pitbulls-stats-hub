import { useState } from "react";
import { Player } from "@/data/players";
import { games } from "@/data/games";
import { calculateAverages } from "@/utils/statsCalculations";
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
  players: Player[];
}

type SortField = "name" | "games" | "points" | "assists" | "rebounds" | "steals" | "blocks";
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

  const playersWithStats = players.map((player) => ({
    ...player,
    calculatedStats: calculateAverages(games, player.id),
  }));

  const sortedPlayers = [...playersWithStats]
    .filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0;

      let aValue: number | string;
      let bValue: number | string;

      if (sortField === "name") {
        aValue = a.name;
        bValue = b.name;
      } else if (sortField === "games") {
        aValue = a.calculatedStats.games;
        bValue = b.calculatedStats.games;
      } else {
        aValue = a.calculatedStats[sortField];
        bValue = b.calculatedStats[sortField];
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
                onClick={() => handleSort("assists")}
              >
                <div className="flex items-center justify-center gap-2">
                  Assists
                  {getSortIcon("assists")}
                </div>
              </TableHead>
              <TableHead 
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("rebounds")}
              >
                <div className="flex items-center justify-center gap-2">
                  Rebounds
                  {getSortIcon("rebounds")}
                </div>
              </TableHead>
              <TableHead 
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("steals")}
              >
                <div className="flex items-center justify-center gap-2">
                  Steals
                  {getSortIcon("steals")}
                </div>
              </TableHead>
              <TableHead 
                className="text-primary font-bold cursor-pointer select-none text-center"
                onClick={() => handleSort("blocks")}
              >
                <div className="flex items-center justify-center gap-2">
                  Blocks
                  {getSortIcon("blocks")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player) => (
              <TableRow key={player.id} className="hover:bg-accent/50">
                <TableCell className="font-medium text-foreground">{player.name}</TableCell>
                <TableCell className="text-center">{player.calculatedStats.games}</TableCell>
                <TableCell className="text-center font-semibold">{player.calculatedStats.points}</TableCell>
                <TableCell className="text-center">{player.calculatedStats.assists}</TableCell>
                <TableCell className="text-center">{player.calculatedStats.rebounds}</TableCell>
                <TableCell className="text-center">{player.calculatedStats.steals}</TableCell>
                <TableCell className="text-center">{player.calculatedStats.blocks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StatsTable;
