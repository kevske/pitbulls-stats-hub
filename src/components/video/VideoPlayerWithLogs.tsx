import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { TaggedEvent } from '@/types/basketball';
import { YouTubePlayer, YouTubePlayerRef } from '@/components/video/YouTubePlayer';
import { EventList } from '@/components/video/EventList';
import { VideoProjectService } from '@/services/videoProjectService';
import { PlayCircle, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSkipDeadTime } from '@/hooks/useSkipDeadTime';

interface VideoPlayerWithLogsProps {
    gameNumber: number;
    youtubeLink: string;
}

export const VideoPlayerWithLogs = memo(({ gameNumber, youtubeLink }: VideoPlayerWithLogsProps) => {
    const [videoId, setVideoId] = useState<string | undefined>();
    const [playlistId, setPlaylistId] = useState<string | undefined>();
    const [events, setEvents] = useState<TaggedEvent[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
    const lastLoadedIndex = useRef<number>(1);

    const pendingSeekTime = useRef<number | null>(null);
    const [isSkippingEnabled, setIsSkippingEnabled] = useState(false);

    // Extract video/playlist IDs from URL
    useEffect(() => {
        setShouldLoadPlayer(false);
        if (!youtubeLink) return;

        // Check for playlist first
        const playlistMatch = youtubeLink.match(/[?&]list=([^&]+)/) ||
            youtubeLink.match(/videoseries\?list=([^&]+)/);

        // Check for video ID
        const videoMatch = youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);

        if (playlistMatch) {
            setPlaylistId(playlistMatch[1]);
            setVideoId(undefined); // Playlist takes precedence
        } else if (videoMatch) {
            setVideoId(videoMatch[1]);
            setPlaylistId(undefined);
        } else if (youtubeLink.startsWith('PL')) {
            // Direct playlist ID
            setPlaylistId(youtubeLink);
            setVideoId(undefined);
        } else {
            // Assume it's a video ID if nothing else matches and it's not a url
            setVideoId(youtubeLink);
            setPlaylistId(undefined);
        }

        // Initial load for the first video
        loadEvents(1);
    }, [youtubeLink]);

    const loadEvents = async (index: number) => {
        lastLoadedIndex.current = index;
        try {
            console.log(`VideoPlayerWithLogs triggering load events for Game: ${gameNumber}, Index: ${index}`);
            // 1-based index for database
            const projectData = await VideoProjectService.loadProject(gameNumber, index);
            console.log(`VideoPlayerWithLogs loaded data for Game: ${gameNumber}, Index: ${index}`, projectData);

            if (projectData && projectData.events) {
                console.log(`VideoPlayerWithLogs found ${projectData.events.length} events`);
                setEvents(projectData.events);
            } else {
                console.log(`VideoPlayerWithLogs found no events or no project data`);
                setEvents([]);
            }
        } catch (error) {
            console.error('VideoPlayerWithLogs Error loading events:', error);
            setEvents([]);
        }
    };

    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handlePlayerReady = useCallback((player: any) => {
        if (pendingSeekTime.current !== null) {
            player.seekTo(pendingSeekTime.current, true);
            pendingSeekTime.current = null;
        }
    }, []);

    const handleSeekTo = useCallback((timestamp: number) => {
        if (!shouldLoadPlayer) {
            setShouldLoadPlayer(true);
            pendingSeekTime.current = timestamp;
        } else {
            youtubePlayerRef.current?.seekTo(timestamp);
        }
    }, [shouldLoadPlayer]);

    useSkipDeadTime({
        currentTime,
        events,
        seekTo: handleSeekTo,
        isEnabled: isSkippingEnabled
    });

    const handleVideoChange = useCallback((newVideoId: string, index: number) => {
        // index is 0-based from player, we need 1-based for DB
        loadEvents(index + 1);
    }, [gameNumber]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[85vh]">
            <div className="lg:col-span-3">
                {shouldLoadPlayer ? (
                    <YouTubePlayer
                        ref={youtubePlayerRef}
                        videoId={videoId}
                        playlistId={playlistId}
                        autoplay={true}
                        onTimeUpdate={handleTimeUpdate}
                        onVideoChange={handleVideoChange}
                        onReady={handlePlayerReady}
                        className="h-full"
                    />
                ) : (
                    <div
                        className="relative w-full h-full rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 cursor-pointer group"
                        onClick={() => setShouldLoadPlayer(true)}
                    >
                        {videoId ? (
                            <img
                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                                onError={(e) => {
                                    // Fallback to hqdefault if maxresdefault doesn't exist
                                    const target = e.target as HTMLImageElement;
                                    if (target.src.includes('maxresdefault')) {
                                        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary/90 text-primary-foreground rounded-full p-6 shadow-lg transform group-hover:scale-110 transition-transform">
                                <PlayCircle className="w-16 h-16" />
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center">
                            <span className="text-white font-bold text-lg drop-shadow-md">Video abspielen</span>
                        </div>
                    </div>
                )}
                <div className="flex justify-end mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Button
                        variant={isSkippingEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsSkippingEnabled(!isSkippingEnabled)}
                        className={`h-8 gap-2 text-xs transition-all ${isSkippingEnabled ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/20" : "hover:bg-accent"}`}
                        title="Pausen überspringen"
                    >
                        <FastForward className={`h-4 w-4 ${isSkippingEnabled ? "animate-pulse" : ""}`} />
                        <span>Skip Pauses</span>
                    </Button>
                </div>
            </div>
            <div className="h-full overflow-hidden">
                <EventList
                    events={events}
                    onSeekTo={handleSeekTo}
                    currentTime={currentTime}
                    className="h-full flex flex-col"
                    scrollAreaClassName="flex-1 h-0"
                />
            </div>
        </div>
    );
});

VideoPlayerWithLogs.displayName = 'VideoPlayerWithLogs';
