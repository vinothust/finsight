import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { aiService } from '@/services/aiService';
import { useInsights } from './useInsights';
import type { FilterState } from '@/types';

vi.mock('@/services/aiService', () => ({
  aiService: { getInsights: vi.fn() },
}));
const mockedAiService = vi.mocked(aiService);

const FILTERS: FilterState = {
  clusters: ['1', '2'],
  accounts: ['3'],
  projects: [],
  analyzeBy: [],
  years: [2025],
  months: [],
  marginRange: [0, 100],
};

describe('useInsights', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches insights mapping filters to numeric ids, omitting focus_area for null', async () => {
    mockedAiService.getInsights.mockResolvedValue({ insights: [], generated_at: '2026-01-01T00:00:00Z' });

    const { result } = renderHook(() => useInsights(FILTERS, null));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedAiService.getInsights).toHaveBeenCalledWith({
      cluster_ids: [1, 2],
      account_ids: [3],
      years: [2025],
    });
  });

  it('includes focus_area when set', async () => {
    mockedAiService.getInsights.mockResolvedValue({ insights: [], generated_at: '2026-01-01T00:00:00Z' });

    renderHook(() => useInsights(FILTERS, 'revenue'));

    await waitFor(() =>
      expect(mockedAiService.getInsights).toHaveBeenCalledWith({
        cluster_ids: [1, 2],
        account_ids: [3],
        years: [2025],
        focus_area: 'revenue',
      })
    );
  });
});
