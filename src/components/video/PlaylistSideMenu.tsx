import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  PlayCircle,
  CheckCircle,
  Circle,
  Menu,
  ExternalLink
} from 'lucide-react';

export interface PlaylistVideo {
  videoId: string;
  index: number;
  isCompleted: boolean;
  title?: string;
}

interface PlaylistSideMenuProps {
  videos: PlaylistVideo[];
  currentIndex: number;
  onSelectVideo: (index: number) => void;
  onAddToQueue: (videoId: string) => void;
  onRemoveFromQueue: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function PlaylistSideMenu({
  videos,
  currentIndex,
  onSelectVideo,
  onAddToQueue,
  onRemoveFromQueue,
  isOpen,
  onToggle
}: PlaylistSideMenuProps) {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const extractVideoId = (url: string): string | null => {
    const trimmedUrl = url.trim();

    // Check for video URL patterns
    const videoPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/,
    ];

    for (const pattern of videoPatterns) {
      const match = trimmedUrl.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(newVideoUrl);

    if (videoId) {
      onAddToQueue(videoId);
      setNewVideoUrl('');
      setShowAddForm(false);
    }
  };

  const completedCount = videos.filter(v => v.isCompleted).length;

  return (
    <>

      {/* Side Menu */}
      <div className={`fixed top-0 right-0 h-full bg-background/95 backdrop-blur-sm border-l border-border/50 transition-transform duration-300 z-[60] ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="w-80 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Video Queue</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{completedCount}/{videos.length} completed</span>
              {videos.length > 0 && (
                <span>Current: {currentIndex + 1}</span>
              )}
            </div>
          </div>

          {/* Add Video Section */}
          <div className="p-4 border-b border-border/50">
            {!showAddForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Video to Queue
              </Button>
            ) : (
              <form onSubmit={handleAddVideo} className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter YouTube URL or video ID..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="bg-card/50"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewVideoUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Video List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No videos in queue</p>
                  <p className="text-xs mt-1">Add a video to get started</p>
                </div>
              ) : (
                videos.map((video, index) => {
                  const isCurrent = index === currentIndex;
                  return (
                    <Card
                      key={`${video.videoId}-${index}`}
                      className={`cursor-pointer transition-all ${isCurrent
                          ? 'bg-primary/10 border-primary/30'
                          : 'hover:bg-accent/50'
                        }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground w-6 text-center">
                              {index + 1}
                            </span>
                            {video.isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-mono truncate mb-1 ${isCurrent ? 'text-primary font-medium' : ''
                                }`}
                            >
                              {video.title || video.videoId}
                            </div>

                            <div className="flex items-center gap-2">
                              {isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Playing
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onSelectVideo(index);
                                  onToggle(); // Close menu for better visibility
                                }}
                                className="h-6 px-2 text-xs"
                                disabled={isCurrent}
                              >
                                {isCurrent ? 'Current' : 'Play'}
                              </Button>

                              {!isCurrent && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveFromQueue(index)}
                                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectVideo(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || videos.length === 0}
                className="flex-1 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectVideo(Math.min(videos.length - 1, currentIndex + 1))}
                disabled={currentIndex === videos.length - 1 || videos.length === 0}
                className="flex-1 gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
