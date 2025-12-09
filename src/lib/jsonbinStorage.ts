export interface JsonBinRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  versioning: boolean;
  name?: string;
  metadata?: any;
}

export interface JsonBinResponse<T> {
  record: JsonBinRecord;
  data: T;
}

export class JsonBinStorage {
  private apiKey: string;
  private baseUrl = 'https://api.jsonbin.io/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_JSONBIN_API_KEY;
    if (!this.apiKey) {
      console.warn('JSONBin API key not configured');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['X-Access-Key'] = this.apiKey;
    }

    return headers;
  }

  // Create new bin
  async createBin<T>(data: T, name?: string): Promise<JsonBinResponse<T> | null> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return null;
    }

    try {
      // JSONBin API expects the data directly, not wrapped in a 'data' property
      console.log('Creating JSONBin with data:', data);
      console.log('API URL:', `${this.baseUrl}/b`);
      console.log('Headers:', this.getHeaders());
      console.log('API Key being used:', this.apiKey ? `${this.apiKey.substring(0, 8)}... (length: ${this.apiKey.length})` : 'NOT SET');
      console.log('Full API Key (for debugging):', this.apiKey);
      console.log('Using Access Key for all operations (X-Access-Key)');

      const response = await fetch(`${this.baseUrl}/b`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create bin: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('JSONBin created successfully:', result);
      
      // If name is provided, update the bin with the name
      if (name && result.record?.id) {
        try {
          await this.updateBinMetadata(result.record.id, { name });
          result.record.name = name;
        } catch (error) {
          console.warn('Failed to set bin name:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creating bin:', error);
      return null;
    }
  }

  // Read bin by ID
  async readBin<T>(binId: string): Promise<T | null> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/b/${binId}/latest`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to read bin: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error reading bin:', error);
      return null;
    }
  }

  // Update existing bin
  async updateBin<T>(binId: string, data: T): Promise<JsonBinResponse<T> | null> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/b/${binId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error(`Failed to update bin: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating bin:', error);
      return null;
    }
  }

  // Delete bin
  async deleteBin(binId: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/b/${binId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting bin:', error);
      return false;
    }
  }

  // List all bins
  async listBins(): Promise<JsonBinRecord[]> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/b`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to list bins: ${response.statusText}`);
      }

      const result = await response.json();
      return result.records || [];
    } catch (error) {
      console.error('Error listing bins:', error);
      return [];
    }
  }

  // Get bin metadata
  async getBinMetadata(binId: string): Promise<JsonBinRecord | null> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/b/${binId}/meta`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  }

  // Update bin metadata
  async updateBinMetadata(binId: string, metadata: { name?: string }): Promise<boolean> {
    if (!this.apiKey) {
      console.error('JSONBin API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/b/${binId}/meta`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(metadata)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating metadata:', error);
      return false;
    }
  }
}

// Export singleton instance
export const jsonbinStorage = new JsonBinStorage();
