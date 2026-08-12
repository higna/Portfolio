import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Download, User, Camera, Loader2 } from 'lucide-react';

export default function CampaignFill() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/campaign/template/${id}`)
      .then(res => {
        setTemplate(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Template not found');
        setLoading(false);
      });
  }, [id]);

  // Live preview – redraw canvas whenever name/photo/template changes
  useEffect(() => {
    if (!template) return;
    drawPreview();
  }, [template, photoUrl, name]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flyer = new Image();
    flyer.crossOrigin = 'anonymous';
    flyer.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(flyer, 0, 0, canvas.width, canvas.height);

      if (photoUrl) {
        const photo = new Image();
        photo.onload = () => {
          // Draw the photo inside the photo box (cover fill)
          const { x, y, width, height } = template.photoBox;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.clip();
          ctx.drawImage(photo, x, y, width, height);
          ctx.restore();

          drawNameText(ctx);
        };
        photo.src = photoUrl;
      } else {
        // Draw placeholder for photo box
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(
          template.photoBox.x,
          template.photoBox.y,
          template.photoBox.width,
          template.photoBox.height
        );
        ctx.setLineDash([]);
        drawNameText(ctx);
      }
    };
    flyer.src = template.flyerUrl;
  };

  const drawNameText = (ctx: CanvasRenderingContext2D) => {
    const { fontSize, fontFamily, color, align, x, y } = template.nameConfig;
    ctx.font = `700 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align as CanvasTextAlign;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(name.trim() || 'Your Name', x, y);
    ctx.shadowBlur = 0;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    // Small delay to ensure canvas is fully rendered
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `${template.title.replace(/\s+/g, '-')}-campaign-dp.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
      toast.success('Image downloaded!');
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <p className="text-base-content/60">Template not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-10 px-4 relative">
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-base-content">
            {template.title}
          </h1>
          <p className="text-base-content/60 mt-2">
            Upload your photo and name to create a personalised campaign display picture
          </p>
        </div>

        {/* Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6 space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Your Name
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Your Photo
                </span>
              </label>
              <div
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  photoUrl
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-base-content/20 hover:border-primary/50 hover:bg-base-200/30'
                }`}
              >
                {photoUrl ? (
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={photoUrl}
                      alt="Uploaded"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-sm text-base-content/70">Change photo</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-base-content/40 mx-auto mb-1" />
                    <p className="text-sm text-base-content/60">Upload a clear portrait</p>
                  </>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary w-full gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloading ? 'Preparing...' : 'Download Campaign DP'}
            </button>
          </div>

          {/* Right: Live Preview */}
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4">
            <div className="rounded-xl overflow-hidden border border-base-content/10 bg-base-200 flex justify-center">
              <canvas
                ref={canvasRef}
                width={1080}
                height={1080}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}