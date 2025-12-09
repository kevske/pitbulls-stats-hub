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

export function useYouTubePlayer({ 
  videoId, 
  playlistId, 
  onTimeUpdate, 
  onStateChange,
  onPlaylistReady,
  onVideoChange,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const timeIntervalRef = useRef<number | null>(null);
  const lastVideoIndexRef = useRef<number>(-1);
  const isNavigatingRef = useRef(false);

  const loadYouTubeAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded');
        resolve();
        return;
      }

      console.log('Loading YouTube API...');
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existingScript) {
        console.log('YouTube API script already exists, waiting for ready...');
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API ready via existing script');
          resolve();
        };
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready via new script');
        resolve();
      };

      // Add timeout in case API fails to load
      const timeout = setTimeout(() => {
        if (!window.YT || !window.YT.Player) {
          console.error('YouTube API failed to load within timeout');
          reject(new Error('YouTube API failed to load'));
        }
      }, 10000); // 10 second timeout
    });
  }, []);

  const checkVideoChange = useCallback((player: YTPlayer) => {
    const playlist = player.getPlaylist();
    const currentIndex = player.getPlaylistIndex();
    
    if (playlist && currentIndex !== lastVideoIndexRef.current) {
      lastVideoIndexRef.current = currentIndex;
      const currentVideoId = playlist[currentIndex];
      onVideoChange?.(currentVideoId, currentIndex);
    }
  }, [onVideoChange]);

  const initPlayer = useCallback(async () => {
    if (!containerRef.current) return;
    if (!videoId && !playlistId) return;

    // Skip initialization if we're currently navigating
    if (isNavigatingRef.current) {
      console.log('Currently navigating, skipping initialization');
      return;
    }

    console.log('Initializing YouTube player:', { videoId, playlistId });
    
    // Don't reinitialize if we already have a player with same playlist/video
    if (playerRef.current) {
      try {
        const currentPlaylist = playerRef.current.getPlaylist();
        if (playlistId && currentPlaylist && currentPlaylist.length > 0) {
          console.log('Player already exists with same playlist, skipping reinitialization');
          return;
        }
        if (videoId && playerRef.current.getVideoData().video_id === videoId) {
          console.log('Player already exists with same video, skipping reinitialization');
          return;
        }
      } catch (error) {
        console.log('Error checking existing player, will reinitialize:', error);
      }
      playerRef.current.destroy();
    }

    try {
      await loadYouTubeAPI();
    } catch (error) {
      console.error('Failed to load YouTube API:', error);
      return;
    }

    const playerVars: any = {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
      enablejsapi: 1,
      widgetid: 1,
    };

    // If playlist, add playlist params
    if (playlistId) {
      playerVars.list = playlistId;
      playerVars.listType = 'playlist';
      // For playlists, don't set videoId initially
      delete playerVars.videoId;
      console.log('Setting playlist params:', { playlistId, playerVars });
    } else if (videoId) {
      playerVars.videoId = videoId;
    }

    console.log('Creating YouTube player with config:', { videoId, playerVars });
    
    try {
      const playerConfig: YTPlayerOptions = {
        playerVars,
        events: {
          onReady: (event) => {
            console.log('YouTube player ready:', event.target);
            setIsReady(true);
            
            // If playlist, get the video list after a short delay
            if (playlistId) {
              setTimeout(() => {
                const player = event.target;
                const playlist = player.getPlaylist();
                const currentIndex = player.getPlaylistIndex();
                console.log('Playlist data:', { playlist, currentIndex });
                if (playlist) {
                  lastVideoIndexRef.current = currentIndex;
                  onPlaylistReady?.(playlist, currentIndex);
                } else {
                  console.error('Failed to get playlist data');
                }
              }, 1000);
            }
          },
          onStateChange: (event: YTEvent) => {
            const state = event.data;
            console.log('Player state changed:', state);
            setIsPlaying(state === window.YT.PlayerState.PLAYING);
            onStateChange?.(state);

            // Check for video change in playlist
            if (playlistId) {
              checkVideoChange(event.target);
            }

            if (state === window.YT.PlayerState.PLAYING) {
              timeIntervalRef.current = window.setInterval(() => {
                if (playerRef.current) {
                  const time = playerRef.current.getCurrentTime();
                  setCurrentTime(time);
                  onTimeUpdate?.(time);
                  
                  // Also check for video change periodically
                  if (playlistId) {
                    checkVideoChange(playerRef.current);
                  }
                }
              }, 100);
            } else if (timeIntervalRef.current) {
              clearInterval(timeIntervalRef.current);
              timeIntervalRef.current = null;
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            const errorCode = event.data;
            
            switch (errorCode) {
              case 2:
                console.error('Invalid parameter - check video/playlist ID');
                break;
              case 5:
                console.error('HTML5 player error or unsupported content');
                break;
              case 100:
                console.error('Video not found or removed');
                break;
              case 101:
              case 150:
                console.error('Video cannot be played in embedded player - this is common for playlists or restricted videos');
                // Try to reload with different parameters for error 150
                if (playlistId && errorCode === 150) {
                  console.log('Attempting to reload playlist with different parameters...');
                  setTimeout(() => {
                    if (playerRef.current) {
                      playerRef.current.destroy();
                      // Retry without some restrictive parameters
                      const retryPlayerVars = { ...playerVars };
                      delete retryPlayerVars.origin;
                      delete retryPlayerVars.widgetid;
                      
                      playerRef.current = new window.YT.Player(containerRef.current, {
                        ...playerConfig,
                        playerVars: retryPlayerVars
                      });
                    }
                  }, 1000);
                }
                break;
              default:
                console.error('Unknown YouTube player error');
            }
          }
        },
      };
      
      // Only add videoId if it's not a playlist
      if (!playlistId && videoId) {
        playerConfig.videoId = videoId;
      }
      
      console.log('Final player config:', playerConfig);
      playerRef.current = new window.YT.Player(containerRef.current, playerConfig);
    } catch (error) {
      console.error('Failed to create YouTube player:', error);
    }
  }, [videoId, playlistId, loadYouTubeAPI, onTimeUpdate, onStateChange, onPlaylistReady, checkVideoChange]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [initPlayer]);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const playVideoAt = useCallback((index: number) => {
    console.log('playVideoAt called with index:', index);
    if (playerRef.current) {
      const playlist = playerRef.current.getPlaylist();
      const currentIndex = playerRef.current.getPlaylistIndex();
      console.log('Before playVideoAt - playlist length:', playlist?.length, 'current index:', currentIndex);
      
      playerRef.current.playVideoAt(index);
      
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.getPlaylistIndex === 'function') {
          const newIndex = playerRef.current.getPlaylistIndex();
          console.log('After playVideoAt - new index:', newIndex);
        } else {
          console.log('Player not ready or getPlaylistIndex not available');
        }
      }, 500);
    } else {
      console.log('playerRef.current is null');
    }
  }, []);

  const nextVideo = useCallback(() => {
    console.log('nextVideo called');
    isNavigatingRef.current = true;
    if (playerRef.current) {
      playerRef.current.nextVideo();
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  }, []);

  const previousVideo = useCallback(() => {
    console.log('previousVideo called');
    isNavigatingRef.current = true;
    if (playerRef.current) {
      playerRef.current.previousVideo();
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  }, []);

  const playVideo = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pauseVideo = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  return {
    containerRef,
    isReady,
    isPlaying,
    currentTime,
    getCurrentTime,
    seekTo,
    playVideo,
    pauseVideo,
    playVideoAt,
    nextVideo,
    previousVideo,
  };
}
