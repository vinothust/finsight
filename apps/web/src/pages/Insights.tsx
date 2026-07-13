import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { getInsight } from "../lib/api";

export function Insights() {
  const { role, scopeId } = useRole();
  const [narrative, setNarrative] = useState("");

  useEffect(() => {
    getInsight({ role, scopeId })
      .then((res) => setNarrative(res.narrative))
      .catch(() => setNarrative(""));
  }, [role, scopeId]);

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">AI Insights</h1>
      <p className="text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
        {narrative || "No insight available yet."}
      </p>
    </section>
  );
}
