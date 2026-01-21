export interface BackendFileInfo {
  name: string;
  path: string;
  size?: number;
  lastModified?: string;
}

export class BackendStorageService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Default to your deployed backend URL
    this.baseUrl = baseUrl || process.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/api/github${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Read JSON file
  async readJsonFile<T = any>(path: string): Promise<T | null> {
    try {
      return await this.request(`/${path}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Write JSON file
  async writeJsonFile(path: string, data: any, commitMessage?: string): Promise<boolean> {
    try {
      await this.request(`/${path}`, {
        method: 'PUT',
        body: JSON.stringify({
          data,
          message: commitMessage || `Update ${path}`
        })
      });
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  // Delete file
  async deleteFile(path: string, commitMessage?: string): Promise<boolean> {
    try {
      await this.request(`/${path}?message=${encodeURIComponent(commitMessage || `Delete ${path}`)}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // List JSON files
  async listJsonFiles(directory: string = ''): Promise<BackendFileInfo[]> {
    try {
      return await this.request(`/list/${directory}`);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  // Check if backend is healthy
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const backendStorage = new BackendStorageService();
