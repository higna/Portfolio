import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Download, User, Camera, Loader2 } from 'lucide-react';

const DESIGN_SIZE = 800;

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load a campaign image'));
    image.src = src;
  });
}

async function renderCampaignCanvas(
  canvas: HTMLCanvasElement,
  template: any,
  name: string,
  photoUrl: string | null,
  isCurrent: () => boolean,
): Promise<boolean> {
  const [flyer, photo] = await Promise.all([
    loadImage(template.flyerUrl, true),
    photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
  ]);
  if (!isCurrent()) return false;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the campaign preview');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / DESIGN_SIZE, canvas.height / DESIGN_SIZE);
  ctx.drawImage(flyer, 0, 0, DESIGN_SIZE, DESIGN_SIZE);

  const { x, y, width, height } = template.photoBox;
  if (photo) {
    const cropScale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const sourceWidth = width / cropScale;
    const sourceHeight = height / cropScale;
    const sourceX = (photo.naturalWidth - sourceWidth) / 2;
    const sourceY = (photo.naturalHeight - sourceHeight) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.drawImage(
      photo,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height,
    );
    ctx.restore();
  } else {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }

  const { fontSize, fontFamily, color, align, x: nameX, y: nameY } = template.nameConfig;
  ctx.font = `700 ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(name.trim() || 'Your Name', nameX, nameY);
  ctx.restore();
  return true;
}

export default function CampaignFill() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const renderVersionRef = useRef(0);

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
    const version = ++renderVersionRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    void renderCampaignCanvas(canvas, template, name, photoUrl, () => (
      version === renderVersionRef.current
    )).catch(() => {
      if (version !== renderVersionRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Preview could not be loaded', canvas.width / 2, canvas.height / 2);
    });
  }, [template, photoUrl, name]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setPhotoUrl(ev.target?.result as string);
    reader.onerror = () => toast.error('Could not read that photo');
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;
    setDownloading(true);
    const version = ++renderVersionRef.current;
    try {
      const rendered = await renderCampaignCanvas(
        canvas,
        template,
        name,
        photoUrl,
        () => version === renderVersionRef.current,
      );
      if (!rendered) throw new Error('The preview changed. Try downloading again.');
      const link = document.createElement('a');
      link.download = `${template.title.replace(/\s+/g, '-')}-campaign-dp.png`;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Could not create the campaign image'));
        }, 'image/png');
      });
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
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

      <div className="max-w-screen-2xl mx-auto space-y-8 relative z-10">
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
                disabled={downloading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Your Photo
                </span>
              </label>
              <div
                onClick={() => !downloading && photoInputRef.current?.click()}
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
                  disabled={downloading}
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
