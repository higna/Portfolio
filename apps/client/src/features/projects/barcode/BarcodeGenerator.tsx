import { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  QrCode,
  Barcode,
  Save,
  FolderOpen,
  Trash2,
  List,
  Hash,
  Eye,
  Loader2,
} from 'lucide-react';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import jsPDF from 'jspdf';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function BarcodeGenerator() {
  const { user } = useAuth();

  // General mode: single or batch
  const [generationMode, setGenerationMode] = useState<'single' | 'batch'>('single');

  // Single mode state
  const [singleType, setSingleType] = useState<'qr' | 'barcode'>('qr');
  const [singleBarcodeFormat, setSingleBarcodeFormat] = useState('code128');
  const [singleText, setSingleText] = useState('');
  const [singlePreview, setSinglePreview] = useState<string | null>(null);

  // Batch mode state
  const [batchType, setBatchType] = useState<'qr' | 'barcode'>('qr');
  const [batchBarcodeFormat, setBatchBarcodeFormat] = useState('code128');

  // Batch approach selector
  const [batchMode, setBatchMode] = useState<'sequential' | 'list'>('sequential');

  // Sequential state
  const [structure, setStructure] = useState('ITEM-{number}');
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(10);
  const [padLength, setPadLength] = useState(3);

  // Custom list state
  const [customListText, setCustomListText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Printer / layout settings
  const [printerType, setPrinterType] = useState('A4');
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(3);
  const [codeSize, setCodeSize] = useState(30);
  const [margin, setMargin] = useState(10);

  // Batch preview state
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [batchPreviewImages, setBatchPreviewImages] = useState<{ value: string; dataUrl: string }[]>([]);
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  // Saved settings
  const [savedSettings, setSavedSettings] = useState<any[]>([]);
  const [settingsName, setSettingsName] = useState('');

  const loadSavedSettings = async () => {
    if (!user) return;
    try {
      const res = await api.get('/generator-settings');
      setSavedSettings(res.data);
    } catch {
      toast.error('Failed to load saved settings');
    }
  };

  useEffect(() => {
    loadSavedSettings();
  }, [user]);

  // Single code preview effect
  useEffect(() => {
    if (generationMode !== 'single' || !singleText.trim()) {
      setSinglePreview(null);
      return;
    }
    const generate = async () => {
      try {
        if (singleType === 'qr') {
          const url = await QRCode.toDataURL(singleText, { width: 400, margin: 2 });
          setSinglePreview(url);
        } else {
          const canvas = document.createElement('canvas');
          bwipjs.toCanvas(canvas, {
            bcid: singleBarcodeFormat,
            text: singleText,
            scale: 3,
            height: 20,
            includetext: true,
          });
          setSinglePreview(canvas.toDataURL('image/png'));
        }
      } catch {
        setSinglePreview(null);
      }
    };
    generate();
  }, [generationMode, singleType, singleBarcodeFormat, singleText]);

  // Generate code image (data URL) for batch items
  const generateCodeImage = async (value: string): Promise<string> => {
    if (batchType === 'qr') {
      return QRCode.toDataURL(value, { width: 200, margin: 1 });
    } else {
      const canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid: batchBarcodeFormat,
        text: value,
        scale: 2,
        height: 15,
        includetext: true,
      });
      return canvas.toDataURL('image/png');
    }
  };

  // Parse CSV file to list of strings
  const parseCsvFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        resolve(lines);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Build list of values for batch generation
  const getBatchValues = async (): Promise<string[]> => {
    if (batchMode === 'sequential') {
      const currentYear = new Date().getFullYear();
      const values: string[] = [];
      for (let num = startNum; num <= endNum; num++) {
        const value = structure
          .replace('{number}', String(num).padStart(padLength, '0'))
          .replace('{year}', String(currentYear));
        values.push(value);
      }
      return values;
    } else {
      const values: string[] = [];
      if (customListText.trim()) {
        const lines = customListText.split(/\r?\n/).filter(line => line.trim() !== '');
        values.push(...lines);
      }
      if (csvFile) {
        try {
          const csvValues = await parseCsvFile(csvFile);
          values.push(...csvValues);
        } catch {
          toast.error('Failed to read CSV file');
        }
      }
      return values;
    }
  };

  const handleBatchPreview = async () => {
    if (batchMode === 'sequential' && endNum < startNum) {
      toast.error('End number must be greater than start number');
      return;
    }
    const values = await getBatchValues();
    if (values.length === 0) {
      toast.error('No values to generate');
      return;
    }
    setGeneratingPreview(true);
    try {
      const generated: { value: string; dataUrl: string }[] = [];
      for (const value of values) {
        const dataUrl = await generateCodeImage(value);
        generated.push({ value, dataUrl });
      }
      setBatchPreviewImages(generated);
      setShowBatchPreview(true);
    } catch {
      toast.error('Failed to generate preview');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (batchMode === 'sequential' && endNum < startNum) {
      toast.error('End number must be greater than start number');
      return;
    }

    const values = await getBatchValues();
    if (values.length === 0) {
      toast.error('No values to generate');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const cellWidth = (pageWidth - margin * 2) / cols;
    const cellHeight = (pageHeight - margin * 2) / rows;

    let x = margin;
    let y = margin;

    for (const value of values) {
      try {
        const imgData = await generateCodeImage(value);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgData;
        });

        const ratio = img.height / img.width;
        let drawW = codeSize;
        let drawH = codeSize * ratio;
        if (drawH > codeSize) {
          drawH = codeSize;
          drawW = codeSize / ratio;
        }
        const cx = x + (cellWidth - drawW) / 2;
        const cy = y + (cellHeight - drawH) / 2;
        doc.addImage(imgData, 'PNG', cx, cy, drawW, drawH);

        doc.setFontSize(8);
        doc.text(value, x + cellWidth / 2, y + cellHeight - 2, { align: 'center' });
      } catch (err) {
        console.error('Failed to generate code for', value, err);
      }

      x += cellWidth;
      if (x >= pageWidth - margin) {
        x = margin;
        y += cellHeight;
        if (y >= pageHeight - margin) {
          doc.addPage();
          x = margin;
          y = margin;
        }
      }
    }

    doc.save(`batch-codes-${Date.now()}.pdf`);
  };

  const handleBatchPrint = async () => {
    await handleBatchGenerate();
  };

  const saveSettings = async () => {
    if (!user) {
      toast.error('Login to save settings');
      return;
    }
    if (!settingsName.trim()) {
      toast.error('Enter a settings name');
      return;
    }

    const settings = {
      batchType,
      batchBarcodeFormat,
      batchMode,
      structure,
      startNum,
      endNum,
      padLength,
      printerType,
      rows,
      cols,
      codeSize,
      margin,
    };

    try {
      await api.post('/generator-settings', { name: settingsName, settings });
      toast.success('Settings saved');
      setSettingsName('');
      loadSavedSettings();
    } catch {
      toast.error('Save failed');
    }
  };

  const loadSettings = (settings: any) => {
    setBatchType(settings.batchType || 'qr');
    setBatchBarcodeFormat(settings.batchBarcodeFormat || 'code128');
    setBatchMode(settings.batchMode || 'sequential');
    setStructure(settings.structure || 'ITEM-{number}');
    setStartNum(settings.startNum || 1);
    setEndNum(settings.endNum || 10);
    setPadLength(settings.padLength || 3);
    setPrinterType(settings.printerType || 'A4');
    setRows(settings.rows || 6);
    setCols(settings.cols || 3);
    setCodeSize(settings.codeSize || 30);
    setMargin(settings.margin || 10);
  };

  const deleteSettings = async (id: string) => {
    try {
      await api.delete(`/generator-settings/${id}`);
      toast.success('Deleted');
      loadSavedSettings();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 font-['Cormorant_Garamond']">
          QR / Barcode Generator
        </h1>
        <p className="text-base-content/60 mb-8">
          Generate single codes or batches for printing.
        </p>

        {/* Mode tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button
            onClick={() => setGenerationMode('single')}
            className={`tab ${generationMode === 'single' ? 'tab-active' : ''} gap-2`}
          >
            <QrCode className="w-4 h-4" /> Single
          </button>
          <button
            onClick={() => setGenerationMode('batch')}
            className={`tab ${generationMode === 'batch' ? 'tab-active' : ''} gap-2`}
          >
            <Barcode className="w-4 h-4" /> Batch
          </button>
        </div>

        {generationMode === 'single' ? (
          /* ---------- SINGLE MODE ---------- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl p-6 space-y-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setSingleType('qr')}
                  className={`btn ${singleType === 'qr' ? 'btn-primary' : 'btn-outline'} gap-2 flex-1`}
                >
                  <QrCode className="w-4 h-4" /> QR
                </button>
                <button
                  onClick={() => setSingleType('barcode')}
                  className={`btn ${singleType === 'barcode' ? 'btn-primary' : 'btn-outline'} gap-2 flex-1`}
                >
                  <Barcode className="w-4 h-4" /> Barcode
                </button>
              </div>

              {singleType === 'barcode' && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Barcode Format</span></label>
                  <select
                    value={singleBarcodeFormat}
                    onChange={(e) => setSingleBarcodeFormat(e.target.value)}
                    className="select select-bordered w-full"
                  >
                    <option value="code128">Code 128</option>
                    <option value="ean13">EAN-13</option>
                    <option value="upca">UPC-A</option>
                    <option value="itf14">ITF-14</option>
                    <option value="datamatrix">Data Matrix</option>
                  </select>
                </div>
              )}

              <div className="form-control">
                <label className="label"><span className="label-text">Content / Value</span></label>
                <input
                  type="text"
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  placeholder="Enter text, URL, or data"
                  className="input input-bordered w-full"
                />
              </div>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = 'code.png';
                    link.href = singlePreview || '#';
                    link.click();
                  }}
                  disabled={!singlePreview}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button
                  onClick={() => {
                    if (!singlePreview) return;
                    const win = window.open('', '_blank');
                    win?.document.write(`<img src="${singlePreview}" onload="window.print();window.close()" />`);
                  }}
                  disabled={!singlePreview}
                  className="btn btn-outline flex-1 gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl p-6">
              <div className="border-2 border-dashed border-base-300 rounded-xl p-6 flex justify-center items-center min-h-64 bg-base-200/50">
                {singlePreview ? (
                  <img src={singlePreview} alt="Generated code" className="max-w-full max-h-64" />
                ) : (
                  <p className="text-base-content/40">Enter a value to see preview</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ---------- BATCH MODE ---------- */
          <div className="card bg-base-100 shadow-xl p-6 space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setBatchType('qr')}
                className={`btn ${batchType === 'qr' ? 'btn-primary' : 'btn-outline'} gap-2 flex-1`}
              >
                <QrCode className="w-4 h-4" /> QR
              </button>
              <button
                onClick={() => setBatchType('barcode')}
                className={`btn ${batchType === 'barcode' ? 'btn-primary' : 'btn-outline'} gap-2 flex-1`}
              >
                <Barcode className="w-4 h-4" /> Barcode
              </button>
            </div>

            {batchType === 'barcode' && (
              <div className="form-control">
                <label className="label"><span className="label-text">Barcode Format</span></label>
                <select
                  value={batchBarcodeFormat}
                  onChange={(e) => setBatchBarcodeFormat(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="code128">Code 128</option>
                  <option value="ean13">EAN-13</option>
                  <option value="upca">UPC-A</option>
                  <option value="itf14">ITF-14</option>
                  <option value="datamatrix">Data Matrix</option>
                </select>
              </div>
            )}

            {/* Batch approach selector */}
            <div className="form-control">
              <label className="label"><span className="label-text">Batch Generation Mode</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setBatchMode('sequential')}
                  className={`btn ${batchMode === 'sequential' ? 'btn-primary' : 'btn-outline'} gap-2 justify-center`}
                >
                  <Hash className="w-4 h-4" /> Sequential Number
                </button>
                <button
                  onClick={() => setBatchMode('list')}
                  className={`btn ${batchMode === 'list' ? 'btn-primary' : 'btn-outline'} gap-2 justify-center`}
                >
                  <List className="w-4 h-4" /> Custom List
                </button>
              </div>
            </div>

            {batchMode === 'sequential' ? (
              <>
                <div className="form-control">
                  <label className="label"><span className="label-text">Code Structure</span></label>
                  <input
                    type="text"
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="e.g., CRO23432026{number}"
                  />
                  <p className="text-xs text-base-content/50 mt-1">
                    Use {'{number}'} for sequential number, {'{year}'} for current year.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Start Number</span></label>
                    <input type="number" value={startNum} onChange={(e) => setStartNum(+e.target.value)} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">End Number</span></label>
                    <input type="number" value={endNum} onChange={(e) => setEndNum(+e.target.value)} className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Pad Length</span></label>
                    <input type="number" min="1" max="10" value={padLength} onChange={(e) => setPadLength(Math.max(1, +e.target.value))} className="input input-bordered" />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Paste values (one per line)</span></label>
                  <textarea
                    value={customListText}
                    onChange={(e) => setCustomListText(e.target.value)}
                    className="textarea textarea-bordered h-32 w-full"
                    placeholder={"CRO23432026001\nCRO23432026002\nCRO23432026003"}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Or upload CSV file</span></label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="file-input file-input-bordered w-full"
                  />
                </div>
              </div>
            )}

            {/* Printer / layout settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Printer Type</span></label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="A4">A4 Paper</option>
                  <option value="label-roll">Label Roll</option>
                  <option value="zebra">Zebra Label</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Rows</span></label>
                  <input type="number" value={rows} onChange={(e) => setRows(+e.target.value)} className="input input-bordered" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Columns</span></label>
                  <input type="number" value={cols} onChange={(e) => setCols(+e.target.value)} className="input input-bordered" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Code Size (mm)</span></label>
                <input type="number" value={codeSize} onChange={(e) => setCodeSize(+e.target.value)} className="input input-bordered" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Margin (mm)</span></label>
                <input type="number" value={margin} onChange={(e) => setMargin(+e.target.value)} className="input input-bordered" />
              </div>
            </div>

            {/* Saved settings */}
            {user && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Save className="w-4 h-4 text-primary" /> Saved Settings
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Settings name"
                    className="input input-bordered flex-1"
                  />
                  <button onClick={saveSettings} className="btn btn-primary gap-2">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
                {savedSettings.length > 0 && (
                  <div className="space-y-2">
                    {savedSettings.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-base-200 p-2 rounded-lg">
                        <span className="text-sm truncate">{s.name}</span>
                        <div className="flex gap-1">
                          <button onClick={() => loadSettings(s.settings)} className="btn btn-ghost btn-xs">
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteSettings(s.id)} className="btn btn-ghost btn-xs text-error">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBatchPreview}
                disabled={generatingPreview}
                className="btn btn-outline flex-1 gap-2"
              >
                {generatingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview Batch
              </button>
              <button onClick={handleBatchGenerate} className="btn btn-primary flex-1 gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={handleBatchPrint} className="btn btn-outline flex-1 gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>

            {/* Batch preview grid */}
            {showBatchPreview && batchPreviewImages.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Preview ({batchPreviewImages.length} codes)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-80 overflow-y-auto p-2">
                  {batchPreviewImages.map((item, idx) => (
                    <div key={idx} className="bg-base-200 rounded-lg p-3 flex flex-col items-center gap-2">
                      <img src={item.dataUrl} alt={item.value} className="max-w-full h-auto" />
                      <span className="text-xs text-base-content/70 text-center break-all">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}