export type UserRole = 'admin' | 'cluster_head' | 'account_director' | 'project_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clusters?: string[];
  accounts?: string[];
  projects?: string[];
}

export interface Cluster {
  id: string;
  name: string;
  accounts: string[];
}

export interface Account {
  id: string;
  name: string;
  clusterId: string;
  directors: string[];
}

export interface Project {
  id: string;
  name: string;
  accountId: string;
  managers: string[];
}

export interface PnLData {
  id: string;
  cluster: string;
  account: string;
  project: string;
  year: number;
  month: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
  netEbitda?: number;
  ebitdaPercentage?: number;
  headcount: number;
  utilization: number;
}

export interface FilterState {
  clusters: string[];
  accounts: string[];
  projects: string[];
  analyzeBy: string[];
  years: number[];
  months: string[];
  marginRange: [number, number];
  revenueRange?: [number, number];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIChatFilters {
  clusterIds?: (string | number)[];
  accountIds?: (string | number)[];
  projectIds?: (string | number)[];
  years?: (string | number)[];
  months?: (string | number)[];
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const KPI_OPTIONS = [
  'Revenue',
  'Cost',
  'Gross Profit',
  'Margin %',
  'Headcount',
  'Utilization %',
  'Revenue per Head',
  'Cost per Head'
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  cluster_head: 'Cluster Head',
  account_director: 'Account Director',
  project_manager: 'Project Manager'
};
