import { useState, useEffect, useCallback } from 'react';
import { githubJsonStorage, GitHubFileInfo } from '@/lib/githubJsonStorage';

export interface UseGitHubStorageOptions {
  autoLoad?: boolean;
  defaultData?: any;
}

export interface UseGitHubStorageReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  save: (data: T, commitMessage?: string) => Promise<boolean>;
  load: () => Promise<void>;
  remove: (commitMessage?: string) => Promise<boolean>;
  exists: () => Promise<boolean>;
  listFiles: (directory?: string) => Promise<GitHubFileInfo[]>;
  reset: () => void;
}

export function useGitHubStorage<T = any>(
  filePath: string,
  options: UseGitHubStorageOptions = {}
): UseGitHubStorageReturn<T> {
  const { autoLoad = false, defaultData = null } = options;
  
  const [data, setData] = useState<T | null>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await githubJsonStorage.readJsonFile<T>(filePath);
      setData(result || defaultData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, [filePath, defaultData]);

  const save = useCallback(async (newData: T, commitMessage?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await githubJsonStorage.writeJsonFile(filePath, newData, commitMessage);
      if (success) {
        setData(newData);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const remove = useCallback(async (commitMessage?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await githubJsonStorage.deleteFile(filePath, commitMessage);
      if (success) {
        setData(defaultData);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [filePath, defaultData]);

  const exists = useCallback(async (): Promise<boolean> => {
    try {
      return await githubJsonStorage.fileExists(filePath);
    } catch (err) {
      return false;
    }
  }, [filePath]);

  const listFiles = useCallback(async (directory?: string): Promise<GitHubFileInfo[]> => {
    try {
      return await githubJsonStorage.listJsonFiles(directory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files');
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    setError(null);
    setLoading(false);
  }, [defaultData]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    data,
    loading,
    error,
    save,
    load,
    remove,
    exists,
    listFiles,
    reset
  };
}

// Hook for managing multiple files
export function useGitHubFiles(directory: string = '') {
  const [files, setFiles] = useState<GitHubFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fileList = await githubJsonStorage.listJsonFiles(directory);
      setFiles(fileList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [directory]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    files,
    loading,
    error,
    refresh
  };
}
