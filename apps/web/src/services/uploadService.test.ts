import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import { uploadService } from './uploadService';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, apiFetch: vi.fn() };
});
const mockedApiFetch = vi.mocked(apiFetch);

describe('uploadService', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('previewUpload posts FormData with the file to /uploads/{dataset}/preview', async () => {
    mockedApiFetch.mockResolvedValue({ upload_id: 1, filename: 'a.csv', row_count: 1, preview: [], errors: [] });
    const file = new File(['a,b\n1,2'], 'a.csv', { type: 'text/csv' });

    await uploadService.previewUpload('financial', file);

    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = mockedApiFetch.mock.calls[0];
    expect(path).toBe('/uploads/financial/preview');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('file')).toBe(file);
  });

  it('commitUpload posts to /uploads/{id}/commit', async () => {
    mockedApiFetch.mockResolvedValue({ success: true, rows_inserted: 5, message: 'upload committed' });

    await uploadService.commitUpload(42);

    expect(mockedApiFetch).toHaveBeenCalledWith('/uploads/42/commit', { method: 'POST' });
  });

  it('downloadTemplate fetches the right template path with credentials', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Blob(['binary']), { status: 200, headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
    );
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() });

    await uploadService.downloadTemplate('pnl');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/templates/pnl');
    expect(options.credentials).toBe('include');
  });
});
