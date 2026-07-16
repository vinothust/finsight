import { apiFetch } from '@/lib/api';

export interface ScopeOption {
  id: number;
  name: string;
}

export const filterService = {
  getClusters: (): Promise<ScopeOption[]> => apiFetch<ScopeOption[]>('/scope-options/clusters'),
  getAccounts: (): Promise<ScopeOption[]> => apiFetch<ScopeOption[]>('/scope-options/accounts'),
  getProjects: (): Promise<(ScopeOption & { account_id: number })[]> =>
    apiFetch<(ScopeOption & { account_id: number })[]>('/scope-options/projects'),
};
