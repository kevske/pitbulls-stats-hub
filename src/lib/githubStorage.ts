import { TaggedEvent, generateEventDescription, formatTime } from '@/types/basketball';

export interface GameLogFile {
  gameNumber: number;
  videoIndex: number;
  events: TaggedEvent[];
  lastModified: string;
  videoId?: string;
}

export class GitHubStorageService {
  private repoOwner = 'kevske';
  private repoName = 'pitbulls-stats-hub';
  private apiToken = import.meta.env.VITE_GITHUB_TOKEN;

  // Convert events to JSON format
  eventsToJSON(events: TaggedEvent[]): string {
    const logData = {
      events: events.sort((a, b) => a.timestamp - b.timestamp),
      createdAt: new Date().toISOString(),
      totalEvents: events.length
    };
    return JSON.stringify(logData, null, 2);
  }

  // Parse JSON back to events
  jsonToEvents(jsonString: string): TaggedEvent[] {
    try {
      const data = JSON.parse(jsonString);
      return data.events || [];
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [];
    }
  }

  // Get filename for game and video
  getFilename(gameNumber: number, videoIndex: number): string {
    return `game_${gameNumber}_video_${videoIndex}.json`;
  }

  // Save game log to GitHub
  async saveGameLog(gameNumber: number, videoIndex: number, events: TaggedEvent[], videoId?: string): Promise<boolean> {
    if (!this.apiToken) {
      console.warn('GitHub token not configured');
      return false;
    }

    try {
      const filename = this.getFilename(gameNumber, videoIndex);
      const content = this.eventsToJSON(events);
      
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update game ${gameNumber} video ${videoIndex} log`,
          content: btoa(content), // Base64 encode
          sha: await this.getFileSha(filename) // Get current SHA for update
        })
      });

      if (response.ok) {
        console.log(`Saved ${filename} to GitHub`);
        return true;
      } else {
        console.error('Failed to save to GitHub:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error saving to GitHub:', error);
      return false;
    }
  }

  // Load game log from GitHub
  async loadGameLog(gameNumber: number, videoIndex: number): Promise<TaggedEvent[]> {
    if (!this.apiToken) {
      console.warn('GitHub token not configured');
      return [];
    }

    try {
      const filename = this.getFilename(gameNumber, videoIndex);
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filename}`, {
        headers: {
          'Authorization': `token ${this.apiToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = atob(data.content); // Base64 decode
        return this.jsonToEvents(content);
      } else if (response.status === 404) {
        // File doesn't exist, return empty events
        console.log(`No existing log for ${filename}`);
        return [];
      } else {
        console.error('Failed to load from GitHub:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error loading from GitHub:', error);
      return [];
    }
  }

  // Get file SHA for updates
  private async getFileSha(filename: string): Promise<string | undefined> {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filename}`, {
        headers: {
          'Authorization': `token ${this.apiToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  // List all game logs
  async listGameLogs(): Promise<GameLogFile[]> {
    if (!this.apiToken) {
      console.warn('GitHub token not configured');
      return [];
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/`, {
        headers: {
          'Authorization': `token ${this.apiToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data
          .filter((file: any) => file.name.endsWith('.json'))
          .map((file: any) => {
            const match = file.name.match(/game_(\d+)_video_(\d+)\.json/);
            if (match) {
              return {
                gameNumber: parseInt(match[1]),
                videoIndex: parseInt(match[2]),
                lastModified: file.modified_at,
                videoId: undefined // Could be extracted from file content if needed
              };
            }
            return null;
          })
          .filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error listing GitHub files:', error);
      return [];
    }
  }
}
