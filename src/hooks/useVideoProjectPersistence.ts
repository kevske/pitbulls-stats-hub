import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { VideoProjectService } from '@/services/videoProjectService';
import { SaveData, compareTimestamps } from '@/services/saveLoad';
import { Player, TaggedEvent } from '@/types/basketball';

interface UseVideoProjectPersistenceProps {
    gameNumber: string | null;
    currentPlaylistIndex: number;
    events: TaggedEvent[];
    players: Player[];
    videoId: string;
    playlistId: string | undefined;
    setEvents: (events: TaggedEvent[]) => void;
    setPlayers: (players: Player[]) => void;
    setVideoId: (id: string) => void;
    setPlaylistId: (id: string | undefined) => void;
}

export const useVideoProjectPersistence = ({
    gameNumber,
    currentPlaylistIndex,
    events,
    players,
    videoId,
    playlistId,
    setEvents,
    setPlayers,
    setVideoId,
    setPlaylistId,
}: UseVideoProjectPersistenceProps) => {
    const [lastSavedData, setLastSavedData] = useState<SaveData | null>(null);
    const [timestampConflict, setTimestampConflict] = useState<{
        hasConflict: boolean;
        localIsNewer: boolean;
        comparison: any;
    } | null>(null);

    // Refs for stable access in callbacks
    const lastSavedDataRef = useRef(lastSavedData);
    const eventsRef = useRef(events);

    // Update Refs when state changes
    useEffect(() => {
        lastSavedDataRef.current = lastSavedData;
    }, [lastSavedData]);

    useEffect(() => {
        eventsRef.current = events;
    }, [events]);


    // Load data with timestamp checking
    const loadWithTimestampCheck = useCallback(async (
        gameNum: string,
        videoIdx: number
    ) => {
        try {
            console.log('Loading data with timestamp check:', { gameNum, videoIdx });

            // Get remote metadata first to check timestamp
            const remoteMeta = await VideoProjectService.getProjectMeta(parseInt(gameNum), videoIdx);

            // Load the actual data
            const projectData = await VideoProjectService.loadProject(parseInt(gameNum), videoIdx);

            // Use ref for comparison to avoid recreating callback
            const currentLastSavedData = lastSavedDataRef.current;
            const currentEvents = eventsRef.current;

            if (projectData) {
                const localTimestamp = currentLastSavedData?.lastModified || currentLastSavedData?.timestamp;
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
                toast.success(`Loaded project for video ${videoIdx}`);
            } else {
                console.log('No saved data found on Supabase');
                if (currentLastSavedData?.events?.length && currentLastSavedData.videoIndex !== videoIdx) {
                    setEvents([]);
                    setLastSavedData(null);
                    setTimestampConflict(null);
                } else if (!currentLastSavedData && currentEvents.length === 0) {
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
    }, [setEvents, setPlayers, setVideoId, setPlaylistId]); // Dependencies are now stable functions

    // Manual save function
    const handleSaveToStorage = useCallback(async () => {
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
    }, [gameNumber, currentPlaylistIndex, events, players, videoId, playlistId]);

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
    }, [gameNumber, currentPlaylistIndex, lastSavedData, setEvents, setPlayers, setVideoId, setPlaylistId]);

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

    return {
        lastSavedData,
        timestampConflict,
        setLastSavedData,
        setTimestampConflict,
        loadWithTimestampCheck,
        handleSaveToStorage
    };
};
