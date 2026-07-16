import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePaginatedList } from './usePaginatedList';

describe('usePaginatedList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('fetches page 1 on mount', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [{ id: 1 }], total: 1 });
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]));
    expect(fetchPage).toHaveBeenCalledWith({ search: '', page: 1, page_size: 20 });
  });

  it('debounces search changes and resets to page 1', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => usePaginatedList(fetchPage));
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith({ search: '', page: 2, page_size: 20 }));

    act(() => result.current.setSearch('acme'));
    act(() => vi.advanceTimersByTime(300));
    await waitFor(() =>
      expect(fetchPage).toHaveBeenLastCalledWith({ search: 'acme', page: 1, page_size: 20 })
    );
  });

  it('exposes the fetch error instead of throwing', async () => {
    const forbidden = new Error('not enough permissions') as Error & { status?: number };
    forbidden.status = 403;
    const fetchPage = vi.fn().mockRejectedValue(forbidden);
    const { result } = renderHook(() => usePaginatedList(fetchPage));

    await waitFor(() => expect(result.current.error).toBe(forbidden));
  });
});
