import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { accountAdmin, clusterAdmin, userAdmin } from '@/services/adminService';
import Accounts from './Accounts';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/adminService', () => ({
  accountAdmin: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  clusterAdmin: { list: vi.fn() },
  userAdmin: { list: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);
const mockedAccountAdmin = vi.mocked(accountAdmin);
const mockedClusterAdmin = vi.mocked(clusterAdmin);
const mockedUserAdmin = vi.mocked(userAdmin);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Accounts />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Accounts page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.dev', role: 'admin' });
    mockedUserAdmin.list.mockResolvedValue({ users: [], total: 0, page: 1, page_size: 200 });
    mockedClusterAdmin.list.mockResolvedValue({
      clusters: [{ id: 1, name: 'Acme Cluster', description: null, account_count: 0 }],
      total: 1,
      page: 1,
      page_size: 200,
    });
  });

  it('renders the heading and lists accounts', async () => {
    mockedAccountAdmin.list.mockResolvedValue({
      accounts: [{ id: 1, name: 'Acme Account', cluster_id: 1, project_count: 0 }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Acme Account')).toBeInTheDocument());
  });

  it('creates an account via the Add dialog', async () => {
    mockedAccountAdmin.list.mockResolvedValue({ accounts: [], total: 0, page: 1, page_size: 20 });
    mockedAccountAdmin.create.mockResolvedValue({
      account: { id: 2, name: 'NewAcct', cluster_id: 1, projects: [], directors: [] },
    });

    renderPage();
    await waitFor(() => expect(mockedAccountAdmin.list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /add account/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'NewAcct' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'Cluster' }));
    await waitFor(() => expect(screen.getByText('Acme Cluster')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Cluster'));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockedAccountAdmin.create).toHaveBeenCalled());
  });

  it('shows an admins-only message on a 403 response', async () => {
    const forbidden = new Error('not enough permissions') as Error & { status?: number };
    forbidden.status = 403;
    mockedAccountAdmin.list.mockRejectedValue(forbidden);

    renderPage();

    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });
});
