import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatWidget } from './ChatWidget';

vi.mock('@/services/aiService', () => ({
  aiService: { sendChatMessage: vi.fn() },
}));

describe('ChatWidget', () => {
  it('opens the chat panel on click and closes it', () => {
    render(<ChatWidget />);

    expect(screen.queryByText('FinSight AI')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));
    expect(screen.getByText('FinSight AI')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('FinSight AI')).not.toBeInTheDocument();
  });
});
