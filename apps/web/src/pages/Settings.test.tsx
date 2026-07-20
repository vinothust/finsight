import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import Settings from './Settings';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn(), changePassword: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Settings />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({
      id: '1',
      name: 'Ada Lovelace',
      email: 'ada@test.dev',
      role: 'admin',
      department: 'Engineering',
    });
  });

  it('renders the heading and profile fields', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument());
    expect(screen.getByText('ada@test.dev')).toBeInTheDocument();
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('shows a validation error when new and confirm passwords do not match, without calling the service', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'OldPassword123!' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'NewPassword123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Mismatch123!' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockedAuthService.changePassword).not.toHaveBeenCalled();
  });

  it('submits a valid password change and clears the form on success', async () => {
    mockedAuthService.changePassword.mockResolvedValue(undefined);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'OldPassword123!' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'NewPassword123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'NewPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(mockedAuthService.changePassword).toHaveBeenCalledWith('OldPassword123!', 'NewPassword123!')
    );
    await waitFor(() => expect(screen.getByLabelText(/current password/i)).toHaveValue(''));
  });

  it('surfaces the backend error message on failure', async () => {
    mockedAuthService.changePassword.mockRejectedValue(new Error('current password is incorrect'));
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Ada Lovelace')[0]).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'WrongPassword!' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'NewPassword123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'NewPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(mockedAuthService.changePassword).toHaveBeenCalled());
  });
});
