import { useState } from "react";
import { Player } from "@/data/players";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StatsTableProps {
  players: Player[];
}

const StatsTable = ({ players }: StatsTableProps) => {
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(search.toLowerCase())
  );

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
              <TableHead className="text-primary font-bold">Name</TableHead>
              <TableHead className="text-primary font-bold">Spiele</TableHead>
              <TableHead className="text-primary font-bold">Punkte</TableHead>
              <TableHead className="text-primary font-bold">Assists</TableHead>
              <TableHead className="text-primary font-bold">Rebounds</TableHead>
              <TableHead className="text-primary font-bold">Steals</TableHead>
              <TableHead className="text-primary font-bold">Blocks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => (
              <TableRow key={player.id} className="hover:bg-accent/50">
                <TableCell className="font-medium text-foreground">{player.name}</TableCell>
                <TableCell>{player.stats.games}</TableCell>
                <TableCell>{player.stats.points}</TableCell>
                <TableCell>{player.stats.assists}</TableCell>
                <TableCell>{player.stats.rebounds}</TableCell>
                <TableCell>{player.stats.steals}</TableCell>
                <TableCell>{player.stats.blocks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StatsTable;
