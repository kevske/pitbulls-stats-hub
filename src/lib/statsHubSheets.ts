import { TaggedEvent, generateEventDescription, formatTime } from '@/types/basketball';

export interface GameData {
  gameNumber: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  youtubeLink: string;
  video1Log?: string; // Column K - Video 1 log
  video2Log?: string; // Column L - Video 2 log
  video3Log?: string; // Column M - Video 3 log
  video4Log?: string; // Column N - Video 4 log
}

export class StatsHubSheetsService {
  private spreadsheetId = '1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I';
  private sheetName = 'Spiele';
  private apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

  // Convert events to text format for a single video
  eventsToLogText(events: TaggedEvent[]): string {
    const logLines: string[] = [];

    events.sort((a, b) => a.timestamp - b.timestamp).forEach(event => {
      const time = event.formattedTime;
      const description = generateEventDescription(event);
      logLines.push(`${time}: ${description}`);
    });

    return logLines.join('\n');
  }

  // Parse log text back to events
  logTextToEvents(logText: string): TaggedEvent[] {
    if (!logText.trim()) return [];

    const events: TaggedEvent[] = [];
    const lines = logText.split('\n').filter(line => line.trim());

    lines.forEach((line, index) => {
      const match = line.match(/^(\d{2}:\d{2}): (.+)$/);
      if (match) {
        const [, timeStr, description] = match;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        const timestamp = minutes * 60 + seconds;

        // Parse event type from description
        let type: any = 'unknown';
        let player: string | undefined;
        let points: number | undefined;
        let missed: boolean | undefined;
        let andOne: boolean | undefined;

        if (description.includes('made') || description.includes('missed')) {
          type = 'shot';
          const playerMatch = description.match(/^(\w+(?: \w+)?)/);
          player = playerMatch ? playerMatch[1] : undefined;
          missed = description.includes('missed');
          points = description.includes('3') ? 3 : description.includes('free throw') ? 1 : 2;
          andOne = description.includes('and one') || description.includes('+1');
        } else if (description.includes('rebound')) {
          type = 'rebound';
          const playerMatch = description.match(/(\w+(?: \w+)?)/);
          player = playerMatch ? playerMatch[1] : undefined;
        } else if (description.includes('foul')) {
          type = 'foul';
          const playerMatch = description.match(/(\w+(?: \w+)?)/);
          player = playerMatch ? playerMatch[1] : undefined;
        }

        events.push({
          id: index.toString(),
          timestamp,
          formattedTime: timeStr,
          type,
          player,
          points,
          missed,
          andOne,
          description
        });
      }
    });

    return events;
  }

  // Get game data from Google Sheets
  async getGameData(gameNumber: number): Promise<GameData | null> {
    if (!this.apiKey) {
      console.warn('Google Sheets API key not configured');
      return null;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A${gameNumber + 2}:N${gameNumber + 2}?key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.values && data.values.length > 0) {
        const row = data.values[0];
        return {
          gameNumber: parseInt(row[0]) || gameNumber,
          homeTeam: row[2] || '',
          awayTeam: row[3] || '',
          date: row[1] || '',
          youtubeLink: row[9] || '',
          video1Log: row[10] || '',
          video2Log: row[11] || '',
          video3Log: row[12] || '',
          video4Log: row[13] || ''
        };
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    }

    return null;
  }

  // Save game data to Google Sheets
  async saveGameData(gameData: GameData): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Google Sheets API key not configured');
      return false;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!K${gameData.gameNumber + 2}:N${gameData.gameNumber + 2}?key=${this.apiKey}`;
      
      const body = {
        values: [[
          gameData.video1Log || '',
          gameData.video2Log || '',
          gameData.video3Log || '',
          gameData.video4Log || ''
        ]]
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving game data:', error);
      return false;
    }
  }

  // Get specific video log based on playlist index (1-4)
  getVideoLog(gameData: GameData, videoIndex: number): string {
    switch (videoIndex) {
      case 1:
        return gameData.video1Log || '';
      case 2:
        return gameData.video2Log || '';
      case 3:
        return gameData.video3Log || '';
      case 4:
        return gameData.video4Log || '';
      default:
        return '';
    }
  }

  // Set specific video log based on playlist index (1-4)
  setVideoLog(gameData: GameData, videoIndex: number, logText: string): GameData {
    const updatedData = { ...gameData };
    switch (videoIndex) {
      case 1:
        updatedData.video1Log = logText;
        break;
      case 2:
        updatedData.video2Log = logText;
        break;
      case 3:
        updatedData.video3Log = logText;
        break;
      case 4:
        updatedData.video4Log = logText;
        break;
    }
    return updatedData;
  }

  // Extract YouTube video ID from URL
  extractVideoId(youtubeUrl: string): string {
    const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    return match ? match[1] : '';
  }
}
