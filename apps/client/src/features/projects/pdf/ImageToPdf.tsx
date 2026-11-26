import { useState, useRef, useEffect } from 'react';
import { Download, Trash2, Image as ImageIcon, UploadCloud, X, Images, ArrowDown, ArrowUp } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('converted');
  const [imagePreviews, setImagePreviews] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImagePreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]);
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const clearAll = () => setFiles([]);
  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/')
    );
    if (!droppedFiles.length) {
      toast.error('Only image files are allowed');
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

  const handleConvert = async () => {
    if (!files.length) {
      toast.error('Please select at least one image');
      return;
    }
    setConverting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await api.post('/pdf/images-to-pdf', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const name = fileName.trim() || 'converted';
      link.setAttribute('download', `${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Images converted to PDF');
      setFiles([]);
    } catch (err: any) {
      toast.error('Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border-b-2 border-warning bg-[#090909] px-6 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-warning/10" />
        <div className="relative flex items-start justify-start gap-4 text-left">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
            <Images className="size-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-warning">PDF tools</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Turn images into a PDF</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Collect your images, check the page order, and export them as one document.
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className="relative overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-accent" />
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">01 · Add images</p>
              <h2 className="mt-1 text-lg font-semibold">Choose images to convert</h2>
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
                <p className="text-sm font-medium text-base-content/70">Drag & drop images here</p>
                <p className="text-xs text-base-content/50 mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {files.length} image{files.length > 1 ? 's' : ''} selected
                      <span className="ml-2 text-xs font-normal text-base-content/50">{formatSize(totalSize)} total</span>
                    </span>
                    <button onClick={clearAll} className="btn btn-ghost btn-xs text-error gap-1">
                      <X className="w-3.5 h-3.5" /> Clear all
                    </button>
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-base-200/50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary/10 text-[10px] font-bold text-secondary">{index + 1}</span>
                          <span className="truncate text-sm" title={file.name}>{file.name}</span>
                          <span className="shrink-0 text-xs text-base-content/50">{formatSize(file.size)}</span>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button
                            onClick={() => moveFile(index, -1)}
                            disabled={index === 0}
                            className="btn btn-ghost btn-xs btn-square"
                            aria-label={`Move ${file.name} earlier`}
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            onClick={() => moveFile(index, 1)}
                            disabled={index === files.length - 1}
                            className="btn btn-ghost btn-xs btn-square"
                            aria-label={`Move ${file.name} later`}
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button onClick={() => removeFile(index)} className="btn btn-ghost btn-xs btn-square text-error" aria-label={`Remove ${file.name}`}>
                            <Trash2 className="size-4" />
                          </button>
                        </div>
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
                    placeholder="converted"
                    className="input input-bordered flex-1"
                  />
                  <span className="text-sm text-base-content/50">.pdf</span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={handleConvert}
                disabled={converting || files.length === 0}
                className="btn btn-primary w-full gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {converting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {converting ? 'Converting…' : `Convert to PDF (${files.length})`}
              </button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="border-b border-base-content/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">02 · Page preview</p>
            <h2 className="mt-1 font-semibold">Your image pages</h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="max-h-90 overflow-y-auto rounded-2xl bg-base-200/50 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {imagePreviews.length ? imagePreviews.map(({ file, url }, index) => (
                  <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-base-content/10 bg-base-100 p-1.5 shadow-sm">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-base-200/60">
                      <img src={url} alt={`Page ${index + 1}: ${file.name}`} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between gap-1 px-0.5 pt-1.5">
                      <span className="truncate text-[10px] font-medium">{file.name}</span>
                      <span className="shrink-0 text-[9px] text-base-content/50">{index + 1}</span>
                    </div>
                  </div>
                )) : (
                  [1, 2].map((page) => (
                    <div key={page} className="rounded-lg border border-dashed border-base-content/15 bg-base-100 p-1.5">
                      <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-base-200/40 text-base-content/20">
                        <ImageIcon className="size-6" />
                      </div>
                      <div className="flex items-center justify-between px-0.5 pt-1.5">
                        <span className="text-[10px] text-base-content/40">Preview</span>
                        <span className="text-[9px] text-base-content/40">{page}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-between border-t border-base-content/5 pt-2 text-xs text-base-content/50">
              <span>{files.length} {files.length === 1 ? 'page' : 'pages'}</span>
              <span>{formatSize(totalSize)} total</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
