import { useState, useRef } from 'react';
import { Download, Trash2, Image, UploadCloud, X, ImagePlus } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('converted');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-base-100 to-base-200">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <ImagePlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Image to PDF</h1>
          <p className="text-sm text-base-content/60 mt-2">
            Convert one or more images into a single PDF file
          </p>
        </div>

        {/* Main card */}
        <div className="card bg-base-100 border border-base-content/10 shadow-xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
          <div className="p-6 space-y-5">
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

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{files.length} image{files.length > 1 ? 's' : ''} selected</span>
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
                        <Image className="w-4 h-4 text-primary shrink-0" />
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
        </div>
      </div>
    </div>
  );
}