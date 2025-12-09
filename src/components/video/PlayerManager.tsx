import { useState } from 'react';
import { Player, PositionType } from '@/types/basketball';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, X } from 'lucide-react';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (name: string, jerseyNumber: number, position: PositionType) => void;
  onRemovePlayer: (id: string) => void;
}

export function PlayerManager({ players, onAddPlayer, onRemovePlayer }: PlayerManagerProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJerseyNumber, setNewPlayerJerseyNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState<PositionType>('Guard');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim() && newPlayerJerseyNumber.trim() && !players.some(p => p.name.toLowerCase() === newPlayerName.trim().toLowerCase())) {
      const jerseyNum = parseInt(newPlayerJerseyNumber);
      if (!isNaN(jerseyNum) && jerseyNum > 0 && jerseyNum < 100) {
        onAddPlayer(newPlayerName.trim(), jerseyNum, newPlayerPosition);
        setNewPlayerName('');
        setNewPlayerJerseyNumber('');
        setNewPlayerPosition('Guard');
      }
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="font-semibold text-sm mb-3">Players</h3>
      
      <form onSubmit={handleAddPlayer} className="space-y-2 mb-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Player name..."
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            className="flex-1 h-8 text-sm bg-background/50"
          />
          <Input
            type="number"
            placeholder="#"
            value={newPlayerJerseyNumber}
            onChange={(e) => setNewPlayerJerseyNumber(e.target.value)}
            className="w-16 h-8 text-sm bg-background/50"
            min="1"
            max="99"
          />
          <Select value={newPlayerPosition} onValueChange={(value: Position) => setNewPlayerPosition(value)}>
            <SelectTrigger className="w-24 h-8 text-sm bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Guard">Guard</SelectItem>
              <SelectItem value="Forward">Forward</SelectItem>
              <SelectItem value="Center">Center</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-8 px-2">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
            <div className="flex-1">
              <div className="font-medium text-sm">#{player.jerseyNumber} {player.name}</div>
              <div className="text-xs text-muted-foreground">{player.position}</div>
            </div>
            <button
              onClick={() => onRemovePlayer(player.id)}
              className="hover:bg-destructive/20 rounded-full p-1 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
