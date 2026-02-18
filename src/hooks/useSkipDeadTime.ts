import { useEffect, useMemo, useRef } from 'react';
import { TaggedEvent } from '@/types/basketball';

interface UseSkipDeadTimeProps {
    currentTime: number;
    events: TaggedEvent[];
    seekTo: (timestamp: number) => void;
    isEnabled: boolean;
}

export const useSkipDeadTime = ({
    currentTime,
    events,
    seekTo,
    isEnabled
}: UseSkipDeadTimeProps) => {
    const lastSkippedTime = useRef<number | null>(null);

    // Calculate skip zones: [end_time, start_time] pairs
    const skipZones = useMemo(() => {
        if (!isEnabled) return [];

        const zones: { start: number; end: number }[] = [];
        const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

        let lastEndTimestamp: number | null = null;

        for (const event of sortedEvents) {
            if (event.type === 'action_end') {
                lastEndTimestamp = event.timestamp;
            } else if (event.type === 'action_start' && lastEndTimestamp !== null) {
                if (event.timestamp > lastEndTimestamp) {
                    zones.push({ start: lastEndTimestamp, end: event.timestamp });
                }
                lastEndTimestamp = null;
            }
        }

        return zones;
    }, [events, isEnabled]);

    useEffect(() => {
        if (!isEnabled || skipZones.length === 0) return;

        // Check if we are inside any skip zone
        for (const zone of skipZones) {
            // Add a small buffer (0.1s) to avoid infinite loops if seek lands exactly on start
            // Also ensure we haven't just skipped to this zone to prevent fighting with seekTo
            if (currentTime >= zone.start && currentTime < zone.end - 0.5) {
                // Only skip if we haven't just skipped here recently (debounce-ish)
                // or if we moved enough away from the last skip
                if (lastSkippedTime.current === null || Math.abs(currentTime - lastSkippedTime.current) > 1.0) {
                    console.log(`Skipping dead time: ${zone.start.toFixed(2)} -> ${zone.end.toFixed(2)}`);
                    seekTo(zone.end);
                    lastSkippedTime.current = zone.end;
                    return;
                }
            }
        }
    }, [currentTime, skipZones, isEnabled, seekTo]);
};
