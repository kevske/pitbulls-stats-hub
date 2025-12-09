import { useState, useEffect, useCallback } from 'react';
import { jsonbinStorage, JsonBinRecord } from '@/lib/jsonbinStorage';

export interface UseJsonBinStorageOptions {
  autoLoad?: boolean;
  defaultData?: any;
  binId?: string;
}

export interface UseJsonBinStorageReturn<T> {
  data: T | null;
  binId: string | null;
  loading: boolean;
  error: string | null;
  save: (data: T) => Promise<boolean>;
  load: (binId?: string) => Promise<void>;
  create: (data: T, name?: string) => Promise<string | null>;
  remove: () => Promise<boolean>;
  listBins: () => Promise<JsonBinRecord[]>;
  reset: () => void;
}

export function useJsonBinStorage<T = any>(
  options: UseJsonBinStorageOptions = {}
): UseJsonBinStorageReturn<T> {
  const { autoLoad = false, defaultData = null, binId: initialBinId } = options;
  
  const [data, setData] = useState<T | null>(defaultData);
  const [binId, setBinId] = useState<string | null>(initialBinId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetBinId?: string) => {
    const id = targetBinId || binId;
    if (!id) {
      setError('No bin ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await jsonbinStorage.readBin<T>(id);
      if (result) {
        setData(result);
        setBinId(id);
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
  }, [binId, defaultData]);

  const save = useCallback(async (newData: T): Promise<boolean> => {
    if (!binId) {
      setError('No bin ID available. Create a bin first.');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await jsonbinStorage.updateBin(binId, newData);
      if (result) {
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

  const create = useCallback(async (newData: T, name?: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await jsonbinStorage.createBin(newData, name);
      if (result) {
        setData(newData);
        setBinId(result.record.id);
        return result.record.id;
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
      const success = await jsonbinStorage.deleteBin(binId);
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

  const listBins = useCallback(async (): Promise<JsonBinRecord[]> => {
    try {
      return await jsonbinStorage.listBins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list bins');
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    setBinId(initialBinId || null);
    setError(null);
    setLoading(false);
  }, [defaultData, initialBinId]);

  useEffect(() => {
    if (autoLoad && binId) {
      load();
    }
  }, [autoLoad, binId, load]);

  return {
    data,
    binId,
    loading,
    error,
    save,
    load,
    create,
    remove,
    listBins,
    reset
  };
}

// Hook for managing multiple bins
export function useJsonBinManager() {
  const [bins, setBins] = useState<JsonBinRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const binList = await jsonbinStorage.listBins();
      setBins(binList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list bins';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    bins,
    loading,
    error,
    refresh
  };
}
