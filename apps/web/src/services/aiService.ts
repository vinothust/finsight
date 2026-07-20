import { apiFetch } from '@/lib/api';

export interface ChatResponse {
  response: string;
  conversation_id: number;
  timestamp: string;
}

export interface InsightItem {
  title: string;
  description: string;
  metric: string;
  change: number;
}

export interface InsightsResponse {
  insights: InsightItem[];
  generated_at: string;
}

export interface InsightsParams {
  cluster_ids?: number[];
  account_ids?: number[];
  years?: number[];
  focus_area?: string;
}

export const aiService = {
  sendChatMessage: (content: string, conversationId?: number) =>
    apiFetch<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        conversation_id: conversationId,
      }),
    }),

  getInsights: (params: InsightsParams) =>
    apiFetch<InsightsResponse>('/ai/insights', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
