import { useState, useRef } from 'react';
import { Download, Trash2, FileText, UploadCloud, X, Layers, ShieldCheck } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('merged');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]);
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const clearAll = () => setFiles([]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (!droppedFiles.length) {
      toast.error('Only PDF files are allowed');
      return;
    }
    addFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((total, file) => total + file.size, 0);

  const handleMerge = async () => {
    if (!files.length) {
      toast.error('Please select at least one PDF file');
      return;
    }
    setMerging(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await api.post('/pdf/merge', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const name = fileName.trim() || 'merged';
      link.setAttribute('download', `${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF merged successfully');
      setFiles([]);
    } catch (err: any) {
      toast.error('Merge failed');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border-b-2 border-warning bg-[#090909] px-6 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-warning/10" />
        <div className="relative flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
            <Layers className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-warning">PDF tools</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Merge PDF files</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Combine multiple documents into one clean PDF and name your finished file.
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className="relative overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">01 · Add documents</p>
              <h2 className="mt-1 text-lg font-semibold">Choose PDFs to combine</h2>
            </div>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-base-content/20 hover:border-primary/50 hover:bg-base-200/30'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-base-content/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-base-content/70">Drag & drop PDFs here</p>
                <p className="text-xs text-base-content/50 mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
                    <button onClick={clearAll} className="btn btn-ghost btn-xs text-error gap-1">
                      <X className="w-3.5 h-3.5" /> Clear all
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-base-200/50 rounded-lg px-3 py-2 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-base-content/50 shrink-0">{formatSize(file.size)}</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="btn btn-ghost btn-xs text-error">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File name input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">File name</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="merged"
                    className="input input-bordered flex-1"
                  />
                  <span className="text-sm text-base-content/50">.pdf</span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={handleMerge}
                disabled={merging || files.length === 0}
                className="btn btn-primary w-full gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {merging ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {merging ? 'Merging…' : `Merge & Download (${files.length})`}
              </button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="border-b border-base-content/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">02 · Output overview</p>
            <h2 className="mt-1 font-semibold">Your merge order</h2>
          </div>
          <div className="space-y-5 p-5">
            <div className="rounded-2xl bg-base-200/50 p-4 sm:p-6">
              <div className="mx-auto max-w-xs rounded-xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-base-content/10 pb-3">
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <FileText className="size-4 text-primary" /> {fileName.trim() || 'merged'}.pdf
                  </span>
                  <span className="badge badge-ghost badge-xs">PDF</span>
                </div>
                <div className="space-y-2">
                  {files.length > 0 ? files.slice(0, 4).map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-base-content/5 bg-base-200/40 p-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[11px]">{file.name}</span>
                      <span className="text-[10px] text-base-content/40">{formatSize(file.size)}</span>
                    </div>
                  )) : (
                    <>
                      <div className="h-10 rounded-lg border border-dashed border-base-content/15 bg-base-200/30" />
                      <div className="h-10 rounded-lg border border-dashed border-base-content/15 bg-base-200/30" />
                      <div className="h-10 rounded-lg border border-dashed border-base-content/15 bg-base-200/30" />
                    </>
                  )}
                  {files.length > 4 && (
                    <p className="pt-1 text-center text-[10px] text-base-content/45">and {files.length - 4} more files</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-base-content/10 pt-3 text-[10px] text-base-content/45">
                  <span>{files.length} {files.length === 1 ? 'document' : 'documents'}</span>
                  <span>{formatSize(totalSize)} total</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-success/15 bg-success/5 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <p className="text-xs leading-relaxed text-base-content/60">
                Review the file sequence and output name before starting the merge.
              </p>
            </div>
            <p className="text-center text-[11px] text-base-content/40">
              {files.length ? 'Files merge from top to bottom.' : 'Add PDFs to see the output order and file details.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
