import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Player, EventType, EVENT_TEMPLATES, formatTime, generateEventDescription, TaggedEvent } from '@/types/basketball';
import { Plus } from 'lucide-react';

interface EventInputProps {
  players: Player[];
  currentTime: number;
  isPlaying: boolean;
  onAddEvent: (event: Omit<TaggedEvent, 'id' | 'description'>) => void;
}

export function EventInput({ players, currentTime, isPlaying, onAddEvent }: EventInputProps) {
  const [eventType, setEventType] = useState<EventType>('shot');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [points, setPoints] = useState<number>(2);
  const [missed, setMissed] = useState(false);
  const [reboundPlayer, setReboundPlayer] = useState('');
  const [substitutionOut, setSubstitutionOut] = useState('');

  // Sort players by jersey number
  const sortedPlayers = [...players].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

  const template = EVENT_TEMPLATES.find(t => t.type === eventType);

  const handleAddEvent = () => {
    if (!selectedPlayer) return;

    const event: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: eventType,
      player: selectedPlayer,
      points: eventType === 'shot' ? points : undefined,
      missed: eventType === 'shot' ? missed : undefined,
      reboundPlayer: eventType === 'shot' && missed ? reboundPlayer || undefined : undefined,
      substitutionOut: eventType === 'substitution' ? substitutionOut || undefined : undefined,
    };

    onAddEvent(event);

    // Reset form
    setSelectedPlayer('');
    setMissed(false);
    setReboundPlayer('');
    setSubstitutionOut('');
  };

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-lg font-semibold text-primary">
          {formatTime(currentTime)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
          {isPlaying ? 'LIVE' : 'PAUSED'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Event Type */}
        <div className="grid grid-cols-4 gap-2">
          {EVENT_TEMPLATES.map((t) => (
            <Button
              key={t.type}
              variant={eventType === t.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEventType(t.type)}
              className="text-xs"
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>

        {/* Player Selection */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Player</Label>
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select player..." />
            </SelectTrigger>
            <SelectContent>
              {sortedPlayers.map((player) => (
                <SelectItem key={player.id} value={player.name}>
                  #{player.jerseyNumber} {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shot-specific options */}
        {eventType === 'shot' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Points</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    variant={points === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPoints(p)}
                    className="flex-1"
                  >
                    {p === 1 ? 'FT' : p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Missed</Label>
              <Switch checked={missed} onCheckedChange={setMissed} />
            </div>

            {missed && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Rebound by</Label>
                <Select value={reboundPlayer} onValueChange={setReboundPlayer}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select player (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.name}>
                        #{player.jerseyNumber} {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Substitution-specific options */}
        {eventType === 'substitution' && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Substitution out</Label>
            <Select value={substitutionOut} onValueChange={setSubstitutionOut}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select player (optional)..." />
              </SelectTrigger>
              <SelectContent>
                {sortedPlayers.filter(p => p.name !== selectedPlayer).map((player) => (
                  <SelectItem key={player.id} value={player.name}>
                    #{player.jerseyNumber} {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={handleAddEvent} 
          className="w-full gap-2"
          disabled={!selectedPlayer}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>
    </Card>
  );
}
