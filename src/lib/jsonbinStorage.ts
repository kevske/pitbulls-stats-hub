export interface JsonBinRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  versioning: boolean;
  name?: string;
  metadata?: any;
}

export interface VideoEntry {
  binId: string;
  lastModified: string;
  timestamp: string;
}

export interface MasterBinData {
  games: Record<string, Record<string, VideoEntry>>;
  version: string;
  lastUpdated: string;
}

export interface JsonBinResponse<T> {
  record: JsonBinRecord;
  metadata: JsonBinRecord;
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
      headers['X-Master-Key'] = this.apiKey;
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
      console.log('Using Master Key for all operations (X-Master-Key)');
      console.log('Name parameter:', name);

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
      console.log('Full response structure:', result);
      console.log('Result record:', result.record);
      console.log('Result metadata:', result.metadata);
      
      // Try to get the bin ID from different possible locations
      const binId = result.record?.id || result.metadata?.id || result.id;
      console.log('Extracted bin ID:', binId);
      console.log('Name parameter exists:', !!name);
      
      // If name is provided and we have a bin ID, update the bin metadata
      if (name && binId) {
        console.log('Conditions met, proceeding to set name...');
        try {
          console.log('Setting bin name to:', name);
          
          // Try updating the bin with name included in the data
          const updateResponse = await fetch(`${this.baseUrl}/b/${binId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
              ...result.record, // original data
              name: name // add name property
            })
          });
          
          console.log('Update response status:', updateResponse.status);
          
          if (updateResponse.ok) {
            console.log('Bin name set successfully via PUT');
            if (result.record) {
              result.record.name = name;
            }
          } else {
            const errorText = await updateResponse.text();
            console.warn('Failed to set bin name via PUT:', errorText);
            
            // Fallback: try the metadata endpoint
            console.log('Trying metadata endpoint as fallback...');
            const metadataResponse = await fetch(`${this.baseUrl}/b/${binId}/meta`, {
              method: 'PATCH',
              headers: this.getHeaders(),
              body: JSON.stringify({ name })
            });
            
            console.log('Metadata response status:', metadataResponse.status);
            
            if (metadataResponse.ok) {
              console.log('Bin name set successfully via metadata');
              if (result.record) {
                result.record.name = name;
              }
            } else {
              const fallbackErrorText = await metadataResponse.text();
              console.warn('Failed to set bin name via metadata too:', fallbackErrorText);
            }
          }
        } catch (error) {
          console.warn('Failed to set bin name:', error);
        }
      } else {
        console.log('Cannot set name - missing bin ID or name parameter');
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
      console.log('ReadBin response structure:', result);
      // The actual data is in result.record, not result.data
      return result.record;
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
        body: JSON.stringify(data)
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

  // MasterBin specific methods
  async readMasterBin(): Promise<MasterBinData | null> {
    try {
      const data = await this.readBin<MasterBinData>('693897a8ae596e708f8ea7c2');
      
      // Handle migration from old format to new format
      if (data && !data.version) {
        // This is the old format - migrate it
        console.log('Migrating old MasterBin format to new format...');
        const migratedData: MasterBinData = {
          games: {},
          version: '2.0.0',
          lastUpdated: new Date().toISOString()
        };

        // Convert old format (games[gameNum][videoNum] = binId) to new format
        if (data.games) {
          for (const [gameNum, gameVideos] of Object.entries(data.games)) {
            migratedData.games[gameNum] = {};
            for (const [videoNum, binId] of Object.entries(gameVideos)) {
              if (typeof binId === 'string') {
                // Old format - create new VideoEntry
                migratedData.games[gameNum][videoNum] = {
                  binId,
                  lastModified: new Date().toISOString(),
                  timestamp: new Date().toISOString()
                };
              } else {
                // Already in new format
                migratedData.games[gameNum][videoNum] = binId as VideoEntry;
              }
            }
          }
        }

        // Save the migrated format
        await this.updateBin('693897a8ae596e708f8ea7c2', migratedData);
        return migratedData;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading MasterBin:', error);
      return null;
    }
  }

  async updateMasterBin(masterBinData: MasterBinData): Promise<boolean> {
    try {
      // Update the lastUpdated timestamp
      masterBinData.lastUpdated = new Date().toISOString();
      const result = await this.updateBin('693897a8ae596e708f8ea7c2', masterBinData);
      return !!result;
    } catch (error) {
      console.error('Error updating MasterBin:', error);
      return false;
    }
  }

  async addVideoToMasterBin(
    gameNumber: string, 
    videoNumber: string, 
    binId: string, 
    lastModified: string
  ): Promise<boolean> {
    try {
      const masterBinData = await this.readMasterBin();
      if (!masterBinData) {
        console.error('Failed to read MasterBin');
        return false;
      }

      // Initialize nested objects if they don't exist
      if (!masterBinData.games) masterBinData.games = {};
      if (!masterBinData.games[gameNumber]) masterBinData.games[gameNumber] = {};

      // Add or update the video entry
      masterBinData.games[gameNumber][videoNumber] = {
        binId,
        lastModified,
        timestamp: new Date().toISOString()
      };

      return await this.updateMasterBin(masterBinData);
    } catch (error) {
      console.error('Error adding video to MasterBin:', error);
      return false;
    }
  }

  async getVideoEntry(gameNumber: string, videoNumber: string): Promise<VideoEntry | null> {
    try {
      const masterBinData = await this.readMasterBin();
      if (!masterBinData?.games?.[gameNumber]?.[videoNumber]) {
        return null;
      }
      return masterBinData.games[gameNumber][videoNumber];
    } catch (error) {
      console.error('Error getting video entry:', error);
      return null;
    }
  }
}

// Export singleton instance
export const jsonbinStorage = new JsonBinStorage();
