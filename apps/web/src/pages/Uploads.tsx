import { useRef, useState } from "react";
import { uploadDataset } from "../lib/api";

export function Uploads() {
  const [dataset, setDataset] = useState<"financial" | "utilization">("financial");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setStatus("Uploading...");
    try {
      const res = await uploadDataset(dataset, file);
      setStatus(`Created ${res.created_rows} rows, ${res.errors.length} errors`);
    } catch (err) {
      setStatus(`Upload failed: ${(err as Error).message}`);
    }
  };

  return (
    <section className="p-6">
      <h1 className="text-xl font-semibold mb-4">Upload Data</h1>
      <div className="flex gap-2 items-center mb-4">
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value as "financial" | "utilization")}
          className="border border-slate-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="financial">Financial</option>
          <option value="utilization">Utilization</option>
        </select>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="text-sm" />
        <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
          Upload
        </button>
      </div>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </section>
  );
}
