import { apiFetch, BASE_URL } from '@/lib/api';

export interface PreviewResponse {
  upload_id: number;
  filename: string;
  row_count: number;
  preview: Record<string, unknown>[];
  errors: { row: number; error: string }[];
}

export interface CommitResponse {
  success: boolean;
  rows_inserted: number;
  message: string;
}

const TEMPLATE_PATHS: Record<'pnl' | 'utilization', string> = {
  pnl: '/templates/pnl',
  utilization: '/templates/utilization',
};

export const uploadService = {
  previewUpload: (dataset: 'financial' | 'utilization', file: File) => {
    const form = new FormData();
    form.set('file', file);
    return apiFetch<PreviewResponse>(`/uploads/${dataset}/preview`, { method: 'POST', body: form });
  },

  commitUpload: (uploadId: number) =>
    apiFetch<CommitResponse>(`/uploads/${uploadId}/commit`, { method: 'POST' }),

  downloadTemplate: async (kind: 'pnl' | 'utilization') => {
    const response = await fetch(`${BASE_URL}${TEMPLATE_PATHS[kind]}`, { credentials: 'include' });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = kind === 'pnl' ? 'pnl_template.xlsx' : 'utilization_template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  },
};
