import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { cn } from '@/lib/utils';
import { forwardRef, useImperativeHandle } from 'react';

interface YouTubePlayerProps {
  videoId?: string;
  playlistId?: string;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: number) => void;
  onPlaylistReady?: (videoIds: string[], currentIndex: number) => void;
  onVideoChange?: (videoId: string, index: number) => void;
  className?: string;
}

export interface YouTubePlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
  playVideoAt: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({
  videoId,
  playlistId,
  onTimeUpdate,
  onStateChange,
  onPlaylistReady,
  onVideoChange,
  className
}, ref) => {
  const { containerRef, isReady, playVideo, pauseVideo, seekTo, playVideoAt, nextVideo, previousVideo } = useYouTubePlayer({
    videoId,
    playlistId,
    onTimeUpdate,
    onStateChange,
    onPlaylistReady,
    onVideoChange,
  });

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    playVideo,
    pauseVideo,
    seekTo,
    playVideoAt,
    nextVideo,
    previousVideo,
  }), [playVideo, pauseVideo, seekTo, playVideoAt, nextVideo, previousVideo]);

  return (
    <div className={cn('relative w-full aspect-video rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50', className)}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading player...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});
