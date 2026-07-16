import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { userAdmin } from '@/services/adminService';
import { UserMultiSelect } from './UserMultiSelect';

vi.mock('@/services/adminService', () => ({
  userAdmin: { list: vi.fn() },
}));
const mockedUserAdmin = vi.mocked(userAdmin);

describe('UserMultiSelect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches users once and toggles selection', async () => {
    mockedUserAdmin.list.mockResolvedValue({
      users: [
        { id: 1, name: 'Ada Lovelace', email: 'ada@test.dev', role: 'cluster_head', department: null, is_active: true },
      ],
      total: 1,
      page: 1,
      page_size: 200,
    });
    const onChange = vi.fn();
    render(<UserMultiSelect label="Heads" selected={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(onChange).toHaveBeenCalledWith([1]);
  });
});
