import { useEffect, useRef, useState, useCallback } from 'react';

interface YTPlayer {
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
  playVideoAt: (index: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  getVideoData: () => { video_id: string; title: string };
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YTPlayerState {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
}

interface YTEvent {
  data: number;
  target: YTPlayer;
}

interface YTPlayerOptions {
  videoId?: string;
  playerVars?: {
    autoplay?: number;
    controls?: number;
    modestbranding?: number;
    rel?: number;
    list?: string;
    listType?: string;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: YTEvent) => void;
    onError?: (event: { target: YTPlayer; data: number }) => void;
  };
}

interface YTGlobal {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
  PlayerState: YTPlayerState;
}

declare global {
  interface Window {
    YT: YTGlobal;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerOptions {
  videoId?: string;
  playlistId?: string;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: number) => void;
  onPlaylistReady?: (videoIds: string[], currentIndex: number) => void;
  onVideoChange?: (videoId: string, index: number) => void;
}

export const useYouTubePlayer = ({
  videoId,
  playlistId,
  onTimeUpdate,
  onStateChange,
  onPlaylistReady,
  onVideoChange,
}: UseYouTubePlayerOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);

  const loadYouTubeAPI = useCallback(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !window.YT) return;

    const playerVars: any = {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    };

    if (playlistId) {
      playerVars.list = playlistId;
      playerVars.listType = 'playlist';
    } else if (videoId) {
      playerVars.videoId = videoId;
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: playlistId ? undefined : videoId,
      playerVars,
      events: {
        onReady: (event) => {
          setIsReady(true);
          
          // Start time updates
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          intervalRef.current = setInterval(() => {
            if (playerRef.current) {
              const currentTime = playerRef.current.getCurrentTime();
              onTimeUpdate?.(currentTime);
            }
          }, 100);

          // Handle playlist
          if (playlistId && playerRef.current) {
            const playlist = playerRef.current.getPlaylist();
            const currentIndex = playerRef.current.getPlaylistIndex();
            if (playlist) {
              onPlaylistReady?.(playlist, currentIndex);
            }
          }
        },
        onStateChange: (event) => {
          onStateChange?.(event.data);
          
          // Handle video change in playlist
          if (event.data === window.YT.PlayerState.PLAYING && playlistId && playerRef.current) {
            const videoData = playerRef.current.getVideoData();
            const playlist = playerRef.current.getPlaylist();
            const currentIndex = playerRef.current.getPlaylistIndex();
            if (playlist && videoData) {
              onVideoChange?.(videoData.video_id, currentIndex);
            }
          }
        },
        onError: (event) => {
          console.error('YouTube player error:', event.data);
        },
      },
    });
  }, [videoId, playlistId, onTimeUpdate, onStateChange, onPlaylistReady, onVideoChange]);

  useEffect(() => {
    if (!window.YT) {
      loadYouTubeAPI();
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, playlistId, loadYouTubeAPI, initializePlayer]);

  const playVideo = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pauseVideo = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

  const playVideoAt = useCallback((index: number) => {
    playerRef.current?.playVideoAt(index);
  }, []);

  const nextVideo = useCallback(() => {
    playerRef.current?.nextVideo();
  }, []);

  const previousVideo = useCallback(() => {
    playerRef.current?.previousVideo();
  }, []);

  return {
    containerRef,
    isReady,
    playVideo,
    pauseVideo,
    seekTo,
    playVideoAt,
    nextVideo,
    previousVideo,
  };
};
