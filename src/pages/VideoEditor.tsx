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
import { PlaylistPanel, PlaylistVideo } from '@/components/video/PlaylistPanel';
import { PlaylistSideMenu } from '@/components/video/PlaylistSideMenu';
import { CurrentPlayersOnField } from '@/components/video/CurrentPlayersOnField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, List, Upload, FileText, Plus, Save } from 'lucide-react';
import { SaveData } from '@/lib/saveLoad';
import { loadSaveFile } from '@/lib/saveLoad';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useJsonBinStorage } from '@/hooks/useJsonBinStorage';
import { jsonbinStorage } from '@/lib/jsonbinStorage';
import { useSearchParams } from 'react-router-dom';

const VideoEditor = () => {
  const [searchParams] = useSearchParams();
  const gameNumber = searchParams.get('game');
  const videoUrl = searchParams.get('video');
  
  // JSONBin storage for game data
  const { data: savedGameData, save: saveGameData, load: loadGameData, create: createGameDataBin } = useJsonBinStorage<any>({
    autoLoad: false
  });
  
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

  // Handle URL parameters and load game data
  useEffect(() => {
    const initializeFromParams = async () => {
      if (videoUrl) {
        // Check if it's a playlist embed URL
        const playlistMatch = videoUrl.match(/embed\/videoseries\?list=([^&]+)/);
        if (playlistMatch) {
          setPlaylistId(playlistMatch[1]);
        } else {
          // Extract video ID from embed URL
          const videoIdMatch = videoUrl.match(/embed\/([^?]+)/);
          if (videoIdMatch) {
            setVideoId(videoIdMatch[1]);
          }
        }
      }

      if (gameNumber) {
        try {
          // Try to load from JSONBin using stored bin ID
          const storageKey = `binId_game-${gameNumber}-video-${currentPlaylistIndex + 1}`;
          const actualBinId = localStorage.getItem(storageKey);
          
          if (actualBinId) {
            await loadGameData(actualBinId);
          } else {
            // No local storage entry - try to find existing bin from MasterBin index
            console.log('No local bin found, searching MasterBin index...');
            
            try {
              // Load the MasterBin index
              const masterBinData = await jsonbinStorage.readBin('693897a8ae596e708f8ea7c2') as { games: Record<string, Record<string, string>> } | null;
              console.log('MasterBin data loaded:', masterBinData);
              console.log('Looking for game:', gameNumber, 'video:', currentPlaylistIndex + 1);
              console.log('Game number type:', typeof gameNumber);
              console.log('Video index type:', typeof (currentPlaylistIndex + 1));
              
              // Use string keys to match MasterBin structure
              const gameNum = gameNumber;
              const videoNum = (currentPlaylistIndex + 1).toString();
              
              if (masterBinData?.games?.[gameNum]?.[videoNum]) {
                const foundBinId = masterBinData.games[gameNum][videoNum];
                console.log('Found bin ID in MasterBin:', foundBinId);
                
                // Save to localStorage for future use
                localStorage.setItem(storageKey, foundBinId);
                await loadGameData(foundBinId);
              } else {
                console.log('No saved bin found for this game/video in MasterBin');
                console.log('Available games:', Object.keys(masterBinData?.games || {}));
                if (masterBinData?.games?.[gameNum]) {
                  console.log('Available videos for game', gameNum, ':', Object.keys(masterBinData.games[gameNum]));
                }
              }
            } catch (error) {
              console.error('Failed to load MasterBin index:', error);
            }
          }
          
          if (savedGameData && savedGameData.events) {
            setEvents(savedGameData.events);
            setLastSavedData({
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              videoId,
              playlistId,
              players: savedGameData.players || DEFAULT_PLAYERS,
              events: savedGameData.events,
              metadata: {
                totalEvents: savedGameData.events.length,
                totalTimeSpan: Math.max(...savedGameData.events.map(e => e.timestamp)),
                exportFormat: 'youtube-timestamps'
              }
            });
          }
        } catch (error) {
          console.log('No saved data found for this game, starting fresh');
        }
      }
    };

    initializeFromParams();
  }, [gameNumber, videoUrl, currentPlaylistIndex, loadGameData]);

  // Manual save function
  const handleSaveToStorage = async () => {
    if (!gameNumber) {
      toast.error('No game number specified');
      return;
    }

    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_JSONBIN_API_KEY;
      console.log('JSONBin API Key available:', !!apiKey);
      
      if (!apiKey) {
        toast.error('JSONBin API key not configured. Add VITE_JSONBIN_API_KEY to .env file');
        return;
      }

      const saveData = {
        gameNumber: parseInt(gameNumber),
        videoIndex: currentPlaylistIndex + 1,
        events,
        players,
        videoId,
        playlistId,
        timestamp: new Date().toISOString()
      };

      console.log('Saving data:', saveData);
      
      // Check if we have an existing bin for this game/video
      const storageKey = `binId_game-${gameNumber}-video-${currentPlaylistIndex + 1}`;
      const existingBinId = localStorage.getItem(storageKey);
      
      let binId;
      if (existingBinId) {
        // Update existing bin
        // Set the current bin ID in the hook, then save
        await loadGameData(existingBinId); // This sets the internal binId
        const success = await saveGameData(saveData);
        binId = success ? existingBinId : null;
      } else {
        // Create new bin
        binId = await createGameDataBin(saveData, `game-${gameNumber}-video-${currentPlaylistIndex + 1}`);
      }
      
      if (binId) {
        // Store the bin ID for this game/video combination
        localStorage.setItem(storageKey, binId);
        
        // Update the MasterBin index
        try {
          console.log('Updating MasterBin index...');
          const masterBinData = await jsonbinStorage.readBin('693897a8ae596e708f8ea7c2') as { games: Record<string, Record<string, string>> } | null || { games: {} };
          console.log('Current MasterBin before update:', masterBinData);
          
          // Use string keys to match MasterBin structure
          const gameNum = gameNumber;
          const videoNum = (currentPlaylistIndex + 1).toString();
          
          console.log(`Adding game ${gameNum}, video ${videoNum} with bin ID: ${binId}`);
          
          // Initialize nested objects if they don't exist
          if (!masterBinData.games) masterBinData.games = {};
          if (!masterBinData.games[gameNum]) masterBinData.games[gameNum] = {};
          
          // Check if we're overwriting an existing video
          if (masterBinData.games[gameNum][videoNum] && masterBinData.games[gameNum][videoNum] !== binId) {
            console.log(`Warning: Overwriting existing bin ID for game ${gameNum}, video ${videoNum}`);
            console.log(`Old: ${masterBinData.games[gameNum][videoNum]}, New: ${binId}`);
          }
          
          // Set the bin ID for this game/video
          masterBinData.games[gameNum][videoNum] = binId;
          
          console.log('MasterBin after update:', masterBinData);
          console.log('All videos for game', gameNum, ':', masterBinData.games[gameNum]);
          
          // Save back to MasterBin
          const updateSuccess = await jsonbinStorage.updateBin('693897a8ae596e708f8ea7c2', masterBinData);
          
          if (updateSuccess) {
            console.log('MasterBin index updated successfully');
          } else {
            console.error('Failed to update MasterBin index');
          }
        } catch (error) {
          console.error('Error updating MasterBin:', error);
        }
        
        toast.success(`Saved to JSONBin: ${binId}`);
        setLastSavedData({
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          videoId,
          playlistId,
          players,
          events,
          metadata: {
            totalEvents: events.length,
            totalTimeSpan: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : 0,
            exportFormat: 'youtube-timestamps'
          }
        });
      } else {
        toast.error('Failed to save to JSONBin - check console for details');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(`Failed to save data: ${(error as Error).message}`);
    }
  };

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
    // Trigger reset of current players on court
    console.log('Setting shouldResetPlayers to true');
    setShouldResetPlayers(true);
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
  }, [isQueueMode]);

  const handleSelectPlaylistVideo = useCallback((index: number) => {
    console.log('handleSelectPlaylistVideo called:', { index, isQueueMode, playlistVideosLength: playlistVideos.length });
    
    if (isQueueMode && playlistVideos[index]) {
      // In queue mode, we need to switch to the video directly
      console.log('Queue mode: switching to video', playlistVideos[index].videoId);
      setVideoId(playlistVideos[index].videoId);
      setCurrentPlaylistIndex(index);
    } else if (playlistVideos[index]) {
      // In playlist mode, get the specific video ID and create a new player instance
      const targetVideoId = playlistVideos[index].videoId;
      console.log('Playlist mode: switching to video ID', targetVideoId, 'at index', index);
      
      // Clear playlist mode and switch to single video mode
      setPlaylistId(undefined);
      setVideoId(targetVideoId);
      setCurrentPlaylistIndex(index);
      
      // Store the original playlist for later if needed
      // This effectively switches from playlist mode to single video mode
    }
  }, [isQueueMode, playlistVideos]);

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
      description: playlistVideos.length > 0 
        ? `[Video ${currentPlaylistIndex + 1}] ${completeEvent.description}`
        : completeEvent.description,
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
                <List className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Video {currentPlaylistIndex + 1} of {playlistVideos.length}
                </span>
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

                {/* Playlist Navigation */}
                {isPlaylistMode && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevVideo}
                      disabled={currentPlaylistIndex === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      <span className="font-mono font-semibold">{playlistVideos[currentPlaylistIndex]?.videoId}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextVideo}
                      disabled={currentPlaylistIndex === playlistVideos.length - 1}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Save Button */}
                <Button onClick={handleSaveToStorage} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Save to Cloud Storage
                </Button>

                {/* Export Panel */}
                <ExportPanel 
                  events={events}
                  players={players}
                  videoId={videoId}
                  playlistId={playlistId}
                  onLoadData={handleLoadData}
                  lastSavedData={lastSavedData}
                />
              </div>

              {/* Game Tags - Right panel */}
              <div className="space-y-4">
                {/* Queue Management - Always visible when in playlist mode */}
                {isPlaylistMode && (
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Video Queue</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {playlistVideos.length} videos
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
                            className="h-6 w-6 p-0"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {/* Add Video Form */}
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Add YouTube video ID or URL..."
                            className="flex-1 h-8 text-xs bg-card/30"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                const url = input.value.trim();
                                if (url) {
                                  // Extract video ID from URL
                                  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                                  const videoId = match ? match[1] : (url.match(/^[a-zA-Z0-9_-]{11}$/) ? url : null);
                                  
                                  if (videoId) {
                                    handleAddToQueue(videoId);
                                    input.value = '';
                                  }
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder*="Add YouTube"]') as HTMLInputElement;
                              if (input) {
                                const url = input.value.trim();
                                if (url) {
                                  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                                  const videoId = match ? match[1] : (url.match(/^[a-zA-Z0-9_-]{11}$/) ? url : null);
                                  
                                  if (videoId) {
                                    handleAddToQueue(videoId);
                                    input.value = '';
                                  }
                                }
                              }
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Current/Next Video Info */}
                        {playlistVideos.length > 0 && (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Current:</span>
                              <span className="font-mono">Video {currentPlaylistIndex + 1}</span>
                            </div>
                            {currentPlaylistIndex < playlistVideos.length - 1 && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Next:</span>
                                <span className="font-mono">Video {currentPlaylistIndex + 2}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                    />
                  </TabsContent>
                  <TabsContent value="stats" className="mt-3">
                    <Statistics events={events} />
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
