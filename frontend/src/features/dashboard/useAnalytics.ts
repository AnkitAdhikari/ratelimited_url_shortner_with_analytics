import { useCallback, useEffect, useState } from 'react';

import { getAnalytics, type DailyCount } from '../../api/client';

export interface UseAnalytics {
  series: DailyCount[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// 7-days click series for selected alias
export function useAnalytics(alias: string | null): UseAnalytics {
  const [series, setSeries] = useState<DailyCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (alias === null) {
      setSeries([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analytics = await getAnalytics(alias);
      setSeries(analytics.series);
    } catch {
      setError('Could not load analytics for this URL.');
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [alias]);

  useEffect(() => {
    void load();
  }, [load]);

  return { series, loading, error, refresh: () => void load() };
}
