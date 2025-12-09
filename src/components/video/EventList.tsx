import { TaggedEvent, EVENT_TEMPLATES } from '@/types/basketball';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface EventListProps {
  events: TaggedEvent[];
  onDeleteEvent: (id: string) => void;
  onSeekTo?: (timestamp: number) => void;
}

export function EventList({ events, onDeleteEvent, onSeekTo }: EventListProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  if (events.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center text-muted-foreground">
        <p>No events recorded yet.</p>
        <p className="text-sm mt-1">Play the video and tag events in real-time!</p>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Events ({events.length})</h3>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {sortedEvents.map((event) => {
            const template = EVENT_TEMPLATES.find(t => t.type === event.type);
            return (
              <div
                key={event.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 group transition-colors"
              >
                <button
                  onClick={() => onSeekTo?.(event.timestamp)}
                  className="font-mono text-xs text-primary hover:underline cursor-pointer bg-primary/10 px-2 py-1 rounded flex-shrink-0"
                >
                  {event.formattedTime}
                </button>
                <span className="text-base flex-shrink-0">{template?.icon}</span>
                <span className="flex-1 text-sm leading-relaxed">{event.description}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-100 transition-opacity hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => onDeleteEvent(event.id)}
                  title="Delete event"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
