'use client';
import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface CacheEntry<T = unknown> {
  data: T;
  fetchedAt: number;   // Date.now()
}

interface DataCacheContextType {
  /** Return cached data for key, or undefined if not yet fetched */
  get: <T>(key: string) => T | undefined;
  /** Store data in cache */
  set: <T>(key: string, data: T) => void;
  /** Remove a single key so the next visit re-fetches */
  invalidate: (key: string) => void;
  /** Remove all keys that start with prefix */
  invalidatePrefix: (prefix: string) => void;
  /** Check if a key has a fresh entry */
  has: (key: string) => boolean;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  // useRef so the cache survives re-renders without triggering them
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const get = useCallback(<T,>(key: string): T | undefined => {
    const entry = cache.current.get(key);
    return entry ? (entry.data as T) : undefined;
  }, []);

  const set = useCallback(<T,>(key: string, data: T): void => {
    cache.current.set(key, { data, fetchedAt: Date.now() });
  }, []);

  const invalidate = useCallback((key: string): void => {
    cache.current.delete(key);
  }, []);

  const invalidatePrefix = useCallback((prefix: string): void => {
    for (const key of cache.current.keys()) {
      if (key.startsWith(prefix)) cache.current.delete(key);
    }
  }, []);

  const has = useCallback((key: string): boolean => {
    return cache.current.has(key);
  }, []);

  return (
    <DataCacheContext.Provider value={{ get, set, invalidate, invalidatePrefix, has }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}
