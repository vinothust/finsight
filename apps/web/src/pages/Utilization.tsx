import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRole } from "../context/RoleContext";
import { getUtilization, type UtilizationPoint } from "../lib/api";

export function Utilization() {
  const { role, scopeId } = useRole();
  const [data, setData] = useState<UtilizationPoint[]>([]);

  useEffect(() => {
    getUtilization({ role, scopeId }).then(setData).catch(() => setData([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Utilization & Bench</h1>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avg_allocation_pct" fill="#2563eb" name="Avg Allocation %" />
          <Bar dataKey="bench_pct" fill="#f59e0b" name="Bench %" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
