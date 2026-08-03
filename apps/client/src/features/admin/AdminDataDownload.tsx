import { useState, useEffect, useMemo, useRef } from "react";
import {
  Download,
  Database,
  Search,
  X,
  ArrowUpDown,
  Settings2,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { createLogger } from "../../lib/logger";

const logger = createLogger("AdminDataDownload");

interface ONAForm {
  formid: number;
  id_string: string;
  title: string;
  description: string;
  num_of_submissions: number;
}

type SortField = "title" | "id_string" | "formid" | "num_of_submissions";

interface ExportOptions {
  fileType: string;
  removeGroupName: boolean;
  doNotSplitMultiSelects: boolean;
  includeImages: boolean;
  includeLabels: boolean;
  labelsOnly: boolean;
  includeReviews: boolean;
  binarySelectMultiples: boolean;
  valueSelectMultiples: boolean;
  showChoiceLabels: boolean;
  groupDelimiter: string;
  dateFrom: string;
  dateTo: string;
  version: string;
  zipFileName: string;
}

export default function AdminDataDownload() {
  const [forms, setForms] = useState<ONAForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    fileType: "xlsx",
    removeGroupName: false,
    doNotSplitMultiSelects: true,
    includeImages: false,
    includeLabels: false,
    labelsOnly: true,
    includeReviews: false,
    binarySelectMultiples: false,
    valueSelectMultiples: false,
    showChoiceLabels: false,
    groupDelimiter: "/",
    dateFrom: "",
    dateTo: "",
    version: "",
    zipFileName: "ona-data",
  });

  useEffect(() => {
    api
      .get("/ona/forms")
      .then((res) => {
        setForms(res.data);
        logger.log("ONA forms loaded for download");
      })
      .catch((err) => {
        toast.error("Failed to load ONA forms");
        logger.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showModal) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [showModal]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = forms;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (form) =>
          form.title.toLowerCase().includes(query) ||
          form.id_string.toLowerCase().includes(query),
      );
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === "num_of_submissions") {
        valA = valA || 0;
        valB = valB || 0;
      }
      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [forms, searchQuery, sortField, sortDir]);

  const toggleForm = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (
      selectedIds.length === filteredAndSorted.length &&
      filteredAndSorted.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSorted.map((f) => f.formid));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleDownloadWithOptions = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one form");
      return;
    }
    setDownloading(true);
    try {
      const payload = {
        formIds: selectedIds,
        options: exportOptions,
      };
      const response = await api.post("/ona/download", payload, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const disposition = response.headers["content-disposition"];
      let filename = "";

      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1].replace(/["']/g, ""));
        } else {
          const simple = disposition.match(/filename="?(.+?)"?$/);
          if (simple) filename = simple[1];
        }
      }

      if (!filename) {
        if (selectedIds.length === 1) {
          filename = "download";
        } else {
          filename = (exportOptions.zipFileName || "ona-data") + ".zip";
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
      setShowModal(false);
    } catch (err: any) {
      toast.error("Download failed");
      logger.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const SortHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      <span>{label}</span>
      {sortField === field ? (
        sortDir === "asc" ? (
          <ArrowUp className="w-3.5 h-3.5 text-primary" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 text-base-content/40" />
      )}
    </button>
  );

  const advancedOptions = [
    { label: "Remove prefixed group names", key: "removeGroupName" },
    {
      label: "Do not split select multiple answers",
      key: "doNotSplitMultiSelects",
    },
    { label: "Include links of images", key: "includeImages" },
    { label: "Include labels", key: "includeLabels" },
    { label: "Include labels only", key: "labelsOnly" },
    { label: "Include reviews", key: "includeReviews" },
    {
      label: "Use 1 or 0 in split select multiples",
      key: "binarySelectMultiples",
    },
    {
      label: "Use choice name in split select multiples",
      key: "valueSelectMultiples",
    },
    { label: "Export with Choice Labels", key: "showChoiceLabels" },
  ];

  const allSelected =
    filteredAndSorted.length > 0 &&
    selectedIds.length === filteredAndSorted.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < filteredAndSorted.length;

  return (
    <div className="relative max-w-6xl w-full space-y-6">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header + Search + Download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Download</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Select ONA forms to download as CSV
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Filter forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered rounded-lg w-full sm:w-56 pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={selectedIds.length === 0}
            className="btn btn-primary gap-2 shadow-sm hover:shadow-md transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            Download ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Selection info bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-base-100 border border-base-content/10 rounded-xl p-3 shadow-sm">
          <span className="text-sm text-base-content/70">
            {selectedIds.length} of {forms.length} forms selected
          </span>
          <button
            onClick={clearSelection}
            className="btn btn-ghost btn-xs text-error"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-10">
                    <div className="h-4 bg-base-300 rounded animate-pulse w-6 mx-auto" />
                  </th>
                  <th>
                    <div className="h-4 bg-base-300 rounded animate-pulse w-32" />
                  </th>
                  <th>
                    <div className="h-4 bg-base-300 rounded animate-pulse w-24" />
                  </th>
                  <th>
                    <div className="h-4 bg-base-300 rounded animate-pulse w-16" />
                  </th>
                  <th>
                    <div className="h-4 bg-base-300 rounded animate-pulse w-20" />
                  </th>
                  <th>
                    <div className="h-4 bg-base-300 rounded animate-pulse w-20" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-6 mx-auto" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-44 mb-1" />
                      <div className="h-3 bg-base-200 rounded animate-pulse w-36" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-24" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-12" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-16" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-200 rounded animate-pulse w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real table */}
      {!loading && (
        <div className="card bg-base-100 border border-base-content/10 shadow-sm p-0 overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200/50">
                    <th className="w-10">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>
                      <SortHeader field="title" label="Form Name" />
                    </th>
                    <th>
                      <SortHeader field="id_string" label="ID String" />
                    </th>
                    <th>
                      <SortHeader field="formid" label="Form ID" />
                    </th>
                    <th>
                      <SortHeader
                        field="num_of_submissions"
                        label="Submissions"
                      />
                    </th>
                    <th className="w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3 text-base-content/40">
                          <Database className="w-10 h-10" />
                          <p className="text-sm">
                            {searchQuery
                              ? "No forms match your filter."
                              : "No forms available."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSorted.map((form, index) => (
                      <tr
                        key={form.formid}
                        className={`hover:bg-base-200/50 cursor-pointer transition-colors animate-fade-in ${
                          selectedIds.includes(form.formid)
                            ? "bg-primary/5"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => toggleForm(form.formid)}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={selectedIds.includes(form.formid)}
                            onChange={() => toggleForm(form.formid)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="font-medium text-sm truncate max-w-50 sm:max-w-75">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-xs text-base-content/50 truncate max-w-50 sm:max-w-75 mt-0.5">
                              {form.description}
                            </div>
                          )}
                        </td>
                        <td className="text-sm font-mono truncate max-w-25 sm:max-w-37.5">
                          {form.id_string}
                        </td>
                        <td className="text-sm">{form.formid}</td>
                        <td className="text-sm">
                          <span className="badge badge-outline badge-sm">
                            {formatNumber(form.num_of_submissions)}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const token = localStorage.getItem("token");
                              if (!token) {
                                toast.error("Please log in first");
                                return;
                              }
                              try {
                                const res = await fetch(
                                  `${import.meta.env.VITE_API_URL || "http://localhost:2500"}/ona/template/${form.formid}`,
                                  { headers: { Authorization: `Bearer ${token}` } },
                                );
                                if (!res.ok) throw new Error("Download failed");
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `template_${form.formid}.xlsx`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                              } catch {
                                toast.error("Failed to download template");
                              }
                            }}
                            className="btn btn-ghost btn-xs btn-square hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Download empty template"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-base-content/50 flex items-center gap-1">
        <Download className="w-3.5 h-3.5" />
        Selected forms will be downloaded with the configured export options.
      </div>

      {/* Export Options Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-lg p-6 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> Export Options
            </h3>
            <form method="dialog">
              <button className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">File type</span>
              </label>
              <select
                value={exportOptions.fileType}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    fileType: e.target.value,
                  })
                }
                className="select select-bordered w-full"
              >
                <option value="windows-compatible-csv">
                  CSV (Windows Compatible)
                </option>
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="csvzip">CSV Zip</option>
                <option value="json">JSON</option>
                <option value="savzip">SAV</option>
                <option value="kml">KML</option>
                <option value="zip">Zip folder of media attachments</option>
              </select>
            </div>

            {selectedIds.length > 1 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">ZIP file name</span>
                </label>
                <input
                  type="text"
                  placeholder="ona-data"
                  value={exportOptions.zipFileName}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      zipFileName: e.target.value,
                    })
                  }
                  className="input input-bordered ml-5"
                />
              </div>
            )}

            <details className="collapse collapse-arrow bg-base-200 rounded-lg">
              <summary className="collapse-title font-medium">
                Advanced Options
              </summary>
              <div className="collapse-content space-y-2">
                {advancedOptions.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={(exportOptions as any)[opt.key]}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          [opt.key]: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </details>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Group delimiter</span>
              </label>
              <select
                value={exportOptions.groupDelimiter}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    groupDelimiter: e.target.value,
                  })
                }
                className="select select-bordered w-full"
              >
                <option value="/">/ (Slash)</option>
                <option value=".">. (Dot)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">From</span>
                </label>
                <input
                  type="date"
                  value={exportOptions.dateFrom}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      dateFrom: e.target.value,
                    })
                  }
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">To</span>
                </label>
                <input
                  type="date"
                  value={exportOptions.dateTo}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      dateTo: e.target.value,
                    })
                  }
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Form version</span>
              </label>
              <input
                type="text"
                placeholder="Leave empty for all data"
                value={exportOptions.version}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    version: e.target.value,
                  })
                }
                className="input input-bordered ml-5"
              />
            </div>
          </div>

          <div className="modal-action mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadWithOptions}
              disabled={downloading}
              className="btn btn-primary gap-2"
            >
              {downloading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading
                ? "Preparing..."
                : `Download (${selectedIds.length})`}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowModal(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}