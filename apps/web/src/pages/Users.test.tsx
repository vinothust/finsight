import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { userAdmin, roleAdmin } from '@/services/adminService';
import Users from './Users';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/adminService', () => ({
  userAdmin: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  roleAdmin: { list: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);
const mockedUserAdmin = vi.mocked(userAdmin);
const mockedRoleAdmin = vi.mocked(roleAdmin);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Users />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Users page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.dev', role: 'admin' });
    mockedRoleAdmin.list.mockResolvedValue({
      roles: [
        { value: 'admin', label: 'Administrator' },
        { value: 'cluster_head', label: 'Cluster Head' },
      ],
    });
  });

  it('renders the heading and lists users', async () => {
    mockedUserAdmin.list.mockResolvedValue({
      users: [{ id: 1, name: 'Ada Lovelace', email: 'ada@test.dev', role: 'admin', department: 'Engineering', is_active: true }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
  });

  it('creates a user and shows the temp password dialog', async () => {
    mockedUserAdmin.list.mockResolvedValue({ users: [], total: 0, page: 1, page_size: 20 });
    mockedUserAdmin.create.mockResolvedValue({
      user: { id: 2, name: 'Grace Hopper', email: 'grace@test.dev', role: 'admin', department: null, is_active: true },
      temp_password: 'temp-secret-123',
    });

    renderPage();
    await waitFor(() => expect(mockedUserAdmin.list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Grace Hopper' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'grace@test.dev' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'Role' }));
    await waitFor(() => expect(screen.getByRole('option', { name: 'Administrator' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('option', { name: 'Administrator' }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(screen.getByText('temp-secret-123')).toBeInTheDocument());
  });

  it('shows an admins-only message on a 403 response', async () => {
    const forbidden = new Error('not enough permissions') as Error & { status?: number };
    forbidden.status = 403;
    mockedUserAdmin.list.mockRejectedValue(forbidden);

    renderPage();

    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });
});
