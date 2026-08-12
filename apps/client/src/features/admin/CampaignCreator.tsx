import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  Save,
  UploadCloud,
  Image as ImageIcon,
  Type,
  Move,
  RefreshCw,
  Copy,
} from "lucide-react";

export default function CampaignCreator() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [flyerUrl, setFlyerUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoBox, setPhotoBox] = useState({
    x: 100, y: 100, width: 400, height: 400,
  });
  const [nameConfig, setNameConfig] = useState({
    x: 400, y: 700, fontSize: 64,
    fontFamily: "Montserrat", color: "#ffffff",
    align: "center" as CanvasTextAlign,
  });
  const [savedId, setSavedId] = useState<string | null>(id || null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing template when editing
  useEffect(() => {
    if (!id) return;
    api.get(`/campaign/template/${id}`)
      .then(res => {
        const tpl = res.data;
        setTitle(tpl.title);
        setFlyerUrl(tpl.flyerUrl);
        setPhotoBox(tpl.photoBox);
        setNameConfig(tpl.nameConfig);
        setSavedId(tpl.id);
      })
      .catch(() => toast.error("Template not found"));
  }, [id]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Dashed photo box
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(photoBox.x, photoBox.y, photoBox.width, photoBox.height);
      ctx.setLineDash([]);

      // Sample name text with shadow
      ctx.font = `700 ${nameConfig.fontSize}px "${nameConfig.fontFamily}", sans-serif`;
      ctx.fillStyle = nameConfig.color;
      ctx.textAlign = nameConfig.align;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.fillText("Your Name", nameConfig.x, nameConfig.y);
      ctx.shadowBlur = 0;
    };
    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "18px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Upload a flyer to preview", canvas.width / 2, canvas.height / 2);
    };
    img.src = flyerUrl || "";
  }, [flyerUrl, photoBox, nameConfig]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/campaign/upload-flyer", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFlyerUrl(res.data.url);
      toast.success("Flyer uploaded");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveTemplate = async () => {
    if (!title || !flyerUrl) {
      toast.error("Please provide a title and upload a flyer");
      return;
    }
    try {
      if (isEditing && savedId) {
        await api.put(`/campaign/template/${savedId}`, { title, flyerUrl, photoBox, nameConfig });
        toast.success("Template updated");
      } else {
        const res = await api.post("/campaign/template", { title, flyerUrl, photoBox, nameConfig });
        setSavedId(res.data.id);
        toast.success("Template saved");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const shareableLink = savedId ? `${window.location.origin}/campaign/${savedId}` : null;

  const copyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied!");
  };

  return (
    <div className="relative max-w-7xl w-full space-y-6">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Template" : "Campaign DP Template"}
        </h2>
        <p className="text-sm text-base-content/60 mt-1">
          Design a personalised flyer overlay with a photo placeholder and name
        </p>
      </div>

      {/* Shareable link alert */}
      {shareableLink && (
        <div className="alert alert-success flex items-center justify-between shadow-sm">
          <span className="text-sm truncate max-w-[60%]">{shareableLink}</span>
          <button onClick={copyLink} className="btn btn-sm btn-outline gap-1">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Flyer card */}
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" /> Flyer
            </h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Template Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Birthday Campaign 2025"
              />
            </div>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text font-medium">Flyer Image</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-base-200/50"
              >
                {uploading ? (
                  <span className="loading loading-spinner loading-md text-primary" />
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-base-content/40 mx-auto mb-1" />
                    <p className="text-sm text-base-content/60">Click to upload</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFlyerUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              {flyerUrl && (
                <p className="text-xs text-success mt-1">Flyer loaded</p>
              )}
            </div>
          </div>

          {/* Photo Box card */}
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Move className="w-5 h-5 text-primary" /> Photo Box
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {["x", "y", "width", "height"].map((prop) => (
                <div className="form-control" key={prop}>
                  <label className="label">
                    <span className="label-text text-xs">{prop.toUpperCase()}</span>
                  </label>
                  <input
                    type="range"
                    min={prop === "width" || prop === "height" ? 50 : 0}
                    max={800}
                    value={(photoBox as any)[prop]}
                    onChange={(e) => setPhotoBox({ ...photoBox, [prop]: +e.target.value })}
                    className="range range-primary range-sm"
                  />
                  <span className="text-xs text-base-content/50">
                    {(photoBox as any)[prop]}px
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Name Overlay card */}
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" /> Name Overlay
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">X</span></label>
                  <input type="range" min="0" max="800" value={nameConfig.x} onChange={(e) => setNameConfig({ ...nameConfig, x: +e.target.value })} className="range range-primary range-sm" />
                  <span className="text-xs text-base-content/50">{nameConfig.x}px</span>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Y</span></label>
                  <input type="range" min="0" max="800" value={nameConfig.y} onChange={(e) => setNameConfig({ ...nameConfig, y: +e.target.value })} className="range range-primary range-sm" />
                  <span className="text-xs text-base-content/50">{nameConfig.y}px</span>
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Font Size</span></label>
                <input type="range" min="12" max="120" value={nameConfig.fontSize} onChange={(e) => setNameConfig({ ...nameConfig, fontSize: +e.target.value })} className="range range-primary range-sm" />
                <span className="text-xs text-base-content/50">{nameConfig.fontSize}px</span>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Font Family</span></label>
                <select
                  value={nameConfig.fontFamily}
                  onChange={(e) => setNameConfig({ ...nameConfig, fontFamily: e.target.value })}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="Montserrat">Montserrat</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Cormorant Garamond">Cormorant Garamond</option>
                  <option value="Inter">Inter</option>
                </select>
              </div>
              <div className="flex gap-3 items-end">
                <div className="form-control flex-1">
                  <label className="label"><span className="label-text text-xs">Color</span></label>
                  <input
                    type="color"
                    value={nameConfig.color}
                    onChange={(e) => setNameConfig({ ...nameConfig, color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer border border-base-content/20"
                  />
                </div>
                <div className="form-control flex-1">
                  <label className="label"><span className="label-text text-xs">Align</span></label>
                  <select
                    value={nameConfig.align}
                    onChange={(e) => setNameConfig({ ...nameConfig, align: e.target.value as CanvasTextAlign })}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save / Update button */}
          <button
            onClick={saveTemplate}
            className="btn btn-primary w-full gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Save className="w-4 h-4" /> {isEditing ? "Update Template" : "Save Template"}
          </button>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" /> Preview
              </h3>
              <span className="text-xs text-base-content/50">800x800px</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-base-content/10 bg-base-200 flex justify-center">
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="max-w-full h-auto"
                style={{ imageRendering: "auto" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}