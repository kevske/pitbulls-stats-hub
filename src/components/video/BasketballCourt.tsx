import { Player } from '@/types/basketball';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface CourtPosition {
  id: number;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
}

export const COURT_POSITIONS: CourtPosition[] = [
  { id: 1, x: 50, y: 85 }, // Mitte Dreierlinie
  { id: 2, x: 80, y: 55 }, // Rechts Dreierlinie (10% closer to middle)
  { id: 3, x: 20, y: 55 }, // Links Dreierlinie (10% closer to middle)
  { id: 4, x: 50, y: 55 }, // Freiwurflinie (10% upwards)
  { id: 5, x: 35, y: 15 }, // Links Zone (10% inwards, 30% upwards)
  { id: 6, x: 65, y: 15 }, // Rechts Zone (10% inwards, 30% upwards)
];

interface BasketballCourtProps {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  selectedPlayerId?: string;
  disabled?: boolean;
}

export function BasketballCourt({ players, onPlayerSelect, selectedPlayerId, disabled = false }: BasketballCourtProps) {
  // Sort players by position priority: Guards first, then Forwards, then Centers
  const sortedPlayers = [...players].sort((a, b) => {
    const positionOrder = { 'Guard': 0, 'Forward': 1, 'Center': 2 };
    return positionOrder[a.position] - positionOrder[b.position];
  });

  // Assign players to positions based on priority
  const positionAssignments: (Player | null)[] = COURT_POSITIONS.map(() => null);
  sortedPlayers.forEach((player, index) => {
    if (index < COURT_POSITIONS.length) {
      positionAssignments[index] = player;
    }
  });

  const formatPlayerName = (player: Player) => {
    const firstName = player.name.split(' ')[0];
    const lastName = player.name.split(' ')[1];
    const lastNameInitial = lastName ? lastName.charAt(0) : '';
    return `${firstName} ${lastNameInitial}`;
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden">
          {/* Basketball Court Background Image */}
          <img 
            src="/pitbulls-stats-hub/half-court.png"
            alt="Basketball Court"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Fallback to SVG if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          
          {/* Fallback SVG court (hidden by default) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" style={{ display: 'none' }}>
            <rect x="0" y="0" width="200" height="100" fill="#dbeafe" />
            <rect x="5" y="5" width="190" height="90" fill="none" stroke="#1e40af" strokeWidth="2" />
            <line x1="100" y1="5" x2="100" y2="95" stroke="#1e40af" strokeWidth="2" />
            <circle cx="100" cy="50" r="8" fill="none" stroke="#1e40af" strokeWidth="2" />
            <circle cx="100" cy="50" r="1" fill="#1e40af" />
            <path d="M 35 95 Q 100 15 165 95" fill="none" stroke="#1e40af" strokeWidth="2" />
            <rect x="75" y="65" width="50" height="30" fill="none" stroke="#1e40af" strokeWidth="2" />
            <circle cx="100" cy="65" r="8" fill="none" stroke="#1e40af" strokeWidth="2" />
            <circle cx="100" cy="65" r="1" fill="#1e40af" />
            <circle cx="100" cy="95" r="3" fill="#1e40af" />
            <circle cx="100" cy="95" r="1.5" fill="white" />
            <rect x="95" y="93" width="10" height="2" fill="#1e40af" />
          </svg>

          {/* Players only - no empty positions */}
          {positionAssignments.map((player, index) => {
            if (!player) return null;
            
            const position = COURT_POSITIONS[index];
            const isSelected = player.id === selectedPlayerId;
            
            return (
              <div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPlayerSelect(player)}
                  disabled={disabled}
                  className={`h-10 w-24 rounded-[25%/50%] flex flex-col items-center justify-center p-0 text-xs font-medium transition-all ${
                    isSelected ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 'bg-background hover:bg-accent'
                  }`}
                >
                  <span className="text-lg font-bold leading-none">{formatPlayerName(player)}</span>
                  <span className="text-[12px] leading-none">
                    #{player.jerseyNumber}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
