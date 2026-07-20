import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { aiService } from '@/services/aiService';
import { ChatPanel } from './ChatPanel';

vi.mock('@/services/aiService', () => ({
  aiService: { sendChatMessage: vi.fn() },
}));
const mockedAiService = vi.mocked(aiService);

describe('ChatPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a greeting and calls onClose', () => {
    const onClose = vi.fn();
    render(<ChatPanel onClose={onClose} />);

    expect(screen.getByText('FinSight AI')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sends a message and appends the response, then reuses conversation_id on the next send', async () => {
    mockedAiService.sendChatMessage.mockResolvedValueOnce({
      response: 'Revenue was $100k.',
      conversation_id: 42,
      timestamp: '2026-01-01T00:00:00Z',
    });

    render(<ChatPanel onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'What was revenue?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('What was revenue?')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Revenue was $100k.')).toBeInTheDocument());
    expect(mockedAiService.sendChatMessage).toHaveBeenCalledWith('What was revenue?', undefined);

    mockedAiService.sendChatMessage.mockResolvedValueOnce({
      response: 'Margin was 30%.',
      conversation_id: 42,
      timestamp: '2026-01-01T00:01:00Z',
    });
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'And margin?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(screen.getByText('Margin was 30%.')).toBeInTheDocument());
    expect(mockedAiService.sendChatMessage).toHaveBeenLastCalledWith('And margin?', 42);
  });

  it('shows a toast and keeps the failed message on error', async () => {
    mockedAiService.sendChatMessage.mockRejectedValue(new Error('network down'));

    render(<ChatPanel onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'Hello?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(mockedAiService.sendChatMessage).toHaveBeenCalled());
    expect(screen.getByText('Hello?')).toBeInTheDocument();
  });
});
