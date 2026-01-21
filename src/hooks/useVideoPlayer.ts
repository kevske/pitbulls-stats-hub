import { useState, useCallback, useRef } from 'react';
import { YouTubePlayerRef } from '@/components/video/YouTubePlayer';

export const useVideoPlayer = () => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const youtubePlayerRef = useRef<YouTubePlayerRef>(null);

    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleStateChange = useCallback((state: number) => {
        setIsPlaying(state === 1);
    }, []);

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

    const handleSeekTo = useCallback((timestamp: number) => {
        youtubePlayerRef.current?.seekTo(timestamp);
        setCurrentTime(timestamp);
    }, []);

    return {
        currentTime,
        setCurrentTime,
        isPlaying,
        youtubePlayerRef,
        handleTimeUpdate,
        handleStateChange,
        handlePlayPause,
        handleSeekBackward,
        handleSeekForward,
        handleRestart,
        handleSeekTo
    };
};
