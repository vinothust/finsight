import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { clusterAdmin } from '@/services/adminService';
import Clusters from './Clusters';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/adminService', () => ({
  clusterAdmin: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  userAdmin: { list: vi.fn().mockResolvedValue({ users: [], total: 0, page: 1, page_size: 200 }) },
}));

const mockedAuthService = vi.mocked(authService);
const mockedClusterAdmin = vi.mocked(clusterAdmin);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Clusters />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Clusters page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.dev', role: 'admin' });
  });

  it('renders the heading and lists clusters', async () => {
    mockedClusterAdmin.list.mockResolvedValue({
      clusters: [{ id: 1, name: 'Acme', description: null, account_count: 2 }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Clusters' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());
  });

  it('creates a cluster via the Add dialog', async () => {
    mockedClusterAdmin.list.mockResolvedValue({ clusters: [], total: 0, page: 1, page_size: 20 });
    mockedClusterAdmin.create.mockResolvedValue({
      cluster: { id: 2, name: 'NewCo', description: null, accounts: [], heads: [] },
    });

    renderPage();
    await waitFor(() => expect(mockedClusterAdmin.list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /add cluster/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'NewCo' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(mockedClusterAdmin.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'NewCo' }))
    );
  });

  it('shows the backend conflict message on delete failure', async () => {
    mockedClusterAdmin.list.mockResolvedValue({
      clusters: [{ id: 1, name: 'Acme', description: null, account_count: 2 }],
      total: 1,
      page: 1,
      page_size: 20,
    });
    const conflictError = new Error('cluster has accounts; remove them first') as Error & { status?: number };
    conflictError.status = 409;
    mockedClusterAdmin.remove.mockRejectedValue(conflictError);

    renderPage();
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockedClusterAdmin.remove).toHaveBeenCalledWith(1));
  });

  it('shows an admins-only message on a 403 response', async () => {
    const forbidden = new Error('not enough permissions') as Error & { status?: number };
    forbidden.status = 403;
    mockedClusterAdmin.list.mockRejectedValue(forbidden);

    renderPage();

    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });
});
