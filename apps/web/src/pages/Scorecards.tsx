import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { getScorecards, type ScorecardEntry } from "../lib/api";

const RAG_COLORS: Record<ScorecardEntry["rag_status"], string> = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-800",
};

export function Scorecards() {
  const { role, scopeId } = useRole();
  const [entries, setEntries] = useState<ScorecardEntry[]>([]);

  useEffect(() => {
    getScorecards({ role, scopeId }).then(setEntries).catch(() => setEntries([]));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Program Health Scorecards</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div key={entry.program_id} className={`rounded-lg p-4 ${RAG_COLORS[entry.rag_status]}`}>
            <p className="font-medium">{entry.program_name}</p>
            <p className="text-sm">Margin: {(entry.margin * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
