import { useState, useRef } from 'react';
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
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <ScanLine className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode / QR Interpreter</h1>
          <p className="text-sm text-base-content/60 mt-2">
            Upload or scan a barcode or QR code to decode its content
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
          <div className="p-6 space-y-5">
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

            {preview && (
              <div className="relative flex justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain border border-base-content/10"
                />
                <button
                  onClick={clearImage}
                  className="btn btn-ghost btn-xs btn-circle absolute -top-2 -right-2 bg-base-100 shadow-md"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

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

            {decoded && (
              <div className="bg-base-200/60 rounded-xl p-4 mt-4 border border-base-content/10">
                <p className="text-sm font-medium mb-2">Decoded content</p>
                <div className="flex items-start gap-3">
                  <p className="text-base-content/80 flex-1 break-all font-mono text-sm">
                    {decoded}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="btn btn-ghost btn-xs gap-1 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}