'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDataCache } from './data-cache-context';

interface UseCachedFetchResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useCachedFetch<T>(
  /** Stable prefix, e.g. "users", "properties" */
  cachePrefix: string,
  /** Function that takes params and returns an axios-like promise */
  fetcher: (params: Record<string, unknown>) => Promise<{ data: unknown }>,
  /** Query params — changing these triggers a new fetch (with its own cache slot) */
  params: Record<string, unknown>,
  /** Extract the result from the response. Defaults to res.data.data */
  extract: (res: { data: unknown }) => T = (res: any) => res.data?.data as T,
): UseCachedFetchResult<T> {
  const { get, set } = useDataCache();

  const cacheKey = `${cachePrefix}:${JSON.stringify(params)}`;
  const cached = get<T>(cacheKey);

  const [data, setData]       = useState<T | undefined>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError]     = useState('');
  const [tick, setTick]       = useState(0); // bump to force refetch

  // Track the most recent cache key to cancel stale responses
  const latestKey = useRef(cacheKey);
  latestKey.current = cacheKey;

  useEffect(() => {
    const thisKey = cacheKey;

    // Serve from cache if available (and no forced refetch)
    const hit = get<T>(thisKey);
    if (hit) {
      setData(hit);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    fetcher(params)
      .then(res => {
        if (latestKey.current !== thisKey) return; // stale response
        const result = extract(res);
        set(thisKey, result);
        setData(result);
      })
      .catch(err => {
        if (latestKey.current !== thisKey) return;
        setError(err.response?.data?.message || 'Failed to load data');
      })
      .finally(() => {
        if (latestKey.current === thisKey) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, tick]);

  const refetch = useCallback(() => {
    // Bust this specific cache entry, then re-run effect
    set(cacheKey, undefined as unknown as T); // effectively removes it
    setTick(t => t + 1);
  }, [cacheKey, set]);

  return { data, loading, error, refetch };
}
