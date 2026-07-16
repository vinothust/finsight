import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { BreakdownPoint, RevenueTrendPoint, UtilizationTrendPoint } from '@/services/pnlService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataChartsProps {
  revenueTrend: RevenueTrendPoint[];
  revenueByCluster: BreakdownPoint[];
  marginByAccount: BreakdownPoint[];
  utilizationTrend: UtilizationTrendPoint[];
}

const CHART_COLORS = [
  'hsl(193, 100%, 16%)',
  'hsl(193, 70%, 35%)',
  'hsl(193, 50%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(142, 76%, 36%)',
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// recharts' Tooltip `formatter` prop signature is awkward to satisfy exactly (ValueType | undefined,
// plus extra name/item/index/payload args) - these wrappers accept anything and coerce before formatting.
const formatCurrencyTooltip = (value: unknown) => formatCurrency(Number(value));
const formatPercentTooltip = (value: unknown) => `${Number(value).toFixed(1)}%`;

const DataCharts: React.FC<DataChartsProps> = ({ revenueTrend, revenueByCluster, marginByAccount, utilizationTrend }) => {
  const marginByAccountPct = marginByAccount.map((row) => ({ name: row.name, margin: (row.margin ?? 0) * 100 }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Revenue &amp; Profit Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={formatCurrencyTooltip} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS[5]} fill={CHART_COLORS[5]} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Revenue by Cluster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByCluster} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {revenueByCluster.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatCurrencyTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Margin by Account (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginByAccountPct} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={formatPercentTooltip} />
                <Bar dataKey="margin" name="Margin %" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">Utilization Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilizationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={formatPercentTooltip} />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  name="Utilization %"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[3], strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataCharts;
