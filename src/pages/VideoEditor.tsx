import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Player, TaggedEvent, DEFAULT_PLAYERS, Position, PositionType, generateEventDescription, formatTime } from '@/types/basketball';
import { YouTubePlayer, YouTubePlayerRef } from '@/components/video/YouTubePlayer';
import { VideoInput } from '@/components/video/VideoInput';
import { VideoControls } from '@/components/video/VideoControls';
import { EventInput } from '@/components/video/EventInput';
import { EventList } from '@/components/video/EventList';
import { PlayerManager } from '@/components/video/PlayerManager';
import { Statistics } from '@/components/video/Statistics';
import { ExportPanel } from '@/components/video/ExportPanel';
import { VideoStatsIntegration } from '@/components/video/VideoStatsIntegration';
import { PlaylistPanel, PlaylistVideo } from '@/components/video/PlaylistPanel';
import { PlaylistSideMenu } from '@/components/video/PlaylistSideMenu';
import { CurrentPlayersOnField } from '@/components/video/CurrentPlayersOnField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, List, Upload, FileText, Plus, Save } from 'lucide-react';
import { generateSaveData, SaveData, compareTimestamps, updateLastModified } from '@/lib/saveLoad';
import { loadSaveFile } from '@/lib/saveLoad';
import { VideoProjectService } from '@/lib/videoProjectService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useSearchParams } from 'react-router-dom';

const VideoEditor = () => {
  const [searchParams] = useSearchParams();
  const gameNumber = searchParams.get('game');
  const videoUrl = searchParams.get('video');


  // JSONBin storage removed - using Supabase VideoProjectService check


  const [videoId, setVideoId] = useState('');
  const [playlistId, setPlaylistId] = useState<string | undefined>();
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [events, setEvents] = useState<TaggedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const seekToRef = useRef<((time: number) => void) | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
  const [lastSavedData, setLastSavedData] = useState<SaveData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playlist state
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());

  // Side menu state
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isQueueMode, setIsQueueMode] = useState(false);
  const [currentPlayersOnCourt, setCurrentPlayersOnCourt] = useState<Player[]>([]);
  const [shouldResetPlayers, setShouldResetPlayers] = useState(false);

  // Timestamp conflict state
  const [timestampConflict, setTimestampConflict] = useState<{
    hasConflict: boolean;
    localIsNewer: boolean;
    comparison: any;
  } | null>(null);

  // Load data with timestamp checking
  const loadWithTimestampCheck = async (
    gameNumber: string,
    videoIndex: number
  ) => {
    try {
      console.log('Loading data with timestamp check:', { gameNumber, videoIndex });

      // Get remote metadata first to check timestamp
      const remoteMeta = await VideoProjectService.getProjectMeta(gameNumber, videoIndex);

      // Load the actual data
      const projectData = await VideoProjectService.loadProject(gameNumber, videoIndex);

      if (projectData) {
        const localTimestamp = lastSavedData?.lastModified || lastSavedData?.timestamp;
        const remoteTimestamp = remoteMeta?.lastModified;

        if (localTimestamp && remoteTimestamp) {
          // Compare timestamps
          const comparison = compareTimestamps(localTimestamp, remoteTimestamp);

          console.log('Timestamp comparison:', comparison);

          if (!comparison.isSame) {
            setTimestampConflict({
              hasConflict: true,
              localIsNewer: comparison.isNewer,
              comparison
            });

            if (comparison.isOlder) {
              toast.warning(`Remote version is newer: ${comparison.summary}`);
            } else {
              toast.info(`Local version is newer: ${comparison.summary}`);
            }
          } else {
            setTimestampConflict(null);
          }
        } else {
          setTimestampConflict(null);
        }

        // Load the data
        setEvents(projectData.events);
        setPlayers(projectData.players);
        if (projectData.videoId) setVideoId(projectData.videoId);
        if (projectData.playlistId) setPlaylistId(projectData.playlistId);

        setLastSavedData(projectData);
        toast.success(`Loaded project for video ${videoIndex}`);
      } else {
        console.log('No saved data found on Supabase');
        if (lastSavedData?.events?.length && lastSavedData.videoIndex !== videoIndex) {
          setEvents([]);
          setLastSavedData(null);
          setTimestampConflict(null);
        } else if (!lastSavedData && events.length === 0) {
          setLastSavedData(null);
          setTimestampConflict(null);
        } else {
          setEvents([]);
          setLastSavedData(null);
          setTimestampConflict(null);
        }
      }
    } catch (error) {
      console.error('Error in loadWithTimestampCheck:', error);
    }
  };

  // Handle URL parameters and load game data
  useEffect(() => {
    const initializeFromParams = async () => {
      // 1. Handle URL params for Video/Playlist
      if (videoUrl) {
        const playlistMatch = videoUrl.match(/embed\/videoseries\?list=([^&]+)/);
        if (playlistMatch) {
          setPlaylistId(playlistMatch[1]);
        } else {
          const videoIdMatch = videoUrl.match(/embed\/([^?]+)/);
          if (videoIdMatch) {
            setVideoId(videoIdMatch[1]);
          }
        }
      }

      // 2. Load Game Data if game number exists
      if (gameNumber) {
        await loadWithTimestampCheck(gameNumber, currentPlaylistIndex + 1);
      }
    };

    initializeFromParams();
  }, [gameNumber, videoUrl, currentPlaylistIndex]);

  // Manual save function
  const handleSaveToStorage = async () => {
    if (!gameNumber) {
      toast.error('No game number specified');
      return;
    }

    try {
      const now = new Date().toISOString();
      const saveData: SaveData = {
        gameNumber: parseInt(gameNumber),
        videoIndex: currentPlaylistIndex + 1,
        events,
        players,
        videoId,
        playlistId,
        timestamp: now,
        lastModified: now,
        version: '1.0.0'
      };

      console.log('Saving data to Supabase:', saveData);

      const savedId = await VideoProjectService.saveProject(saveData);

      if (savedId) {
        toast.success(`Saved to Supabase`);
        setLastSavedData(saveData);
        setTimestampConflict(null);
      } else {
        toast.error('Failed to save to Supabase - check console');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(`Failed to save data: ${(error as Error).message}`);
    }
  };

  // Autosave and Realtime
  useEffect(() => {
    if (!gameNumber) return;

    // 1. Realtime Subscription
    const channelName = `video_project:${gameNumber}:${currentPlaylistIndex + 1}`;
    console.log('Subscribing to realtime channel:', channelName);

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_projects',
          filter: `game_number=eq.${gameNumber}` // We filter further in callback
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          const newData = payload.new as any;

          // Ensure it matches our current video
          if (newData.video_index !== (currentPlaylistIndex + 1)) return;

          const remoteLastModified = newData.updated_at;
          const localLastModified = lastSavedData?.lastModified;

          // If remote is newer than what we have loaded/saved
          if (remoteLastModified && (!localLastModified || new Date(remoteLastModified) > new Date(localLastModified))) {
            console.log('Remote change detected, auto-updating...');
            toast.info('Remote changes detected. Updating...');

            const projectData = newData.data;
            setEvents(projectData.events || []);
            setPlayers(projectData.players || []);
            if (newData.video_id) setVideoId(newData.video_id);
            if (newData.playlist_id) setPlaylistId(newData.playlist_id);

            setLastSavedData({
              gameNumber: parseInt(newData.game_number),
              videoIndex: newData.video_index,
              videoId: newData.video_id,
              playlistId: newData.playlist_id,
              events: projectData.events || [],
              players: projectData.players || [],
              metadata: projectData.metadata,
              timestamp: newData.created_at,
              lastModified: newData.updated_at,
              version: '1.0.0'
            });

            // Clear any conflict warnings since we just synced
            setTimestampConflict(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [gameNumber, currentPlaylistIndex, lastSavedData]);

  // Auto-save debounce
  useEffect(() => {
    if (!gameNumber || !events.length) return;

    const timeoutId = setTimeout(async () => {
      // Check if changes exist compared to last saved
      const hasUnsavedChanges = !lastSavedData ||
        JSON.stringify(events) !== JSON.stringify(lastSavedData.events) ||
        JSON.stringify(players) !== JSON.stringify(lastSavedData.players);

      if (hasUnsavedChanges) {
        console.log('Auto-saving changes...');
        const now = new Date().toISOString();
        const saveData: SaveData = {
          gameNumber: parseInt(gameNumber),
          videoIndex: currentPlaylistIndex + 1,
          events,
          players,
          videoId,
          playlistId,
          timestamp: now,
          lastModified: now,
          version: '1.0.0'
        };

        const savedId = await VideoProjectService.saveProject(saveData);
        if (savedId) {
          setLastSavedData(saveData);
          // toast.success('Auto-saved'); // Optional: don't spam toasts
        }
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [events, players, gameNumber, currentPlaylistIndex, videoId, playlistId, lastSavedData]);

  // Exit protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (events.length > 0) {
        const hasUnsaved = lastSavedData === null ||
          JSON.stringify(events.sort((a, b) => a.timestamp - b.timestamp)) !==
          JSON.stringify(lastSavedData.events.sort((a, b) => a.timestamp - b.timestamp));

        if (hasUnsaved) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [events, lastSavedData]);

  const handleLoadData = useCallback((saveData: SaveData) => {
    console.log('Loading data:', saveData);
    setPlayers(saveData.players);
    setEvents(saveData.events);
    setVideoId(saveData.videoId || '');
    setPlaylistId(saveData.playlistId);
    setLastSavedData(saveData);
    // Reset current players on court - user will select manually in edit mode
    console.log('Setting shouldResetPlayers to true');
    setShouldResetPlayers(true);
    setCurrentPlayersOnCourt([]); // Clear current players
    // Reset the trigger after a short delay
    setTimeout(() => {
      console.log('Setting shouldResetPlayers to false');
      setShouldResetPlayers(false);
    }, 100);
  }, []);

  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const saveData = await loadSaveFile(file);
      handleLoadData(saveData);
      toast.success('Project loaded successfully!');
    } catch (error) {
      toast.error('Failed to load project: ' + (error as Error).message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sort players by last substitution out (most recent first)
  const sortedPlayers = useMemo(() => {
    const lastSubOut: Record<string, number> = {};

    events.forEach((event) => {
      if (event.type === 'substitution' && event.substitutionOut) {
        lastSubOut[event.substitutionOut] = event.timestamp;
      }
    });

    return [...players].sort((a, b) => {
      const aTime = lastSubOut[a.name] ?? -1;
      const bTime = lastSubOut[b.name] ?? -1;
      return bTime - aTime;
    });
  }, [players, events]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleStateChange = useCallback((state: number) => {
    setIsPlaying(state === 1);
  }, []);

  const handleVideoSelect = (selectedVideoId: string, selectedPlaylistId?: string) => {
    if (selectedPlaylistId) {
      setPlaylistId(selectedPlaylistId);
      setVideoId(selectedVideoId);
      setIsQueueMode(false);
    } else {
      setPlaylistId(undefined);
      setVideoId(selectedVideoId);
      setIsQueueMode(false);
    }
  };

  const handleAddToQueue = (newVideoId: string) => {
    const newVideo: PlaylistVideo = {
      videoId: newVideoId,
      index: playlistVideos.length,
      isCompleted: false,
    };
    setPlaylistVideos(prev => [...prev, newVideo]);

    // If this is the first video and no video is currently loaded, start playing it
    if (playlistVideos.length === 0 && !videoId) {
      setVideoId(newVideoId);
      setCurrentPlaylistIndex(0);
      setIsQueueMode(true);
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    setPlaylistVideos(prev => {
      const newVideos = prev.filter((_, i) => i !== index);
      // Re-index the remaining videos
      return newVideos.map((video, i) => ({ ...video, index: i }));
    });

    // Adjust current index if necessary
    if (index < currentPlaylistIndex) {
      setCurrentPlaylistIndex(prev => prev - 1);
    } else if (index === currentPlaylistIndex && playlistVideos.length > 1) {
      setCurrentPlaylistIndex(0);
    }
  };

  const handlePlaylistReady = useCallback((videoIds: string[], currentIndex: number) => {
    const videos: PlaylistVideo[] = videoIds.map((id, idx) => ({
      videoId: id,
      index: idx,
      isCompleted: completedVideos.has(id),
    }));
    setPlaylistVideos(videos);
    setCurrentPlaylistIndex(currentIndex);
  }, [completedVideos]);

  const handleVideoChange = useCallback((newVideoId: string, index: number) => {
    if (isQueueMode) {
      setCurrentPlaylistIndex(index);
    } else {
      setCurrentPlaylistIndex(index);
    }
    // Reset time for new video
    setCurrentTime(0);
    // Clear events when switching to a different video
    setEvents([]);
  }, [isQueueMode]);

  const handleSelectPlaylistVideo = useCallback((index: number) => {
    console.log('handleSelectPlaylistVideo called:', { index, isQueueMode, playlistVideosLength: playlistVideos.length });

    if (playlistVideos[index]) {
      // Use playVideoAt to switch to the specific video in the playlist
      console.log('Switching to video at index:', index, 'videoId:', playlistVideos[index].videoId);
      setCurrentPlaylistIndex(index);

      // Use the YouTube player's playVideoAt method
      youtubePlayerRef.current?.playVideoAt(index);
    }
  }, [playlistVideos]);

  const handleMarkVideoComplete = useCallback(() => {
    if (playlistVideos.length > 0) {
      const currentVideoId = playlistVideos[currentPlaylistIndex]?.videoId;
      if (currentVideoId) {
        setCompletedVideos(prev => new Set([...prev, currentVideoId]));
        setPlaylistVideos(prev => prev.map(v =>
          v.videoId === currentVideoId ? { ...v, isCompleted: true } : v
        ));
      }
    }
  }, [playlistVideos, currentPlaylistIndex]);

  const handleNextVideo = useCallback(() => {
    if (currentPlaylistIndex < playlistVideos.length - 1) {
      handleMarkVideoComplete();
      handleSelectPlaylistVideo(currentPlaylistIndex + 1);
    }
  }, [currentPlaylistIndex, playlistVideos.length, handleMarkVideoComplete, handleSelectPlaylistVideo]);

  const handlePrevVideo = useCallback(() => {
    if (currentPlaylistIndex > 0) {
      handleSelectPlaylistVideo(currentPlaylistIndex - 1);
    }
  }, [currentPlaylistIndex, handleSelectPlaylistVideo]);

  const handleAddPlayer = (name: string, jerseyNumber: number, position: PositionType) => {
    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name, jerseyNumber, position }]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleQuickAction = (type: string, label: string, icon: string) => {
    const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: type as any,
    };

    handleAddEvent(eventData);
  };

  const handleAddEvent = (event: Omit<TaggedEvent, 'id' | 'description'>) => {
    // Generate the complete event
    const completeEvent: TaggedEvent = {
      ...event,
      id: crypto.randomUUID(),
      description: generateEventDescription(event),
    };

    // Add video context for playlist mode
    const eventWithVideo: TaggedEvent = {
      ...completeEvent,
      description: completeEvent.description,
    };
    setEvents((prev) => [...prev, eventWithVideo]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSeekTo = (timestamp: number) => {
    youtubePlayerRef.current?.seekTo(timestamp);
    setCurrentTime(timestamp);
  };

  // Video control functions
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      youtubePlayerRef.current?.pauseVideo();
    } else {
      youtubePlayerRef.current?.playVideo();
    }
  }, [isPlaying]);

  const handleSeekBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    youtubePlayerRef.current?.seekTo(newTime);
    setCurrentTime(newTime);
  }, [currentTime]);

  const handleSeekForward = useCallback(() => {
    const newTime = currentTime + 15;
    youtubePlayerRef.current?.seekTo(newTime);
    setCurrentTime(newTime);
  }, [currentTime]);

  const handleRestart = useCallback(() => {
    youtubePlayerRef.current?.seekTo(0);
    setCurrentTime(0);
  }, []);

  // Calculate available players (bench players)
  const availablePlayers = useMemo(() => {
    const currentPlayerNames = new Set(currentPlayersOnCourt.map(p => p.name));
    return players.filter(player => !currentPlayerNames.has(player.name));
  }, [players, currentPlayersOnCourt]);

  const isPlaylistMode = playlistVideos.length > 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏀</span>
                <h1 className="text-xl font-bold">Basketball Event Tagger</h1>
              </div>
              {isPlaylistMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
                    className="h-8 px-3 gap-2"
                  >
                    <List className="h-4 w-4" />
                    Show Queue
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {!videoId && !playlistId ? (
            /* Video Input Screen */
            <div className="max-w-2xl mx-auto mt-20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Tag Basketball Events Live</h2>
                <p className="text-muted-foreground">
                  Enter a YouTube URL, video ID, or playlist URL to start tagging, or load a saved project.
                </p>
              </div>

              {/* Input Options */}
              <div className="space-y-6">
                {/* Load File Option */}
                <div className="p-6 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Load Saved Project</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Load a previously saved project to restore tags and video
                  </p>
                  <Button onClick={handleLoadFile} className="w-full gap-2">
                    <Upload className="h-4 w-4" />
                    Load Project File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/50"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 h-px bg-border/50"></div>
                </div>

                {/* Video Input Option */}
                <div className="p-6 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <List className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Start New Project</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter a YouTube URL, video ID, or playlist URL to start tagging
                  </p>
                  <VideoInput
                    onVideoSelect={handleVideoSelect}
                    onAddToQueue={handleAddToQueue}
                    showQueueOption={true}
                  />
                </div>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="text-2xl mb-2">⏱️</div>
                  <h3 className="font-semibold mb-1">Real-time Tagging</h3>
                  <p className="text-xs text-muted-foreground">Tag events as they happen during playback</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="text-2xl mb-2">📋</div>
                  <h3 className="font-semibold mb-1">Playlist Support</h3>
                  <p className="text-xs text-muted-foreground">Process entire playlists with video queue</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold mb-1">Easy Export</h3>
                  <p className="text-xs text-muted-foreground">Copy timestamps for YouTube descriptions</p>
                </div>
              </div>
            </div>
          ) : (
            /* Main Tagging Interface */
            <div className="space-y-6">
              {/* Video Controls - Top */}
              <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlayPause={handlePlayPause}
                onSeekBackward={handleSeekBackward}
                onSeekForward={handleSeekForward}
                onRestart={handleRestart}
                onQuickAction={handleQuickAction}
              />

              {/* Video Player and Game Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player - Takes 2 columns on large screens */}
                <div className="lg:col-span-2 space-y-4">
                  <YouTubePlayer
                    ref={youtubePlayerRef}
                    videoId={videoId || undefined}
                    playlistId={playlistId}
                    onTimeUpdate={handleTimeUpdate}
                    onStateChange={handleStateChange}
                    onPlaylistReady={handlePlaylistReady}
                    onVideoChange={handleVideoChange}
                  />


                  {/* Save Button */}
                  <Button onClick={handleSaveToStorage} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save to Cloud Storage
                  </Button>

                  {/* Timestamp Conflict Alert */}
                  {timestampConflict && timestampConflict.hasConflict && (
                    <Card className={`border-2 ${timestampConflict.localIsNewer
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
                      }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${timestampConflict.localIsNewer ? 'bg-blue-500' : 'bg-orange-500'
                            }`} />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${timestampConflict.localIsNewer
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-orange-800 dark:text-orange-200'
                              }`}>
                              {timestampConflict.localIsNewer ? 'Local Version is Newer' : 'Remote Version is Newer'}
                            </div>
                            <div className={`text-xs mt-1 ${timestampConflict.localIsNewer
                              ? 'text-blue-600 dark:text-blue-300'
                              : 'text-orange-600 dark:text-orange-300'
                              }`}>
                              {timestampConflict.comparison.summary}
                            </div>
                            {timestampConflict.localIsNewer ? (
                              <div className="text-xs text-muted-foreground mt-2">
                                Your local changes are newer than the cloud version. Saving will overwrite the remote version.
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-2">
                                The cloud version is newer. Consider loading the latest version before making changes.
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Panel */}
                  <ExportPanel
                    events={events}
                    players={players}
                    videoId={videoId}
                    playlistId={playlistId}
                    onLoadData={handleLoadData}
                    lastSavedData={lastSavedData}
                  />

                  {/* Video Stats Integration */}
                  <VideoStatsIntegration
                    saveData={generateSaveData(players, events, videoId, playlistId)}
                    gameNumber={gameNumber}
                    onIntegrationComplete={(result) => {
                      console.log('Video stats integrated:', result);
                    }}
                  />
                </div>

                {/* Game Tags - Right panel */}
                <div className="space-y-4">

                  {/* Current Players on Field - Always visible */}
                  <CurrentPlayersOnField
                    players={players}
                    events={events}
                    onAddEvent={handleAddEvent}
                    currentTime={currentTime}
                    availablePlayers={availablePlayers}
                    onCurrentPlayersChange={setCurrentPlayersOnCourt}
                    resetOnLoad={shouldResetPlayers}
                  />

                  {/* Tabs for Events, Stats, and Players */}
                  <Tabs defaultValue="events" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                      <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
                      <TabsTrigger value="players" className="flex-1">Players</TabsTrigger>
                    </TabsList>
                    <TabsContent value="events" className="mt-3">
                      <EventList
                        events={events}
                        onDeleteEvent={handleDeleteEvent}
                        onSeekTo={handleSeekTo}
                        currentTime={currentTime}
                      />
                    </TabsContent>
                    <TabsContent value="stats" className="mt-3">
                      <Statistics events={events} players={players} />
                    </TabsContent>
                    <TabsContent value="players" className="mt-3">
                      <PlayerManager
                        players={players}
                        onAddPlayer={handleAddPlayer}
                        onRemovePlayer={handleRemovePlayer}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Keyboard Shortcut Hint */}
        <footer className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
          💡 Tip: Add events while the video plays for accurate timestamps
        </footer>

        {/* Playlist Side Menu */}
        {isPlaylistMode && (
          <PlaylistSideMenu
            videos={playlistVideos}
            currentIndex={currentPlaylistIndex}
            onSelectVideo={handleSelectPlaylistVideo}
            onAddToQueue={handleAddToQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            isOpen={isSideMenuOpen}
            onToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
          />
        )}
      </div>
    </Layout>
  );
};

export default VideoEditor;
