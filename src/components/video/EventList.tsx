import { TaggedEvent, EVENT_TEMPLATES, formatTime } from '@/types/basketball';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface EventListProps {
  events: TaggedEvent[];
  onDeleteEvent?: (id: string) => void;
  onSeekTo?: (timestamp: number) => void;
  currentTime?: number;
  className?: string;
  scrollAreaClassName?: string;
}

export function EventList({ events, onDeleteEvent, onSeekTo, currentTime = 0, className, scrollAreaClassName }: EventListProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [startEarly, setStartEarly] = useState(false);

  // Find where to insert the current time indicator
  const getCurrentTimePosition = () => {
    if (sortedEvents.length === 0) return 0;

    for (let i = 0; i < sortedEvents.length; i++) {
      if (currentTime < sortedEvents[i].timestamp) {
        return i;
      }
    }
    return sortedEvents.length; // After all events
  };

  // Smart scrolling: keep 2 previous and 3 following events visible without centering
  useEffect(() => {
    if (scrollAreaRef.current && sortedEvents.length > 0) {
      const position = getCurrentTimePosition();
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');

      if (viewport) {
        // Calculate the target element to scroll to (2 events before current position)
        const targetIndex = Math.max(0, position - 2);
        const allEventElements = scrollAreaRef.current.querySelectorAll('[data-event-index]');
        const targetElement = allEventElements[targetIndex] as HTMLElement;

        if (targetElement && viewport instanceof HTMLElement) {
          setTimeout(() => {
            // Get the position of the target element relative to the viewport
            const elementRect = targetElement.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();
            const scrollTop = viewport.scrollTop;

            // Calculate the desired scroll position: position the element at the top
            const elementTopRelativeToViewport = elementRect.top - viewportRect.top + scrollTop;

            // Scroll to position the target element at the top of the viewport
            viewport.scrollTo({
              top: elementTopRelativeToViewport,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    }
  }, [currentTime]);

  const handleSeek = (timestamp: number) => {
    if (onSeekTo) {
      const seekTime = startEarly ? Math.max(0, timestamp - 5) : timestamp;
      onSeekTo(seekTime);
    }
  };

  if (events.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center text-muted-foreground">
        <p>No events recorded yet.</p>
        <p className="text-sm mt-1">Play the video and tag events in real-time!</p>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden", className)}>
      <div className="p-3 border-b border-border/50 flex flex-row items-center justify-between">
        <h3 className="font-semibold text-sm">Events ({events.length})</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="start-early"
            checked={startEarly}
            onCheckedChange={(checked) => setStartEarly(checked as boolean)}
          />
          <label
            htmlFor="start-early"
            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            5 Sekunden früher starten
          </label>
        </div>
      </div>
      <ScrollArea ref={scrollAreaRef} className={cn("h-[300px]", scrollAreaClassName)}>
        <div className="p-2 space-y-1">
          {sortedEvents.map((event, index) => {
            const template = EVENT_TEMPLATES.find(t => t.type === event.type);
            const shouldShowIndicator = index === getCurrentTimePosition();

            return (
              <div key={event.id}>
                {/* Current Time Indicator */}
                {shouldShowIndicator && (
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30 my-1"
                    data-current-time-indicator
                  >
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="font-mono text-xs text-primary font-semibold">
                      NOW: {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                  </div>
                )}

                {/* Event */}
                <div
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 group transition-colors"
                  data-event-index={index}
                >
                  <button
                    onClick={() => handleSeek(event.timestamp)}
                    className="font-mono text-xs text-primary hover:underline cursor-pointer bg-primary/10 px-2 py-1 rounded flex-shrink-0"
                  >
                    {event.formattedTime}
                  </button>
                  <span className="text-base flex-shrink-0">{template?.icon}</span>
                  <span className="flex-1 text-sm leading-relaxed">{event.description}</span>
                  {onDeleteEvent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-100 transition-opacity hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => onDeleteEvent(event.id)}
                      title="Delete event"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator at the end if after all events */}
          {sortedEvents.length > 0 && getCurrentTimePosition() === sortedEvents.length && (
            <div
              className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30 my-1"
              data-current-time-indicator
            >
              <Clock className="h-3 w-3 text-primary" />
              <span className="font-mono text-xs text-primary font-semibold">
                NOW: {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
