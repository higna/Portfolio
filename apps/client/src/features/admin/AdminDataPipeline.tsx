import { useState } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Download,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";
import pipelines from "./pipelineConfig.json";

type StepStatus = "idle" | "running" | "done" | "failed";

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <CheckCircle className="w-5 h-5 text-success" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-error" />;
  if (status === "running")
    return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  return (
    <div className="w-5 h-5 rounded-full border-2 border-base-content/30" />
  );
}

export default function AdminPipeline() {
  const [running, setRunning] = useState<string | null>(null);
  const [generateCharts, setGenerateCharts] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadClicked, setDownloadClicked] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pipelineStates, setPipelineStates] = useState<
    Record<
      string,
      {
        steps: Record<string, StepStatus>;
        message: string;
      }
    >
  >({});

  const runPipeline = async (pipeline: (typeof pipelines)[0]) => {
    setRunning(pipeline.key);
    setDownloadUrl(null);
    setDownloadClicked(false);

    setPipelineStates((prev) => ({
      ...prev,
      [pipeline.key]: {
        steps: { download: "idle", clean: "idle", upload: "idle" },
        message: "Starting pipeline…",
      },
    }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:2500"}/pipeline/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            scriptName: pipeline.scriptName,
            formId: pipeline.formId,
            sheetName: pipeline.sheetName,
            spreadsheetKey: pipeline.spreadsheetKey,
            generateCharts: pipeline.hasChartOption ? generateCharts : false,
          }),
        },
      );

      if (!res.ok) throw new Error("Pipeline request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const step = JSON.parse(line);
            updatePipelineState(pipeline.key, step);
            if (step.step === "error") {
              toast.error(step.message || "Pipeline failed");
            }
          } catch (e) {}
        }
      }

      if (pipeline.key === "cocoaEval" && generateCharts) {
        setDownloadUrl(
          `${import.meta.env.VITE_API_URL || "http://localhost:2500"}/pipeline/download-cocoa-eval`,
        );
      }

      toast.success(`${pipeline.label} completed`);
    } catch (err: any) {
      toast.error(err.message || "Pipeline failed");
      setPipelineStates((prev) => ({
        ...prev,
        [pipeline.key]: {
          steps: { download: "failed", clean: "failed", upload: "failed" },
          message: "Pipeline failed – see error above",
        },
      }));
    } finally {
      setRunning(null);
    }
  };

  const updatePipelineState = (
    key: string,
    step: { step: string; status: string; message?: string },
  ) => {
    setPipelineStates((prev) => {
      const current = prev[key] || {
        steps: { download: "idle", clean: "idle", upload: "idle" },
        message: "",
      };
      const newSteps = { ...current.steps };
      let message = current.message;

      if (step.step === "download") {
        newSteps.download =
          step.status === "complete"
            ? "done"
            : step.status === "running"
              ? "running"
              : "failed";
        message = "Downloading submissions…";
      } else if (
        step.step === "clean" ||
        step.step === "process" ||
        step.step === "charts"
      ) {
        newSteps.clean =
          step.status === "complete"
            ? "done"
            : step.status === "running"
              ? "running"
              : "failed";
        if (step.step === "charts") message = "Generating charts…";
        else message = "Cleaning & transforming data…";
      } else if (step.step === "upload") {
        newSteps.upload =
          step.status === "complete"
            ? "done"
            : step.status === "running"
              ? "running"
              : "failed";
        message = "Uploading to Google Sheets…";
      }

      if (step.message) message = step.message;

      return {
        ...prev,
        [key]: { steps: newSteps, message },
      };
    });
  };

  const handleCopyLink = () => {
    if (!downloadUrl) return;
    navigator.clipboard
      .writeText(downloadUrl)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  const getCurrentState = (key: string) =>
    pipelineStates[key] || {
      steps: { download: "idle", clean: "idle", upload: "idle" },
      message: "",
    };

  return (
    <div className="relative max-w-6xl w-full space-y-8">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Pipeline</h2>
        <p className="text-sm text-base-content/60 mt-1">
          Run ETL pipelines for your ONA forms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pipelines.map((p) => {
          const state = getCurrentState(p.key);
          const isRunning = running === p.key;
          const allDone =
            state.steps.download === "done" &&
            state.steps.clean === "done" &&
            state.steps.upload === "done";

          return (
            <div
              key={p.key}
              className="group card bg-base-100 border border-base-content/10 shadow-sm hover:shadow-md transition-all duration-300 p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />

              <div className="mb-5">
                <h3 className="text-lg font-bold">{p.label}</h3>
                <p className="text-sm text-base-content/60 mt-1">
                  {p.description}
                </p>
              </div>

              {(isRunning || allDone) && (
                <div className="mb-5 bg-base-200/50 rounded-lg px-4 py-2.5 border border-base-content/10">
                  <p className="text-sm font-medium text-base-content/80">
                    {state.message}
                  </p>
                  {allDone && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> All steps
                      completed
                    </p>
                  )}
                  {!allDone && isRunning && (
                    <div className="w-full bg-base-300 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full animate-progress-indeterminate"
                        style={{ width: "40%" }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <StepIcon
                    status={isRunning ? state.steps.download : "idle"}
                  />
                  <span className="text-xs text-base-content/50 mt-1">
                    Download
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30" />
                <div className="flex flex-col items-center">
                  <StepIcon status={isRunning ? state.steps.clean : "idle"} />
                  <span className="text-xs text-base-content/50 mt-1">
                    Clean
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30" />
                <div className="flex flex-col items-center">
                  <StepIcon status={isRunning ? state.steps.upload : "idle"} />
                  <span className="text-xs text-base-content/50 mt-1">
                    Upload
                  </span>
                </div>
              </div>

              {p.hasChartOption && (
                <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    checked={generateCharts}
                    onChange={(e) => setGenerateCharts(e.target.checked)}
                  />
                  <span className="text-sm font-medium">Generate charts</span>
                </label>
              )}

              <button
                onClick={() => runPipeline(p)}
                disabled={running !== null}
                className="btn btn-primary w-full gap-2 shadow-sm hover:shadow-md transition-all"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isRunning ? "Running…" : "Run Pipeline"}
              </button>

              {downloadUrl && p.key === "cocoaEval" && !downloadClicked && (
                <div className="flex flex-col gap-2 mt-3 animate-fade-in">
                  <a
                    href={downloadUrl}
                    download
                    onClick={() => setDownloadClicked(true)}
                    className="btn btn-outline btn-sm w-full gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Charts & Data
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-ghost btn-sm w-full gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy shareable link"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pipelines.length === 0 && (
        <div className="text-center py-12 text-base-content/40">
          No pipelines configured yet.
        </div>
      )}
    </div>
  );
}
