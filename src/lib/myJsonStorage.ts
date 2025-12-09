export interface MyJsonRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: any;
}

export class MyJsonStorage {
  private apiKey: string;
  private baseUrl = 'https://api.myjson.com/bins';

  constructor(apiKey?: string) {
    // MyJSON doesn't require API key for basic usage
    this.apiKey = apiKey || '';
  }

  // Create new bin
  async createBin<T>(data: T): Promise<string | null> {
    try {
      console.log('Creating MyJSON bin with data:', data);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      console.log('MyJSON Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MyJSON Error response:', errorText);
        throw new Error(`Failed to create bin: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('MyJSON created successfully:', result);
      return result.uri; // MyJSON returns the URI
    } catch (error) {
      console.error('Error creating MyJSON bin:', error);
      return null;
    }
  }

  // Read bin by ID
  async readBin<T>(binId: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${binId}`);

      if (!response.ok) {
        throw new Error(`Failed to read bin: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reading MyJSON bin:', error);
      return null;
    }
  }

  // Update existing bin
  async updateBin<T>(binId: string, data: T): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating MyJSON bin:', error);
      return false;
    }
  }

  // Delete bin
  async deleteBin(binId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${binId}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting MyJSON bin:', error);
      return false;
    }
  }
}

// Export singleton instance
export const myJsonStorage = new MyJsonStorage();
