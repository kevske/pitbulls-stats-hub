export class StorageService {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(dbName = 'pitbulls-stats-db', storeName = 'key-value-store') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = 1;
  }

  private async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(request.error);
        this.initPromise = null;
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      try {
        const transaction = this.db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result as T || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      try {
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      try {
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async clear(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));

      try {
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const storage = new StorageService();
