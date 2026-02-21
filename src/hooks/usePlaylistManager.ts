import { useState, useCallback } from 'react';
import { PlaylistVideo } from '@/components/video/PlaylistPanel';
import { YouTubePlayerRef } from '@/components/video/YouTubePlayer';

interface UsePlaylistManagerProps {
    videoId: string;
    setVideoId: (id: string) => void;
    youtubePlayerRef: React.RefObject<YouTubePlayerRef>;
}

export const usePlaylistManager = ({
    videoId,
    setVideoId,
    youtubePlayerRef,
}: UsePlaylistManagerProps) => {
    const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
    const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
    const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
    const [isQueueMode, setIsQueueMode] = useState(false);

    const handleAddToQueue = useCallback((newVideoId: string) => {
        setPlaylistVideos(prev => {
            const newVideo: PlaylistVideo = {
                videoId: newVideoId,
                index: prev.length,
                isCompleted: false,
            };

            // If this is the first video and no video is currently loaded, start playing it
            if (prev.length === 0 && !videoId) {
                setVideoId(newVideoId);
                setCurrentPlaylistIndex(0);
                setIsQueueMode(true);
            }

            return [...prev, newVideo];
        });
    }, [videoId, setVideoId]);

    const handleRemoveFromQueue = useCallback((index: number) => {
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
            // Logic to switch video might be needed if the currently playing video is removed
            // But typically we might just let it play or stop.
            // The original code didn't explicitly handle stopping playback here on remove current.
        }
    }, [currentPlaylistIndex, playlistVideos.length]);

    const handlePlaylistReady = useCallback((videoIds: string[], currentIndex: number) => {
        const videos: PlaylistVideo[] = videoIds.map((id, idx) => ({
            videoId: id,
            index: idx,
            isCompleted: completedVideos.has(id),
        }));
        setPlaylistVideos(videos);
        setCurrentPlaylistIndex(currentIndex);
    }, [completedVideos]);

    const handleSelectPlaylistVideo = useCallback((index: number) => {
        console.log('handleSelectPlaylistVideo called:', { index, isQueueMode, playlistVideosLength: playlistVideos.length });

        if (playlistVideos[index]) {
            // Use playVideoAt to switch to the specific video in the playlist
            console.log('Switching to video at index:', index, 'videoId:', playlistVideos[index].videoId);
            setCurrentPlaylistIndex(index);

            if (isQueueMode) {
                setVideoId(playlistVideos[index].videoId);
            } else {
                // Use the YouTube player's playVideoAt method
                youtubePlayerRef.current?.playVideoAt(index);
            }
        }
    }, [playlistVideos, isQueueMode, youtubePlayerRef, setVideoId]);

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

    return {
        playlistVideos,
        currentPlaylistIndex,
        setCurrentPlaylistIndex,
        completedVideos,
        isQueueMode,
        setIsQueueMode,
        setPlaylistVideos,
        setCompletedVideos,
        handleAddToQueue,
        handleRemoveFromQueue,
        handlePlaylistReady,
        handleSelectPlaylistVideo,
        handleMarkVideoComplete,
        handleNextVideo,
        handlePrevVideo
    };
};
