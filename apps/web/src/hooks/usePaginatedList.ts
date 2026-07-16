import { useEffect, useState } from 'react';

export function usePaginatedList<T>(
  fetchPage: (params: { search: string; page: number; page_size: number }) => Promise<{ items: T[]; total: number }>,
  pageSize = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);
  const [refetchCount, setRefetchCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchPage({ search: debouncedSearch, page, page_size: pageSize })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, pageSize, refetchCount]);

  return {
    items,
    total,
    page,
    setPage,
    search,
    setSearch,
    isLoading,
    error,
    refetch: () => setRefetchCount((c) => c + 1),
  };
}
