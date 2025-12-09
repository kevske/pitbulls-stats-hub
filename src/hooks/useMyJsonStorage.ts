import { useState, useEffect, useCallback } from 'react';
import { myJsonStorage } from '@/lib/myJsonStorage';

export interface UseMyJsonStorageOptions {
  autoLoad?: boolean;
  defaultData?: any;
}

export interface UseMyJsonStorageReturn<T> {
  data: T | null;
  binId: string | null;
  loading: boolean;
  error: string | null;
  save: (data: T) => Promise<boolean>;
  load: (binId: string) => Promise<void>;
  create: (data: T) => Promise<string | null>;
  remove: () => Promise<boolean>;
  reset: () => void;
}

export function useMyJsonStorage<T = any>(
  options: UseMyJsonStorageOptions = {}
): UseMyJsonStorageReturn<T> {
  const { autoLoad = false, defaultData = null } = options;
  
  const [data, setData] = useState<T | null>(defaultData);
  const [binId, setBinId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetBinId: string) => {
    if (!targetBinId) {
      setError('No bin ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await myJsonStorage.readBin<T>(targetBinId);
      if (result) {
        setData(result);
        setBinId(targetBinId);
      } else {
        setData(defaultData);
        setError('Bin not found or empty');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, [defaultData]);

  const save = useCallback(async (newData: T): Promise<boolean> => {
    if (!binId) {
      setError('No bin ID available. Create a bin first.');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const success = await myJsonStorage.updateBin(binId, newData);
      if (success) {
        setData(newData);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [binId]);

  const create = useCallback(async (newData: T): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newBinId = await myJsonStorage.createBin(newData);
      if (newBinId) {
        setData(newData);
        setBinId(newBinId);
        return newBinId;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bin';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (): Promise<boolean> => {
    if (!binId) {
      setError('No bin ID available');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const success = await myJsonStorage.deleteBin(binId);
      if (success) {
        setData(defaultData);
        setBinId(null);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bin';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [binId, defaultData]);

  const reset = useCallback(() => {
    setData(defaultData);
    setBinId(null);
    setError(null);
    setLoading(false);
  }, [defaultData]);

  return {
    data,
    binId,
    loading,
    error,
    save,
    load,
    create,
    remove,
    reset
  };
}
