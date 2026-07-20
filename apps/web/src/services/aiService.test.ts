import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import { aiService } from './aiService';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe('aiService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sendChatMessage posts only the new message and conversation_id, no filters key', async () => {
    mockedApiFetch.mockResolvedValue({ response: 'hi', conversation_id: 1, timestamp: '2026-01-01T00:00:00Z' });

    await aiService.sendChatMessage('What was revenue last quarter?', 1);

    expect(mockedApiFetch).toHaveBeenCalledWith('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What was revenue last quarter?' }],
        conversation_id: 1,
      }),
    });
  });

  it('sendChatMessage omits conversation_id when starting a new thread', async () => {
    mockedApiFetch.mockResolvedValue({ response: 'hi', conversation_id: 2, timestamp: '2026-01-01T00:00:00Z' });

    await aiService.sendChatMessage('Hello');

    expect(mockedApiFetch).toHaveBeenCalledWith('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
  });

  it('getInsights builds query params from cluster_ids/account_ids/years/focus_area only', async () => {
    mockedApiFetch.mockResolvedValue({ insights: [], generated_at: '2026-01-01T00:00:00Z' });

    await aiService.getInsights({ cluster_ids: [1, 2], account_ids: [3], years: [2025], focus_area: 'revenue' });

    expect(mockedApiFetch).toHaveBeenCalledWith('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({
        cluster_ids: [1, 2],
        account_ids: [3],
        years: [2025],
        focus_area: 'revenue',
      }),
    });
  });

  it('getInsights omits focus_area when not provided', async () => {
    mockedApiFetch.mockResolvedValue({ insights: [], generated_at: '2026-01-01T00:00:00Z' });

    await aiService.getInsights({ cluster_ids: [1] });

    expect(mockedApiFetch).toHaveBeenCalledWith('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ cluster_ids: [1] }),
    });
  });
});
