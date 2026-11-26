import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Copy,
  Check,
  ScanLine,
  Camera,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function BarcodeInterpreter() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setDecoded('');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setDecoded('');
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview(null);
    setDecoded('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleInterpret = async () => {
    if (!imageFile) {
      toast.error('Please select or capture an image');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await api.post('/interpreter/interpret', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDecoded(res.data.data);
      toast.success('Code decoded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decode');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!decoded) return;
    try {
      await navigator.clipboard.writeText(decoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border-b-2 border-warning bg-[#090909] px-6 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-warning/10" />
        <div className="relative flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
            <ScanLine className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-warning">Barcode tools</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Scan a QR code or barcode</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Upload an image or use your camera, then review and copy the decoded content.
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section className="relative overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">01 · Choose an image</p>
              <h2 className="mt-1 text-lg font-semibold">Upload or capture a code</h2>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline gap-2"
              >
                <Upload className="w-4 h-4" /> Upload Image
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-outline gap-2"
              >
                <Camera className="w-4 h-4" /> Scan with Camera
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-base-content/20 hover:border-primary/50 hover:bg-base-200/30'
              }`}
            >
              <ImageIcon className="w-8 h-8 text-base-content/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-base-content/70">
                Drag & drop an image here
              </p>
              <p className="text-xs text-base-content/50 mt-1">
                or use the buttons above
              </p>
            </div>

            <button
              onClick={handleInterpret}
              disabled={loading || !imageFile}
              className="btn btn-primary w-full gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ScanLine className="w-5 h-5" />
              )}
              {loading ? 'Decoding…' : 'Interpret Code'}
            </button>
          </div>
        </section>

        <aside className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="border-b border-base-content/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-base-content/45">02 · Scan preview</p>
            <h2 className="mt-1 font-semibold">Image and decoded result</h2>
          </div>
          <div className="space-y-4 p-5">
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/40 p-4">
              {preview ? (
                <>
                  <img src={preview} alt="Selected code preview" className="max-h-80 max-w-full rounded-xl object-contain shadow-sm" />
                  <button
                    onClick={clearImage}
                    className="btn btn-ghost btn-xs btn-circle absolute right-3 top-3 bg-base-100 shadow-md"
                    aria-label="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-base-100 text-base-content/25 shadow-sm">
                    <ImageIcon className="size-7" />
                  </div>
                  <p className="text-sm font-medium text-base-content/55">Your image preview appears here</p>
                  <p className="mt-1 text-xs text-base-content/40">Choose a clear, well-lit code image</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-base-content/45">Decoded content</p>
                {decoded && (
                  <button onClick={handleCopy} className="btn btn-ghost btn-xs gap-1">
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              {decoded ? (
                <p className="max-h-32 overflow-y-auto break-all font-mono text-sm text-base-content/80">{decoded}</p>
              ) : (
                <p className="text-sm text-base-content/40">The scan result will appear here.</p>
              )}
            </div>

            <p className="text-center text-[11px] text-base-content/40">
              Supported image formats depend on your browser and camera.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
