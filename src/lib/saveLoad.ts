import { Player, TaggedEvent } from '@/types/basketball';
import { SaveData, SaveDataMetadata } from '@/types/video';

// Re-export for backward compatibility
export type { SaveData, SaveDataMetadata };


export function generateSaveData(
  players: Player[],
  events: TaggedEvent[],
  videoId?: string,
  playlistId?: string
): SaveData {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const totalTimeSpan = sortedEvents.length > 0
    ? Math.max(...sortedEvents.map(e => e.timestamp))
    : 0;
  const now = new Date().toISOString();

  return {
    version: '1.0.0',
    timestamp: now,
    lastModified: now,
    videoId,
    playlistId,
    players,
    events,
    metadata: {
      totalEvents: events.length,
      totalTimeSpan,
      exportFormat: 'youtube-timestamps'
    }
  };
}

export function generateYouTubeTimestamps(events: TaggedEvent[]): string {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  return sortedEvents
    .map((event) => `${event.formattedTime} - ${event.description}`)
    .join('\n');
}

export function downloadSaveFile(saveData: SaveData, filename?: string) {
  const json = JSON.stringify(saveData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  a.download = filename || `basketball-tags-${timestamp}.json`;

  a.click();
  URL.revokeObjectURL(url);
}

export function downloadYouTubeTimestamps(events: TaggedEvent[], filename?: string) {
  const timestamps = generateYouTubeTimestamps(events);
  const blob = new Blob([timestamps], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  a.download = filename || `youtube-timestamps-${timestamp}.txt`;

  a.click();
  URL.revokeObjectURL(url);
}

export async function loadSaveFile(file: File): Promise<SaveData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const saveData = JSON.parse(content) as SaveData;

        // Basic validation
        if (!saveData.version || !saveData.players || !saveData.events) {
          throw new Error('Invalid save file format');
        }

        resolve(saveData);
      } catch (error) {
        reject(new Error('Failed to parse save file: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export function hasUnsavedChanges(
  currentPlayers: Player[],
  currentEvents: TaggedEvent[],
  lastSavedData: SaveData | null
): boolean {
  if (!lastSavedData) return currentEvents.length > 0;

  // Compare players
  if (currentPlayers.length !== lastSavedData.players.length) return true;
  if (JSON.stringify(currentPlayers) !== JSON.stringify(lastSavedData.players)) return true;

  // Compare events
  if (currentEvents.length !== lastSavedData.events.length) return true;
  if (JSON.stringify(currentEvents.sort((a, b) => a.timestamp - b.timestamp)) !==
    JSON.stringify(lastSavedData.events.sort((a, b) => a.timestamp - b.timestamp))) return true;

  return false;
}

// Timestamp comparison utilities
export interface TimestampComparisonResult {
  isNewer: boolean;
  isOlder: boolean;
  isSame: boolean;
  timeDifference: number; // in milliseconds
  summary: string;
}

export function compareTimestamps(timestamp1: string, timestamp2: string): TimestampComparisonResult {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return {
      isNewer: false,
      isOlder: false,
      isSame: false,
      timeDifference: 0,
      summary: 'Invalid timestamp(s)'
    };
  }

  const timeDifference = date1.getTime() - date2.getTime();
  const isNewer = timeDifference > 0;
  const isOlder = timeDifference < 0;
  const isSame = timeDifference === 0;

  let summary = '';
  if (isSame) {
    summary = 'Versions are identical';
  } else if (isNewer) {
    const minutes = Math.floor(timeDifference / 60000);
    summary = `Local version is ${minutes} minute(s) newer`;
  } else {
    const minutes = Math.floor(Math.abs(timeDifference) / 60000);
    summary = `Remote version is ${minutes} minute(s) newer`;
  }

  return {
    isNewer,
    isOlder,
    isSame,
    timeDifference,
    summary
  };
}

export function updateLastModified(saveData: SaveData): SaveData {
  return {
    ...saveData,
    lastModified: new Date().toISOString()
  };
}
