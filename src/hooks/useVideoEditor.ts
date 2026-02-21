import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Player, TaggedEvent, DEFAULT_PLAYERS, PositionType, generateEventDescription, formatTime, EventType } from '@/types/basketball';
import { generateSaveData, SaveData, loadSaveFile } from '@/services/saveLoad';
import { useVideoProjectPersistence } from '@/hooks/useVideoProjectPersistence';
import { usePlaylistManager } from '@/hooks/usePlaylistManager';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { PlayerInfoService } from '@/services/playerInfoService';
import { useSkipDeadTime } from '@/hooks/useSkipDeadTime';
import { calculateTaggingStatus } from '@/utils/taggingStatus';
import { useStats } from '@/contexts/StatsContext';
import { extractStatsFromVideoData } from '@/services/statsExtraction';
import { GameStatsService } from '@/services/gameStatsService';

export const useVideoEditor = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const adminPassword = location.state?.adminPassword;
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
  const [isSkippingEnabled, setIsSkippingEnabled] = useState(false);

  // Learning Dialog State
  const [isLearningDialogOpen, setIsLearningDialogOpen] = useState(false);
  const [pendingLearningEvent, setPendingLearningEvent] = useState<Omit<TaggedEvent, 'id' | 'description'> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedProjectRef = useRef(false);
  const dbPlayersRef = useRef<Player[]>([]);

  // Helper to merge player lists
  const mergePlayers = useCallback((baseList: Player[], newPlayers: Player[]) => {
    // Standard merge:
    const existingIds = new Set(baseList.map(p => p.id));
    const existingNames = new Set(baseList.map(p => p.name));

    const playersToAdd = newPlayers.filter(p =>
      !existingIds.has(p.id) && !existingNames.has(p.name)
    );

    return [...baseList, ...playersToAdd];
  }, []);

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

  const { games } = useStats();

  // Handle skipping dead time
  useSkipDeadTime({
    currentTime,
    events,
    seekTo: handleSeekTo,
    isEnabled: isSkippingEnabled
  });

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
    handleSaveToStorage: baseHandleSaveToStorage
  } = useVideoProjectPersistence({
    gameNumber,
    currentPlaylistIndex,
    events,
    players,
    videoId,
    playlistId,
    adminPassword,
    setEvents,
    setPlayers: useCallback((newPlayers) => {
      hasLoadedProjectRef.current = true;
      // Merge loaded players with any DB players we already fetched
      const merged = mergePlayers(newPlayers, dbPlayersRef.current);
      setPlayers(merged);
    }, [mergePlayers]),
    setVideoId,
    setPlaylistId
  });

  // Fetch active players from DB on mount
  useEffect(() => {
    const fetchActivePlayers = async () => {
      try {
        const activePlayers = await PlayerInfoService.getActivePlayers();

        if (activePlayers && activePlayers.length > 0) {
          const mappedPlayers: Player[] = activePlayers.map(p => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            jerseyNumber: p.jersey_number || 0,
            position: (['Guard', 'Forward', 'Center'].includes(p.position || '') ? p.position : 'Guard') as PositionType
          }));

          // Save to ref so future project loads can use it
          dbPlayersRef.current = mappedPlayers;

          // Merge with current state immediately
          setPlayers(current => {
            // If we are still on default players (check first ID '1'), replace them entirely with DB players
            // This ensures we don't have duplicates or "ghost" default players for new projects
            if (current.length === DEFAULT_PLAYERS.length && current[0]?.id === '1') {
              return mappedPlayers;
            }
            return mergePlayers(current, mappedPlayers);
          });
        }
      } catch (error) {
        console.error('Failed to fetch active players:', error);
      }
    };

    fetchActivePlayers();
  }, [mergePlayers]);

  // Handle URL parameters and load game data
  useEffect(() => {
    const initializeFromParams = async () => {
      // 1. Handle URL params for Video/Playlist
      if (videoUrl) {
        const playlistOnlyMatch = videoUrl.match(/embed\/videoseries\?list=([^&]+)/);
        if (playlistOnlyMatch) {
          // Playlist-only URL (no specific video)
          setPlaylistId(playlistOnlyMatch[1]);
        } else {
          // Check for combined video + playlist URL: embed/VIDEO_ID?list=PLAYLIST_ID
          const videoWithListMatch = videoUrl.match(/embed\/([^?]+)\?list=([^&]+)/);
          if (videoWithListMatch) {
            setVideoId(videoWithListMatch[1]);
            setPlaylistId(videoWithListMatch[2]);
          } else {
            // Video-only URL
            const videoIdMatch = videoUrl.match(/embed\/([^?]+)/);
            if (videoIdMatch) {
              setVideoId(videoIdMatch[1]);
            }
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

  const handleSaveToStorage = async () => {
    // 1. Calculate tagging status before saving
    let taggingStatus = undefined;

    if (gameNumber) {
      const gameFromContext = games.find(g => g.gameNumber === parseInt(gameNumber));

      if (gameFromContext) {
        // Calculate stats for CURRENT video
        const currentExtracted = extractStatsFromVideoData({
          events,
          players,
          gameNumber: parseInt(gameNumber),
          videoIndex: currentPlaylistIndex + 1,
          videoId,
          playlistId,
          timestamp: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        });

        let totalPoints = currentExtracted.teamStats.totalPoints;

        // Fetch stats from other videos in the playlist to get complete game totals
        // Note: DB video_index is 1-based, matches currentPlaylistIndex + 1
        const otherVideosPoints = await GameStatsService.getPlaylistTotalPoints(
          parseInt(gameNumber),
          currentPlaylistIndex + 1
        );

        totalPoints += otherVideosPoints;

        taggingStatus = calculateTaggingStatus(
          totalPoints,
          gameFromContext.finalScore,
          { home: gameFromContext.homeTeam, away: gameFromContext.awayTeam }
        );
      }
    }

    await baseHandleSaveToStorage(taggingStatus ? { taggingStatus } : undefined);
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
    // Update videoId to match the new playlist video
    if (newVideoId) {
      setVideoId(newVideoId);
    }
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

  const handleQuickAction = (type: EventType, label: string, icon: string) => {
    const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: type,
    };

    if (type === 'learning') {
      setPendingLearningEvent(eventData);
      setIsLearningDialogOpen(true);
      return;
    }

    handleAddEvent(eventData);
  };

  const handleSaveLearning = (note: string) => {
    if (pendingLearningEvent) {
      const eventWithDescription: TaggedEvent = {
        ...pendingLearningEvent,
        id: crypto.randomUUID(),
        description: `Learning: ${note}`,
        type: 'learning'
      };

      setEvents((prev) => [...prev, eventWithDescription]);
      setPendingLearningEvent(null);
      setIsLearningDialogOpen(false);
    }
  };

  const handleAddEvent = (event: Omit<TaggedEvent, 'id' | 'description'>) => {
    const completeEvent: TaggedEvent = {
      ...event,
      id: crypto.randomUUID(),
      description: generateEventDescription(event),
    };

    setEvents((prev) => [...prev, completeEvent]);
  };

  const handleDeleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Calculate available players (bench players)
  const availablePlayers = useMemo(() => {
    const currentPlayerNames = new Set(currentPlayersOnCourt.map(p => p.name));
    return players.filter(player => !currentPlayerNames.has(player.name));
  }, [players, currentPlayersOnCourt]);

  const isPlaylistMode = playlistVideos.length > 0;

  return {
    state: {
      videoId,
      playlistId,
      players,
      events,
      isSideMenuOpen,
      currentPlayersOnCourt,
      shouldResetPlayers,
      isSkippingEnabled,
      isLearningDialogOpen,
      pendingLearningEvent,
      currentTime,
      isPlaying,
      lastSavedData,
      timestampConflict,
      isPlaylistMode,
      playlistVideos,
      currentPlaylistIndex,
      gameNumber,
      isQueueMode
    },
    handlers: {
      setVideoId,
      setPlaylistId,
      setIsSideMenuOpen,
      setCurrentPlayersOnCourt,
      setShouldResetPlayers,
      setIsSkippingEnabled,
      setIsLearningDialogOpen,
      setPendingLearningEvent,

      handleLoadData,
      handleLoadFile,
      handleFileSelect,
      handleSaveToStorage,

      handleVideoSelect,
      handleVideoChange,

      handleAddPlayer,
      handleRemovePlayer,

      handleQuickAction,
      handleSaveLearning,
      handleAddEvent,
      handleDeleteEvent,

      // Video Player
      handlePlayPause,
      handleSeekBackward,
      handleSeekForward,
      handleRestart,
      handleSeekTo,
      handleTimeUpdate,
      handleStateChange,

      // Playlist
      handleAddToQueue,
      handleRemoveFromQueue,
      handleSelectPlaylistVideo,
      handlePlaylistReady,

      // Router
      navigate
    },
    refs: {
      fileInputRef,
      youtubePlayerRef
    },
    computed: {
      sortedPlayers,
      availablePlayers
    }
  };
};
