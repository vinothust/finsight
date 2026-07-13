import { useState } from "react";
import { useRole } from "../context/RoleContext";
import { askQuestion, type NLQResult } from "../lib/api";

export function AskFinSight() {
  const { role, scopeId } = useRole();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<NLQResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      setResult(await askQuestion(question, { role, scopeId }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Ask FinSight</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which programs had the lowest margin last quarter?"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">{result.explanation}</p>
          <table className="w-full text-sm border border-slate-200">
            <thead>
              <tr>
                {result.rows[0] &&
                  Object.keys(result.rows[0]).map((col) => (
                    <th key={col} className="border-b border-slate-200 text-left px-2 py-1">
                      {col}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border-b border-slate-100 px-2 py-1">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
