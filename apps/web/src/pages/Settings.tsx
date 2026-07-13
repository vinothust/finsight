import { useEffect, useState } from "react";
import { getLLMSettings, updateLLMSettings, type LLMSettings } from "../lib/api";

const EMPTY: LLMSettings = {
  gcp_project: "",
  gcp_location: "",
  model_simple: "",
  model_complex: "",
  model_fallback: "",
};

export function Settings() {
  const [form, setForm] = useState<LLMSettings>(EMPTY);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLLMSettings()
      .then(setForm)
      .catch((err) => setStatus(`Failed to load settings: ${(err as Error).message}`));
  }, []);

  const field = (key: keyof LLMSettings) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const handleSave = async () => {
    setSaving(true);
    setStatus("");
    try {
      const saved = await updateLLMSettings(form);
      setForm(saved);
      setStatus("Saved.");
    } catch (err) {
      setStatus(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-4">LLM Settings</h1>
      <p className="text-sm text-slate-600 mb-4">
        FinSight uses Google Vertex AI (Gemini), authenticated via your local gcloud Application Default
        Credentials — no API key needed here. Simple operations (narration, guardrailing) use the
        "simple" model; complex operations (query generation) use the "complex" model, falling back to
        the fallback model if the primary call fails.
      </p>
      <div className="space-y-3">
        <label className="block text-sm">
          GCP Project
          <input {...field("gcp_project")} placeholder="my-gcp-project" className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-sm" />
        </label>
        <label className="block text-sm">
          GCP Location
          <input {...field("gcp_location")} placeholder="us-central1" className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-sm" />
        </label>
        <label className="block text-sm">
          Simple-tier model
          <input {...field("model_simple")} placeholder="gemini-2.5-flash-lite" className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-sm" />
        </label>
        <label className="block text-sm">
          Complex-tier model
          <input {...field("model_complex")} placeholder="gemini-2.5-flash" className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-sm" />
        </label>
        <label className="block text-sm">
          Fallback model
          <input {...field("model_fallback")} placeholder="gemini-2.5-pro" className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-sm" />
        </label>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
    </section>
  );
}
