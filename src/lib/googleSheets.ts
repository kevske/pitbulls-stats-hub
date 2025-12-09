import { Player, TaggedEvent } from '@/types/basketball';

// Google Sheets API configuration
const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// OAuth2 configuration - In production, these should be environment variables
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Replace with actual client ID
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE'; // Replace with actual client secret
const REDIRECT_URI = 'http://localhost:5173/oauth/callback';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;
  private authToken: AuthToken | null = null;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    // Load token from localStorage
    const savedToken = localStorage.getItem('google_sheets_token');
    if (savedToken) {
      this.authToken = JSON.parse(savedToken);
    }
  }

  // OAuth2 Authentication
  initiateAuth(): void {
    const authParams = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${authParams.toString()}`;
    window.open(authUrl, '_blank', 'width=500,height=600');
  }

  async handleAuthCallback(code: string): Promise<void> {
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString()
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const token: AuthToken = await response.json();
      this.authToken = token;
      localStorage.setItem('google_sheets_token', JSON.stringify(token));
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.authToken?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const refreshParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: this.authToken.refresh_token,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refreshParams.toString()
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const token: AuthToken = await response.json();
      this.authToken = token;
      localStorage.setItem('google_sheets_token', JSON.stringify(token));
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    // Check if token is expired and refresh if needed
    const tokenAge = Date.now() - (parseInt(localStorage.getItem('google_sheets_token_time') || '0'));
    if (tokenAge > (this.authToken.expires_in - 60) * 1000) {
      await this.refreshToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authToken.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token might be expired, try refreshing
      await this.refreshToken();
      // Retry the request
      return this.makeRequest(url, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Initialize spreadsheet with headers
  async initializeSpreadsheet(): Promise<void> {
    const sheetName = this.config.sheetName || 'Basketball Events';
    
    // Create sheet if it doesn't exist
    await this.makeRequest(`${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/sheets`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      })
    });

    // Set up headers
    const headers = [
      ['Event ID', 'Timestamp', 'Formatted Time', 'Event Type', 'Player', 'Points', 'Missed', 'And One', 
       'Rebound Player', 'Substitution Out', 'Description', 'Video ID', 'Created At']
    ];

    await this.makeRequest(`${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A1:M1`, {
      method: 'PUT',
      body: JSON.stringify({
        values: headers
      })
    });
  }

  // Save events to Google Sheets
  async saveEvents(events: TaggedEvent[], videoId?: string): Promise<void> {
    const sheetName = this.config.sheetName || 'Basketball Events';
    
    const rows = events.map(event => [
      event.id,
      event.timestamp.toString(),
      event.formattedTime,
      event.type,
      event.player || '',
      event.points?.toString() || '',
      event.missed?.toString() || '',
      event.andOne?.toString() || '',
      event.reboundPlayer || '',
      event.substitutionOut || '',
      event.description,
      videoId || '',
      new Date().toISOString()
    ]);

    // Append new events
    await this.makeRequest(`${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A:M:append`, {
      method: 'POST',
      body: JSON.stringify({
        values: rows,
        valueInputOption: 'USER_ENTERED'
      })
    });
  }

  // Load events from Google Sheets
  async loadEvents(): Promise<{ events: TaggedEvent[], videoId?: string }> {
    const sheetName = this.config.sheetName || 'Basketball Events';
    
    const response = await this.makeRequest(
      `${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A:M`
    );

    const data = response as { values: string[][] };
    const rows = data.values || [];

    // Skip header row
    const eventRows = rows.slice(1);

    const events: TaggedEvent[] = eventRows.map(row => ({
      id: row[0] || '',
      timestamp: parseFloat(row[1]) || 0,
      formattedTime: row[2] || '',
      type: row[3] as any,
      player: row[4] || undefined,
      points: row[5] ? parseInt(row[5]) : undefined,
      missed: row[6] === 'true',
      andOne: row[7] === 'true',
      reboundPlayer: row[8] || undefined,
      substitutionOut: row[9] || undefined,
      description: row[10] || ''
    }));

    // Get video ID from the last row
    const videoId = eventRows.length > 0 ? eventRows[eventRows.length - 1][11] : undefined;

    return { events, videoId };
  }

  // Save players to Google Sheets
  async savePlayers(players: Player[]): Promise<void> {
    const sheetName = (this.config.sheetName || 'Basketball Events') + '_Players';
    
    const rows = players.map(player => [
      player.id,
      player.name,
      player.jerseyNumber.toString(),
      player.position
    ]);

    // Clear existing players and insert new ones
    await this.makeRequest(`${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A:D:clear`, {
      method: 'POST'
    });

    // Add headers
    const headers = [['Player ID', 'Name', 'Jersey Number', 'Position']];
    const allRows = [...headers, ...rows];

    await this.makeRequest(`${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A1:D${allRows.length}`, {
      method: 'PUT',
      body: JSON.stringify({
        values: allRows
      })
    });
  }

  // Load players from Google Sheets
  async loadPlayers(): Promise<Player[]> {
    const sheetName = (this.config.sheetName || 'Basketball Events') + '_Players';
    
    try {
      const response = await this.makeRequest(
        `${GOOGLE_SHEETS_API}/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}!A:D`
      );

      const data = response as { values: string[][] };
      const rows = data.values || [];

      // Skip header row
      const playerRows = rows.slice(1);

      return playerRows.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        jerseyNumber: parseInt(row[2]) || 0,
        position: row[3] as any
      }));
    } catch (error) {
      // Sheet might not exist yet
      return [];
    }
  }

  // Export to text format
  async exportToText(): Promise<string> {
    const { events } = await this.loadEvents();
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedEvents
      .map((event) => `${event.formattedTime} - ${event.description}`)
      .join('\n');
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  // Logout
  logout(): void {
    this.authToken = null;
    localStorage.removeItem('google_sheets_token');
    localStorage.removeItem('google_sheets_token_time');
  }
}
