import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { uploadService } from '@/services/uploadService';
import Upload from './Upload';

vi.mock('@/services/authService', () => ({
  authService: { getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/uploadService', () => ({
  uploadService: { previewUpload: vi.fn(), commitUpload: vi.fn(), downloadTemplate: vi.fn() },
}));

const mockedAuthService = vi.mocked(authService);
const mockedUploadService = vi.mocked(uploadService);

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Upload />
      </AuthProvider>
    </MemoryRouter>
  );
}

function makeFile(name = 'financial.csv') {
  return new File(['account_name,program_name,period,revenue,cost\nAcme,Proj,2026-01-01,100,50'], name, {
    type: 'text/csv',
  });
}

describe('Upload page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthService.getCurrentUser.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.dev', role: 'admin' });
  });

  it('renders the heading and dataset tabs', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Upload Data' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Financial' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Utilization' })).toBeInTheDocument();
  });

  it('previews a selected financial file and shows rows and errors', async () => {
    mockedUploadService.previewUpload.mockResolvedValue({
      upload_id: 7,
      filename: 'financial.csv',
      row_count: 1,
      preview: [{ project_id: 3, period: '2026-01-01', revenue: 100, cost: 50 }],
      errors: [{ row: 3, error: 'missing revenue' }],
    });

    renderPage();
    const input = screen.getByLabelText(/choose file/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(mockedUploadService.previewUpload).toHaveBeenCalledWith('financial', expect.any(File)));
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
    expect(screen.getByText(/missing revenue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commit/i })).toBeEnabled();
  });

  it('commits the previewed upload and resets afterward', async () => {
    mockedUploadService.previewUpload.mockResolvedValue({
      upload_id: 7,
      filename: 'financial.csv',
      row_count: 1,
      preview: [{ project_id: 3, period: '2026-01-01', revenue: 100, cost: 50 }],
      errors: [],
    });
    mockedUploadService.commitUpload.mockResolvedValue({ success: true, rows_inserted: 1, message: 'upload committed' });

    renderPage();
    const input = screen.getByLabelText(/choose file/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(screen.getByRole('button', { name: /commit/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /commit/i }));

    await waitFor(() => expect(mockedUploadService.commitUpload).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByText('100')).not.toBeInTheDocument());
  });

  it('discards the preview when switching dataset tabs', async () => {
    mockedUploadService.previewUpload.mockResolvedValue({
      upload_id: 7,
      filename: 'financial.csv',
      row_count: 1,
      preview: [{ project_id: 3, period: '2026-01-01', revenue: 100, cost: 50 }],
      errors: [],
    });

    renderPage();
    const input = screen.getByLabelText(/choose file/i, { selector: 'input' });
    fireEvent.change(input, { target: { files: [makeFile()] } });
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Utilization' }));

    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('downloads a template when the button is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /download p&l template/i }));
    expect(mockedUploadService.downloadTemplate).toHaveBeenCalledWith('pnl');
  });
});
