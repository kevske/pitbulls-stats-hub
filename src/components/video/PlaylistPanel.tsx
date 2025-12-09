import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, PlayCircle } from 'lucide-react';

export interface PlaylistVideo {
  videoId: string;
  index: number;
  isCompleted: boolean;
}

interface PlaylistPanelProps {
  videos: PlaylistVideo[];
  currentIndex: number;
  onSelectVideo: (index: number) => void;
}

export function PlaylistPanel({ videos, currentIndex, onSelectVideo }: PlaylistPanelProps) {
  if (videos.length === 0) {
    return null;
  }

  const completedCount = videos.filter(v => v.isCompleted).length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Playlist</h3>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{videos.length} done
        </Badge>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="p-2 space-y-1">
          {videos.map((video) => {
            const isCurrent = video.index === currentIndex;
            return (
              <button
                key={video.videoId}
                onClick={() => onSelectVideo(video.index)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                  isCurrent 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="text-xs text-muted-foreground w-6">
                  {video.index + 1}.
                </span>
                {video.isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`flex-1 text-sm truncate font-mono ${isCurrent ? 'text-primary font-medium' : ''}`}>
                  {video.videoId}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
