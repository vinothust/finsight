import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { aiService } from '@/services/aiService';
import { InsightsPanel } from './InsightsPanel';
import type { FilterState } from '@/types';

vi.mock('@/services/aiService', () => ({
  aiService: { getInsights: vi.fn() },
}));
const mockedAiService = vi.mocked(aiService);

const FILTERS: FilterState = {
  clusters: [],
  accounts: [],
  projects: [],
  analyzeBy: [],
  years: [],
  months: [],
  marginRange: [0, 100],
};

describe('InsightsPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders insight cards from the All tab by default', async () => {
    mockedAiService.getInsights.mockResolvedValue({
      insights: [{ title: 'Revenue Trend', description: 'Revenue grew 5%.', metric: 'revenue', change: 0.05 }],
      generated_at: '2026-01-01T00:00:00Z',
    });

    render(<InsightsPanel filters={FILTERS} />);

    await waitFor(() => expect(screen.getByText('Revenue Trend')).toBeInTheDocument());
    expect(screen.getByText('Revenue grew 5%.')).toBeInTheDocument();
    expect(mockedAiService.getInsights).toHaveBeenCalledWith({});
  });

  it('refetches with focus_area when a tab is selected', async () => {
    mockedAiService.getInsights.mockResolvedValue({ insights: [], generated_at: '2026-01-01T00:00:00Z' });

    render(<InsightsPanel filters={FILTERS} />);
    await waitFor(() => expect(mockedAiService.getInsights).toHaveBeenCalledTimes(1));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Revenue' }));

    await waitFor(() => expect(mockedAiService.getInsights).toHaveBeenLastCalledWith({ focus_area: 'revenue' }));
  });
});
