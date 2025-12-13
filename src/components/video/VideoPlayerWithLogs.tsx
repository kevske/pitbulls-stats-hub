import { useState, useCallback, useRef, useEffect } from 'react';
import { TaggedEvent } from '@/types/basketball';
import { YouTubePlayer, YouTubePlayerRef } from '@/components/video/YouTubePlayer';
import { EventList } from '@/components/video/EventList';
import { VideoProjectService } from '@/lib/videoProjectService';
import { Card } from '@/components/ui/card';

interface VideoPlayerWithLogsProps {
    gameNumber: number;
    youtubeLink: string;
}

export function VideoPlayerWithLogs({ gameNumber, youtubeLink }: VideoPlayerWithLogsProps) {
    const [videoId, setVideoId] = useState<string | undefined>();
    const [playlistId, setPlaylistId] = useState<string | undefined>();
    const [events, setEvents] = useState<TaggedEvent[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);

    // Extract video/playlist IDs from URL
    useEffect(() => {
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
            if (!youtubeLink.includes('http')) {
                setVideoId(youtubeLink);
                setPlaylistId(undefined);
            }
        }
    }, [youtubeLink]);

    const loadEvents = async (index: number) => {
        try {
            // 1-based index for database
            const projectData = await VideoProjectService.loadProject(gameNumber.toString(), index);
            if (projectData) {
                setEvents(projectData.events);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
        }
    };

    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleSeekTo = (timestamp: number) => {
        youtubePlayerRef.current?.seekTo(timestamp);
    };

    const handleVideoChange = useCallback((newVideoId: string, index: number) => {
        // index is 0-based from player, we need 1-based for DB
        loadEvents(index + 1);
    }, [gameNumber]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
                <YouTubePlayer
                    ref={youtubePlayerRef}
                    videoId={videoId}
                    playlistId={playlistId}
                    onTimeUpdate={handleTimeUpdate}
                    onVideoChange={handleVideoChange}
                />
            </div>
            <div className="h-full">
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
}
