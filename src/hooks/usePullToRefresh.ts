import { useCallback, useState } from "react";

/** Shared loading/refreshing state for a list screen with pull-to-refresh. */
export function usePullToRefresh(fetchFn: () => Promise<void>) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { await fetchFn(); } finally { setLoading(false); }
  }, [fetchFn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchFn(); } finally { setRefreshing(false); }
  }, [fetchFn]);

  return { loading, refreshing, load, onRefresh };
}
