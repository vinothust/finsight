import { apiFetch } from '@/lib/api';

export interface PagedResult {
  total: number;
  page: number;
  page_size: number;
}

export interface ClusterListItem {
  id: number;
  name: string;
  description: string | null;
  account_count: number;
}

export interface ClusterDetail {
  id: number;
  name: string;
  description: string | null;
  accounts: { id: number; name: string }[];
  heads: { id: number; name: string; email: string }[];
}

export interface AccountListItem {
  id: number;
  name: string;
  cluster_id: number;
  project_count: number;
}

export interface AccountDetail {
  id: number;
  name: string;
  cluster_id: number;
  projects: { id: number; name: string }[];
  directors: { id: number; name: string; email: string }[];
}

export interface ProjectListItem {
  id: number;
  name: string;
  account_id: number;
  status: string;
}

export interface ProjectDetail {
  id: number;
  name: string;
  account_id: number;
  status: string;
  managers: { id: number; name: string; email: string }[];
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  is_active: boolean;
}

export interface Role {
  value: string;
  label: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const clusterAdmin = {
  list: (params: { search?: string; page?: number; page_size?: number } = {}) =>
    apiFetch<{ clusters: ClusterListItem[] } & PagedResult>(`/clusters${buildQuery(params)}`),
  create: (payload: { name: string; description?: string | null; heads?: number[] }) =>
    apiFetch<{ cluster: ClusterDetail }>('/clusters', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; description: string | null; heads: number[] }>) =>
    apiFetch<{ cluster: ClusterDetail }>(`/clusters/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<{ success: boolean; message: string }>(`/clusters/${id}`, { method: 'DELETE' }),
};

export const accountAdmin = {
  list: (params: { search?: string; cluster_id?: number; page?: number; page_size?: number } = {}) =>
    apiFetch<{ accounts: AccountListItem[] } & PagedResult>(`/accounts${buildQuery(params)}`),
  create: (payload: { name: string; cluster_id: number; directors?: number[] }) =>
    apiFetch<{ account: AccountDetail }>('/accounts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; cluster_id: number; directors: number[] }>) =>
    apiFetch<{ account: AccountDetail }>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<{ success: boolean; message: string }>(`/accounts/${id}`, { method: 'DELETE' }),
};

export const projectAdmin = {
  list: (params: { search?: string; account_id?: number; page?: number; page_size?: number } = {}) =>
    apiFetch<{ projects: ProjectListItem[] } & PagedResult>(`/projects${buildQuery(params)}`),
  create: (payload: { name: string; account_id: number; status?: string; managers?: number[] }) =>
    apiFetch<{ project: ProjectDetail }>('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; account_id: number; status: string; managers: number[] }>) =>
    apiFetch<{ project: ProjectDetail }>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<{ success: boolean; message: string }>(`/projects/${id}`, { method: 'DELETE' }),
};

export const userAdmin = {
  list: (params: { search?: string; role?: string; page?: number; page_size?: number } = {}) =>
    apiFetch<{ users: AdminUserItem[] } & PagedResult>(`/users${buildQuery(params)}`),
  create: (payload: { name: string; email: string; role: string; department?: string | null }) =>
    apiFetch<{ user: AdminUserItem; temp_password: string }>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; email: string; role: string; department: string | null }>) =>
    apiFetch<{ user: AdminUserItem }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => apiFetch<{ success: boolean; message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

export const roleAdmin = {
  list: () => apiFetch<{ roles: Role[] }>('/roles'),
};
