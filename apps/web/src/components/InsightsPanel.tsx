import { useState } from 'react';
import { useInsights } from '@/hooks/useInsights';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { FilterState } from '@/types';

export interface InsightsPanelProps {
  filters: FilterState;
}

const TABS: { value: string; label: string; focusArea: string | null }[] = [
  { value: 'all', label: 'All', focusArea: null },
  { value: 'revenue', label: 'Revenue', focusArea: 'revenue' },
  { value: 'margin', label: 'Margin', focusArea: 'margin' },
  { value: 'utilization', label: 'Utilization', focusArea: 'utilization' },
];

function formatChange(metric: string, change: number): string {
  if (metric === 'utilization') {
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)} pts`;
  }
  return `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%`;
}

export function InsightsPanel({ filters }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState('all');
  const focusArea = TABS.find((t) => t.value === activeTab)?.focusArea ?? null;
  const { insights, isLoading } = useInsights(filters, focusArea);

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <h3 className="font-semibold font-display">AI Insights</h3>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : insights.length === 0 ? (
            <p className="text-muted-foreground text-sm">No insights available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <div key={insight.title} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{insight.title}</span>
                    <Badge variant={insight.change >= 0 ? 'secondary' : 'destructive'}>
                      {formatChange(insight.metric, insight.change)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
