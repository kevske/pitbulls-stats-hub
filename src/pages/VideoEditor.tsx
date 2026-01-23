import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Player, TaggedEvent, DEFAULT_PLAYERS, PositionType, generateEventDescription, formatTime } from '@/types/basketball';
import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { VideoInput } from '@/components/video/VideoInput';
import { VideoControls } from '@/components/video/VideoControls';
import { EventInput } from '@/components/video/EventInput';
import { EventList } from '@/components/video/EventList';
import { PlayerManager } from '@/components/video/PlayerManager';
import { Statistics } from '@/components/video/Statistics';
import { ExportPanel } from '@/components/video/ExportPanel';
import { VideoStatsIntegration } from '@/components/video/VideoStatsIntegration';
import { PlaylistSideMenu } from '@/components/video/PlaylistSideMenu';
import { CurrentPlayersOnField } from '@/components/video/CurrentPlayersOnField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, List, Save } from 'lucide-react';
import { generateSaveData, SaveData, loadSaveFile } from '@/services/saveLoad';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useSearchParams } from 'react-router-dom';
import { useVideoProjectPersistence } from '@/hooks/useVideoProjectPersistence';
import { usePlaylistManager } from '@/hooks/usePlaylistManager';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { PlayerInfoService } from '@/services/playerInfoService';

const VideoEditor = () => {
  const [searchParams] = useSearchParams();
  const gameNumber = searchParams.get('game');
  const videoUrl = searchParams.get('video');

  // Core State
  const [videoId, setVideoId] = useState('');
  const [playlistId, setPlaylistId] = useState<string | undefined>();
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [events, setEvents] = useState<TaggedEvent[]>([]);

  // UI State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [currentPlayersOnCourt, setCurrentPlayersOnCourt] = useState<Player[]>([]);
  const [shouldResetPlayers, setShouldResetPlayers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedProjectRef = useRef(false);

  // Hooks
  const {
    currentTime,
    isPlaying,
    youtubePlayerRef,
    setCurrentTime,
    handleTimeUpdate,
    handleStateChange,
    handlePlayPause,
    handleSeekBackward,
    handleSeekForward,
    handleRestart,
    handleSeekTo
  } = useVideoPlayer();

  const {
    playlistVideos,
    currentPlaylistIndex,
    setCurrentPlaylistIndex,
    isQueueMode,
    setIsQueueMode,
    handleAddToQueue,
    handleRemoveFromQueue,
    handlePlaylistReady,
    handleSelectPlaylistVideo,
  } = usePlaylistManager({
    videoId,
    setVideoId,
    youtubePlayerRef
  });

  const {
    lastSavedData,
    timestampConflict,
    setLastSavedData,
    loadWithTimestampCheck,
    handleSaveToStorage
  } = useVideoProjectPersistence({
    gameNumber,
    currentPlaylistIndex,
    events,
    players,
    videoId,
    playlistId,
    setEvents,
    setPlayers: (newPlayers) => {
      hasLoadedProjectRef.current = true;
      setPlayers(newPlayers);
    },
    setVideoId,
    setPlaylistId
  });

  // Fetch active players from DB on mount
  useEffect(() => {
    const fetchActivePlayers = async () => {
      // If we already loaded a project (e.g. from file or fast DB load), don't overwrite
      if (hasLoadedProjectRef.current) return;

      try {
        const activePlayers = await PlayerInfoService.getActivePlayers();

        // Check again before setting state
        if (hasLoadedProjectRef.current) return;

        if (activePlayers && activePlayers.length > 0) {
          const mappedPlayers: Player[] = activePlayers.map(p => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            jerseyNumber: p.jersey_number || 0,
            position: (['Guard', 'Forward', 'Center'].includes(p.position || '') ? p.position : 'Guard') as PositionType
          }));
          setPlayers(mappedPlayers);
        }
      } catch (error) {
        console.error('Failed to fetch active players:', error);
      }
    };

    fetchActivePlayers();
  }, []);

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
  }, [gameNumber, videoUrl, currentPlaylistIndex, loadWithTimestampCheck]);

  const handleLoadData = useCallback((saveData: SaveData) => {
    console.log('Loading data:', saveData);
    hasLoadedProjectRef.current = true;
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
  }, [setLastSavedData]);

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

  const handleVideoChange = useCallback((newVideoId: string, index: number) => {
    setCurrentPlaylistIndex(index);
    // Reset time for new video
    setCurrentTime(0);
    // Clear events when switching to a different video
    setEvents([]);
  }, [setCurrentPlaylistIndex, setCurrentTime]);

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

    setEvents((prev) => [...prev, completeEvent]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

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
