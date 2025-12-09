import { TaggedEvent } from '@/types/basketball';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatisticsProps {
  events: TaggedEvent[];
}

interface PlayerStats {
  shots: { made: number; missed: number; points: number };
  rebounds: number;
  substitutions: number;
  fouls: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

export function Statistics({ events }: StatisticsProps) {
  const playerStats = events.reduce((acc, event) => {
    if (!event.player) return acc;

    if (!acc[event.player]) {
      acc[event.player] = {
        shots: { made: 0, missed: 0, points: 0 },
        rebounds: 0,
        substitutions: 0,
        fouls: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
      };
    }

    const stats = acc[event.player];

    switch (event.type) {
      case 'shot':
        if (event.missed) {
          stats.shots.missed++;
        } else {
          stats.shots.made++;
          stats.shots.points += event.points || 0;
        }
        break;
      case 'rebound':
        stats.rebounds++;
        break;
      case 'substitution':
        stats.substitutions++;
        break;
      case 'foul':
        stats.fouls++;
        break;
      case 'assist':
        stats.assists++;
        break;
      case 'steal':
        stats.steals++;
        break;
      case 'block':
        stats.blocks++;
        break;
      case 'turnover':
        stats.turnovers++;
        break;
    }

    // Handle rebound player separately
    if (event.type === 'shot' && event.missed && event.reboundPlayer) {
      if (!acc[event.reboundPlayer]) {
        acc[event.reboundPlayer] = {
          shots: { made: 0, missed: 0, points: 0 },
          rebounds: 0,
          substitutions: 0,
          fouls: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
        };
      }
      acc[event.reboundPlayer].rebounds++;
    }

    return acc;
  }, {} as Record<string, PlayerStats>);

  const players = Object.keys(playerStats).sort();

  if (players.length === 0) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 text-center text-muted-foreground text-sm">
        Statistics will appear here after recording events.
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Statistics</h3>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="p-3 space-y-3">
          {players.map((player) => {
            const stats = playerStats[player];
            const statItems = [
              stats.shots.points > 0 && `${stats.shots.points} pts`,
              stats.shots.made > 0 && `${stats.shots.made}/${stats.shots.made + stats.shots.missed} FG`,
              stats.rebounds > 0 && `${stats.rebounds} REB`,
              stats.assists > 0 && `${stats.assists} AST`,
              stats.steals > 0 && `${stats.steals} STL`,
              stats.blocks > 0 && `${stats.blocks} BLK`,
              stats.turnovers > 0 && `${stats.turnovers} TO`,
              stats.fouls > 0 && `${stats.fouls} PF`,
              stats.substitutions > 0 && `${stats.substitutions} SUB`,
            ].filter(Boolean);

            return (
              <div key={player} className="p-2 rounded-lg bg-accent/30">
                <div className="font-medium text-sm mb-1">{player}</div>
                <div className="text-xs text-muted-foreground">
                  {statItems.length > 0 ? statItems.join(' • ') : 'No stats'}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
