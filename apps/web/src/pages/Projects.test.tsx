import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { projectAdmin, accountAdmin, userAdmin } from '@/services/adminService';
import Projects from './Projects';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/adminService', () => ({
  projectAdmin: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  accountAdmin: { list: vi.fn() },
  userAdmin: { list: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);
const mockedProjectAdmin = vi.mocked(projectAdmin);
const mockedAccountAdmin = vi.mocked(accountAdmin);
const mockedUserAdmin = vi.mocked(userAdmin);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Projects />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Projects page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.dev', role: 'admin' });
    mockedUserAdmin.list.mockResolvedValue({ users: [], total: 0, page: 1, page_size: 200 });
    mockedAccountAdmin.list.mockResolvedValue({
      accounts: [{ id: 1, name: 'Acme Account', cluster_id: 1, project_count: 0 }],
      total: 1,
      page: 1,
      page_size: 200,
    });
  });

  it('renders the heading and lists projects', async () => {
    mockedProjectAdmin.list.mockResolvedValue({
      projects: [{ id: 1, name: 'Acme Project', account_id: 1, status: 'active' }],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Acme Project')).toBeInTheDocument());
  });

  it('creates a project via the Add dialog', async () => {
    mockedProjectAdmin.list.mockResolvedValue({ projects: [], total: 0, page: 1, page_size: 20 });
    mockedProjectAdmin.create.mockResolvedValue({
      project: { id: 2, name: 'NewProj', account_id: 1, status: 'active', managers: [] },
    });

    renderPage();
    await waitFor(() => expect(mockedProjectAdmin.list).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /add project/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'NewProj' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'Account' }));
    await waitFor(() => expect(screen.getByText('Acme Account')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Acme Account'));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockedProjectAdmin.create).toHaveBeenCalled());
  });

  it('shows an admins-only message on a 403 response', async () => {
    const forbidden = new Error('not enough permissions') as Error & { status?: number };
    forbidden.status = 403;
    mockedProjectAdmin.list.mockRejectedValue(forbidden);

    renderPage();

    await waitFor(() => expect(screen.getByText(/do not have permission/i)).toBeInTheDocument());
  });
});
