import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface VideoInputProps {
  onVideoSelect: (videoId: string, playlistId?: string) => void;
  onAddToQueue?: (videoId: string) => void;
  showQueueOption?: boolean;
}

function extractVideoInfo(url: string): { videoId: string | null; playlistId: string | null } {
  const trimmedUrl = url.trim();
  
  // Check for playlist URL - handle more complex URLs with additional parameters
  const playlistMatch = trimmedUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const playlistId = playlistMatch ? playlistMatch[1] : null;
  
  console.log('Extracting video info from URL:', { url: trimmedUrl, playlistMatch, playlistId });

  // Check for video URL patterns
  const videoPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/,
  ];

  let videoId: string | null = null;
  for (const pattern of videoPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      videoId = match[1] || match[0];
      break;
    }
  }

  console.log('Video extraction result:', { videoId, playlistId });
  return { videoId, playlistId };
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
