export interface GitHubFileInfo {
  name: string;
  path: string;
  sha?: string;
  size?: number;
  lastModified?: string;
}

export class GitHubJsonStorage {
  private repoOwner = 'kevske';
  private repoName = 'pitbulls-stats-hub';
  private apiToken = import.meta.env.VITE_GITHUB_TOKEN;
  private baseUrl = 'https://api.github.com';

  constructor(repoOwner?: string, repoName?: string) {
    if (repoOwner) this.repoOwner = repoOwner;
    if (repoName) this.repoName = repoName;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.apiToken) {
      headers['Authorization'] = `token ${this.apiToken}`;
    }

    return headers;
  }

  // Read JSON file from GitHub
  async readJsonFile<T = any>(path: string): Promise<T | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
        { headers: this.getHeaders() }
      );

      if (response.status === 404) {
        console.log(`File ${path} not found in repository`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }

      const data = await response.json();
      const content = atob(data.content);
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading JSON file ${path}:`, error);
      return null;
    }
  }

  // Write JSON file to GitHub
  async writeJsonFile(path: string, data: any, commitMessage?: string): Promise<boolean> {
    if (!this.apiToken) {
      console.error('GitHub token not configured. Cannot write to repository.');
      return false;
    }

    try {
      const content = JSON.stringify(data, null, 2);
      const encodedContent = btoa(content);
      
      // Get current file SHA if it exists
      const currentSha = await this.getFileSha(path);
      
      const body = {
        message: commitMessage || `Update ${path}`,
        content: encodedContent,
        sha: currentSha
      };

      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to write file: ${response.statusText} - ${errorData}`);
      }

      console.log(`Successfully wrote ${path} to GitHub`);
      return true;
    } catch (error) {
      console.error(`Error writing JSON file ${path}:`, error);
      return false;
    }
  }

  // Delete file from GitHub
  async deleteFile(path: string, commitMessage?: string): Promise<boolean> {
    if (!this.apiToken) {
      console.error('GitHub token not configured. Cannot delete from repository.');
      return false;
    }

    try {
      const sha = await this.getFileSha(path);
      if (!sha) {
        console.log(`File ${path} does not exist`);
        return true;
      }

      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message: commitMessage || `Delete ${path}`,
            sha: sha
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      console.log(`Successfully deleted ${path} from GitHub`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      return false;
    }
  }

  // List JSON files in a directory
  async listJsonFiles(directory: string = ''): Promise<GitHubFileInfo[]> {
    try {
      const path = directory ? `${directory}` : '';
      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to list directory: ${response.statusText}`);
      }

      const data = await response.json();
      return data
        .filter((file: any) => file.type === 'file' && file.name.endsWith('.json'))
        .map((file: any) => ({
          name: file.name,
          path: file.path,
          sha: file.sha,
          size: file.size,
          lastModified: file.modified_at
        }));
    } catch (error) {
      console.error(`Error listing JSON files in ${directory}:`, error);
      return [];
    }
  }

  // Check if file exists
  async fileExists(path: string): Promise<boolean> {
    const sha = await this.getFileSha(path);
    return sha !== undefined;
  }

  // Get file SHA (needed for updates)
  private async getFileSha(path: string): Promise<string | undefined> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
        { headers: this.getHeaders() }
      );

      if (response.status === 404) {
        return undefined;
      }

      if (!response.ok) {
        throw new Error(`Failed to get file SHA: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sha;
    } catch (error) {
      return undefined;
    }
  }

  // Create or update directory structure
  async ensureDirectory(directory: string): Promise<boolean> {
    // GitHub automatically creates directories when files are added
    // This is mainly for validation
    return true;
  }

  // Get repository info
  async getRepositoryInfo(): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.repoOwner}/${this.repoName}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to get repository info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting repository info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const githubJsonStorage = new GitHubJsonStorage();
