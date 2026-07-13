const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

export interface RequestOptions {
  role: string;
  scopeId?: number | null;
}

async function request<T>(path: string, options: RequestOptions, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Role": options.role,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (options.scopeId != null) headers["X-Scope-Id"] = String(options.scopeId);

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export interface RevenueMarginPoint {
  period: string;
  revenue: number;
  cost: number;
  margin: number;
}
export function getRevenueMargin(options: RequestOptions) {
  return request<RevenueMarginPoint[]>("/dashboard/revenue-margin", options);
}

export interface UtilizationPoint {
  period: string;
  avg_allocation_pct: number;
  bench_pct: number;
}
export function getUtilization(options: RequestOptions) {
  return request<UtilizationPoint[]>("/dashboard/utilization", options);
}

export interface ScorecardEntry {
  program_id: number;
  program_name: string;
  margin: number;
  rag_status: "green" | "yellow" | "red";
}
export function getScorecards(options: RequestOptions) {
  return request<ScorecardEntry[]>("/scorecards", options);
}

export function getInsight(options: RequestOptions) {
  return request<{ narrative: string }>("/insights", options);
}

export interface NLQResult {
  sql: string;
  rows: Record<string, unknown>[];
  explanation: string;
}
export function askQuestion(question: string, options: RequestOptions) {
  return request<NLQResult>("/nlq", options, { method: "POST", body: JSON.stringify({ question }) });
}

export async function uploadDataset(dataset: "financial" | "utilization", file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads?dataset=${dataset}`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Upload failed: ${await response.text()}`);
  return response.json();
}

export interface AccountOption {
  id: number;
  name: string;
}
export async function getAccountOptions(): Promise<AccountOption[]> {
  const response = await fetch(`${API_BASE}/scope-options/accounts`);
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<AccountOption[]>;
}

export interface ProgramOption {
  id: number;
  name: string;
  account_id: number;
}
export async function getProgramOptions(): Promise<ProgramOption[]> {
  const response = await fetch(`${API_BASE}/scope-options/programs`);
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<ProgramOption[]>;
}

export interface LLMSettings {
  gcp_project: string;
  gcp_location: string;
  model_simple: string;
  model_complex: string;
  model_fallback: string;
}
export async function getLLMSettings(): Promise<LLMSettings> {
  const response = await fetch(`${API_BASE}/llm-settings`);
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<LLMSettings>;
}
export async function updateLLMSettings(payload: Partial<LLMSettings>): Promise<LLMSettings> {
  const response = await fetch(`${API_BASE}/llm-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<LLMSettings>;
}
