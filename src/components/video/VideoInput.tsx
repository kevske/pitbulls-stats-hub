import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { extractVideoId as extractVideoInfo } from '@/utils/videoUtils';

interface VideoInputProps {
  onVideoSelect: (videoId: string, playlistId?: string) => void;
  onAddToQueue?: (videoId: string) => void;
  showQueueOption?: boolean;
}

export function VideoInput({ onVideoSelect, onAddToQueue, showQueueOption = false }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { videoId, playlistId } = extractVideoInfo(url);
    
    if (playlistId) {
      // Playlist URL - pass playlist ID (videoId might be null for playlist-only URLs)
      setError('');
      onVideoSelect(videoId || '', playlistId);
    } else if (videoId) {
      // Single video URL
      setError('');
      onVideoSelect(videoId);
    } else {
      setError('Invalid YouTube URL, video ID, or playlist URL');
    }
  };

  const handleAddToQueue = () => {
    const { videoId, playlistId } = extractVideoInfo(url);
    
    if (videoId && !playlistId && onAddToQueue) {
      setError('');
      onAddToQueue(videoId);
      setUrl('');
    } else if (playlistId) {
      setError('Cannot add playlist to queue. Load playlist directly.');
    } else if (!videoId) {
      setError('Invalid YouTube URL or video ID');
    } else if (!onAddToQueue) {
      setError('Queue functionality not available');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter YouTube URL, video ID, or playlist URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-card/50 backdrop-blur-sm border-border/50"
        />
        <Button type="submit" className="gap-2">
          <Play className="h-4 w-4" />
          Load
        </Button>
      </form>
      
      {showQueueOption && onAddToQueue && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddToQueue}
            className="gap-2"
            disabled={!url.trim()}
          >
            Add to Queue
          </Button>
        </div>
      )}
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
