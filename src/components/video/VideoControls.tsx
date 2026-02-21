import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward
} from 'lucide-react';
import { EVENT_TEMPLATES, EventType } from '@/types/basketball';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onRestart: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onQuickAction?: (type: EventType, label: string, icon: string) => void;
  isSkipping?: boolean;
  onToggleSkip?: () => void;
}

export function VideoControls({
  isPlaying,
  currentTime,
  onPlayPause,
  onSeekBackward,
  onSeekForward,
  onRestart,
  onToggleMute,
  isMuted = false,
  onQuickAction,
  isSkipping = false,
  onToggleSkip
}: VideoControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Time Display */}
          <div className="text-sm font-mono font-medium text-muted-foreground min-w-[60px]">
            {formatTime(currentTime)}
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRestart}
              className="h-8 w-8 p-0"
              title="Restart video"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onSeekBackward}
              className="h-8 px-2 gap-1"
              title="Go back 10 seconds"
            >
              <SkipBack className="h-4 w-4" />
              <span className="text-xs">10s</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={onPlayPause}
              className="h-10 w-10 p-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onSeekForward}
              className="h-8 px-2 gap-1"
              title="Go forward 15 seconds"
            >
              <span className="text-xs">15s</span>
              <SkipForward className="h-4 w-4" />
            </Button>

            {onToggleMute && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleMute}
                className="h-8 w-8 p-0"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}

            {onToggleSkip && (
              <Button
                variant={isSkipping ? "default" : "outline"}
                size="sm"
                onClick={onToggleSkip}
                className={`h-8 gap-2 text-xs transition-colors ${isSkipping ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                title="Pausen überspringen"
              >
                <FastForward className="h-4 w-4" />
                <span className="hidden sm:inline">Skip Pauses</span>
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {EVENT_TEMPLATES
              .filter(template => !template.requiresPlayer)
              .map(template => (
                <Button
                  key={template.type}
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickAction?.(template.type, template.label, template.icon)}
                  className="h-8 px-2 gap-1 text-xs"
                  title={template.label}
                >
                  <span className="text-sm">{template.icon}</span>
                  {template.label}
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
