import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRole } from "../context/RoleContext";
import { getRevenueMargin, type RevenueMarginPoint } from "../lib/api";

export function Dashboard() {
  const { role, scopeId } = useRole();
  const [data, setData] = useState<RevenueMarginPoint[]>([]);

  useEffect(() => {
    getRevenueMargin({ role, scopeId }).then(setData).catch(() => setData([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Revenue & Margin</h1>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
          <Line type="monotone" dataKey="margin" stroke="#16a34a" name="Margin" />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
