import React from 'react';
import { DollarSign, TrendingUp, Users, Target, Percent } from 'lucide-react';
import type { KpiSummary } from '@/services/pnlService';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  kpis: KpiSummary | null;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const EMPTY_KPIS: KpiSummary = {
  revenue: 0,
  cost: 0,
  gross_profit: 0,
  margin: 0,
  headcount: 0,
  utilization: 0,
  revenue_per_head: 0,
  cost_per_head: 0,
};

const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const metrics = kpis ?? EMPTY_KPIS;

  const tiles = [
    { title: 'Revenue', value: formatCurrency(metrics.revenue), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Cost', value: formatCurrency(metrics.cost), icon: DollarSign, color: 'text-destructive', bgColor: 'bg-destructive/10' },
    {
      title: 'Gross Profit',
      value: formatCurrency(metrics.gross_profit),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Margin',
      value: `${(metrics.margin * 100).toFixed(1)}%`,
      icon: Percent,
      color: metrics.margin >= 0.3 ? 'text-success' : 'text-warning',
      bgColor: metrics.margin >= 0.3 ? 'bg-success/10' : 'bg-warning/10',
    },
    { title: 'Headcount', value: Math.round(metrics.headcount).toString(), icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Utilization', value: `${metrics.utilization.toFixed(1)}%`, icon: Target, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    {
      title: 'Revenue / Head',
      value: formatCurrency(metrics.revenue_per_head),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600/10',
    },
    { title: 'Cost / Head', value: formatCurrency(metrics.cost_per_head), icon: DollarSign, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <Card key={tile.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className={cn('p-2 rounded-lg w-fit', tile.bgColor)}>
              <tile.icon size={18} className={tile.color} />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-display">{tile.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tile.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;
