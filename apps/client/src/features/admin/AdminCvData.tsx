import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileJson2, RefreshCw, Save, Upload } from "lucide-react";
import axios from "axios";
import api from "../../lib/api";
import toast from "react-hot-toast";

const MAX_CV_JSON_BYTES = 1_000_000;

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function AdminCvData() {
  const [jsonText, setJsonText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasChanges = jsonText !== savedText;

  const loadCvData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/portfolio/cv-data");
      const formatted = formatJson(response.data);
      setJsonText(formatted);
      setSavedText(formatted);
    } catch {
      setError("Could not load CV data. Check your connection and try again.");
      toast.error("Failed to load CV data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCvData();
  }, [loadCvData]);

  const handleReload = () => {
    if (
      hasChanges &&
      !window.confirm("Discard your unsaved edits and reload the saved CV data?")
    ) {
      return;
    }
    void loadCvData();
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_CV_JSON_BYTES) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.error("Choose a JSON file smaller than 1 MB");
      return;
    }
    if (
      hasChanges &&
      !window.confirm("Replace your unsaved edits with the selected JSON file?")
    ) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonText(formatJson(parsed));
      setError("");
      toast.success("JSON loaded. Review it, then save to apply the changes.");
    } catch {
      setError("The selected file is not valid JSON.");
      toast.error("Could not read valid JSON from that file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    if (new Blob([jsonText]).size > MAX_CV_JSON_BYTES) {
      setError("CV JSON must be smaller than 1 MB.");
      toast.error("CV JSON is too large to save");
      return;
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      setError("Fix the JSON syntax errors before saving.");
      toast.error("The editor contains invalid JSON");
      return;
    }

    if (
      !window.confirm(
        "Save this complete CV document? Its profile, experience, education, skills, projects, and certifications will replace the current records.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await api.put("/portfolio/cv-data", parsedData);
      const formatted = formatJson(response.data);
      setJsonText(formatted);
      setSavedText(formatted);
      toast.success("CV data saved");
    } catch (saveError: unknown) {
      const message = axios.isAxiosError<{ message?: string | string[] }>(
        saveError,
      )
        ? saveError.response?.data?.message
        : undefined;
      setError(
        Array.isArray(message)
          ? message.join("\n")
          : message || "Could not save CV data. Review the document and try again.",
      );
      toast.error("Failed to save CV data");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const blob = new Blob([`${formatJson(parsed)}\n`], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cv-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Fix the JSON syntax errors before exporting.");
      toast.error("The editor contains invalid JSON");
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <section className="rounded-2xl border border-info/20 bg-info/5 p-4 text-sm leading-relaxed text-base-content/75 sm:p-5">
        <p className="font-semibold text-base-content">Database-backed CV data</p>
        <p className="mt-1">
          Edit or import the JSON here, then save it to update the portfolio
          records used by the app. Saving replaces all CV sections together.
          Export downloads the current editor contents as a JSON file.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-base-300/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileJson2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">CV data document</h2>
              <p className="text-xs text-base-content/50">
                JSON · UTF-8 · Maximum import size 1 MB
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              aria-label="Import CV JSON file"
              onChange={(event) => void handleImport(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || saving}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Upload className="size-4" />
              Import JSON
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !jsonText}
              className="btn btn-ghost btn-sm gap-2"
            >
              <Download className="size-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleReload}
              disabled={loading || saving}
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Reload CV data"
              title="Reload CV data"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-4 mt-4 whitespace-pre-wrap rounded-xl border border-error/20 bg-error/5 p-3 text-sm text-error sm:mx-5"
          >
            {error}
          </div>
        )}

        <div className="p-4 sm:p-5">
          <label htmlFor="cv-json-editor" className="sr-only">
            CV JSON data
          </label>
          <textarea
            id="cv-json-editor"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setError("");
            }}
            disabled={loading || saving}
            spellCheck={false}
            className="textarea textarea-bordered min-h-[55vh] w-full resize-y rounded-xl border-base-300 bg-base-200/40 p-4 font-mono text-xs leading-6 text-base-content focus:border-primary focus:outline-none sm:text-sm"
            placeholder={loading ? "Loading CV data..." : '{\n  "profile": {}\n}'}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-base-content/50">
              {hasChanges
                ? "Unsaved changes"
                : "All changes are saved"}
            </p>
            <div className="flex justify-end gap-2">
              {hasChanges && (
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(savedText);
                    setError("");
                  }}
                  disabled={saving}
                  className="btn btn-ghost btn-sm"
                >
                  Discard edits
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading || saving || !hasChanges}
                className="btn btn-primary btn-sm gap-2"
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save CV data"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
