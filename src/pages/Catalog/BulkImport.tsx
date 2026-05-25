// pages/catalog/BulkImport.tsx
import { useState, useRef } from 'react';
import {
  Upload, Download, CheckCircle, XCircle, AlertCircle,
  FileSpreadsheet, FolderOpen, Image as ImageIcon, Trash2,
  ToggleLeft, ChevronDown, ChevronUp, Info, Eye, Loader2
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import toast from 'react-hot-toast';
import { extractErrorMessage, formatFileSize, downloadBlob } from '../../lib/catalog.utils';
import axiosInstance from '../../lib/axios';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface BulkImportResult   { created: number; updated: number; errors: string[]; }
interface BulkDeleteResult   { deleted: number; failed: string[]; errors: string[]; }
interface BulkStatusResult   { updated: number; failed: string[]; errors: string[]; }
interface ImageUploadResult  {
  uploaded: number; skipped: number; errors: string[];
  details: { filename: string; model?: string; status: string }[];
}
interface UploadProgress { percent: number; loaded: number; total: number; }
type ActiveTab = 'import' | 'images' | 'delete' | 'status';

// ─────────────────────────────────────────────────────────────
// Inline API helpers — timeout: 0 disables the 30-second limit
// ─────────────────────────────────────────────────────────────
async function bulkImportWithProgress(
  formData: FormData,
  onProgress: (p: UploadProgress) => void
): Promise<BulkImportResult> {
  const res = await axiosInstance.post('/catalog/bulk-import/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // no timeout — large CSVs take time to process server-side
    onUploadProgress: (evt) => {
      if (evt.total) onProgress({ percent: Math.round((evt.loaded / evt.total) * 100), loaded: evt.loaded, total: evt.total });
    },
  });
  return res.data;
}

async function bulkUploadImagesWithProgress(
  formData: FormData,
  onProgress: (p: UploadProgress) => void
): Promise<ImageUploadResult> {
  const res = await axiosInstance.post('/catalog/bulk-images/upload-images/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (evt) => {
      if (evt.total) onProgress({ percent: Math.round((evt.loaded / evt.total) * 100), loaded: evt.loaded, total: evt.total });
    },
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────────
// CSV Format definitions
// ─────────────────────────────────────────────────────────────
const CSV_FORMATS = {
  categories: {
    headers: ['name','slug','description','sort_order','is_active','is_featured'],
    required: ['name'],
    example: `name,slug,description,sort_order,is_active,is_featured\nSmartphones,smartphones,Mobile phones,1,true,true\nLaptops,laptops,Portable computers,2,true,false`,
    notes: [
      'slug is auto-generated from name if omitted',
      'is_active / is_featured: true or false',
      'sort_order: integer — lower = appears first',
      'Existing records matched by name are updated',
    ],
  },
  brands: {
    headers: ['name','slug','description','country_of_origin','website','sort_order','is_active'],
    required: ['name'],
    example: `name,slug,description,country_of_origin,website,sort_order,is_active\nApple,apple,Premium devices,USA,https://apple.com,1,true\nSamsung,samsung,Korean electronics,South Korea,https://samsung.com,2,true`,
    notes: [
      'slug is auto-generated from name if omitted',
      'website must start with https://',
      'Existing records matched by name are updated',
    ],
  },
  models: {
    headers: ['Category','Brand','Name','Slug','Model Number','Launch Year','Base Price','Storage Options','Ram Options','Color Options','Specifications (JSON)','Description','Meta Description','Is Active','Is Featured','Created By'],
    required: ['Category','Brand','Name','Base Price'],
    example: `Category,Brand,Name,Slug,Model Number,Launch Year,Base Price,Storage Options,Ram Options,Color Options,Specifications (JSON),Description,Meta Description,Is Active,Is Featured,Created By\nPhones,Apple,iPhone 15,iphone-15,A3092,2023,79900.00,"[""128GB"",""256GB""]","[""6GB""]","[""Black"",""Blue""]","{""processor"":""A16 Bionic""}","iPhone 15 description","iPhone 15 meta",true,false,Admin`,
    notes: [
      'Category and Brand must match existing records exactly (import them first)',
      'Storage/RAM/Color Options: JSON array ["128GB","256GB"] or comma-separated',
      'Specifications: JSON object {"processor":"A16"}',
      '"Created By": Admin maps to the logged-in user',
      'Existing records matched by Category + Brand + Slug are updated',
      'Meta Description column may be empty — the importer handles this automatically',
    ],
  },
  attributes: {
    headers: ['name','device_category','attribute_type','question_text','is_boolean','options','price_impact','bucket','is_required'],
    required: ['name','device_category','attribute_type','question_text'],
    example: `name,device_category,attribute_type,question_text,is_boolean,options,price_impact,bucket,is_required\nscreen_condition,Phones,cosmetic,What is the screen condition?,false,"[""Excellent"",""Good""]","{""Excellent"":{""type"":""percentage"",""value"":0}}",screen,true`,
    notes: [
      'device_category must match an existing category name',
      'attribute_type: cosmetic | functional | accessory | specification | warranty | legal',
      'bucket: none | screen | body',
    ],
  },
  variants: {
    headers: ['Category','Brand','Model','Specs','Final Price'],
    required: ['Category','Brand','Model','Final Price'],
    example: `Category,Brand,Model,Specs,Final Price\nPhones,Apple,iPhone 15,,79900\nPhones,Apple,iPhone 15,128GB/6GB/Black,79900`,
    notes: [
      'Model must exactly match the device model name in catalog',
      'Specs optional: storage/ram/color e.g. "128GB/6GB/Black"',
    ],
  },
};

const IMAGE_NAMING_GUIDE = `Folder Structure (recommended):
  images/
    ├── Smartphones/
    │   ├── Apple/
    │   │   ├── iPhone 15/
    │   │   │   ├── 01.jpg    ← first image becomes Primary
    │   │   │   └── 02.jpg
    │   └── Samsung/

Flat naming (also supported):
  Phones__Apple__iPhone-15__01.jpg

Rules:
• First image (01, 1, primary) → is_primary = true
• Supported: JPG, JPEG, PNG, WEBP  |  Max 5 MB each
• Model name matching is case-insensitive
• Max 500 images per upload, max 10 per model`;

// ─────────────────────────────────────────────────────────────
// Shared UI Components
// ─────────────────────────────────────────────────────────────
function ProgressBar({ progress, label }: { progress: UploadProgress | null; label: string }) {
  if (!progress) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {(progress.loaded / 1024 / 1024).toFixed(1)} MB
        {progress.total ? ` / ${(progress.total / 1024 / 1024).toFixed(1)} MB` : ''} uploaded
      </p>
    </div>
  );
}

function StatusBanner({ uploading, progress }: { uploading: boolean; progress: UploadProgress | null }) {
  if (!uploading) return null;
  const isProcessing = progress && progress.percent >= 100;
  return (
    <div className="flex items-start gap-3 text-sm bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-blue-800">
          {isProcessing ? 'File received — server is processing rows…' : 'Uploading file to server…'}
        </p>
        {isProcessing && (
          <p className="text-blue-600 text-xs mt-0.5">
            Large files (1000+ rows) may take 30–120 seconds. Do not close this tab.
          </p>
        )}
      </div>
    </div>
  );
}

function FormatGuide({ type, open, onToggle }: { type: keyof typeof CSV_FORMATS; open: boolean; onToggle: () => void }) {
  const fmt = CSV_FORMATS[type];
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left">
        <span className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Info className="w-4 h-4" /> CSV Format Guide — {type}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
      </button>
      {open && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Columns</p>
            <div className="flex flex-wrap gap-2">
              {fmt.headers.map(h => (
                <span key={h} className={`text-xs px-2 py-1 rounded font-mono ${fmt.required.includes(h) ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'}`}>
                  {h}{fmt.required.includes(h) && <span className="ml-0.5 text-red-500">*</span>}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Notes</p>
            <ul className="space-y-1">
              {fmt.notes.map((n, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Example</p>
            <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded overflow-x-auto whitespace-pre">{fmt.example}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 1 — CSV / XLSX Import
// ─────────────────────────────────────────────────────────────
function ImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState<keyof typeof CSV_FORMATS>('categories');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) { toast.error('Upload a CSV or Excel file'); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error('File too large — max 50 MB'); return; }
    setFile(f); setResult(null); setProgress(null);
  };

  const handleDownloadTemplate = () => {
    const fmt = CSV_FORMATS[modelType];
    const csv = [fmt.headers.join(','), ...fmt.example.split('\n').slice(1)].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `template_${modelType}.csv`);
    toast.success('Template downloaded');
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(true); setResult(null);
    setProgress({ percent: 0, loaded: 0, total: file.size });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('model_type', modelType);
    try {
      const data = await bulkImportWithProgress(fd, setProgress);
      setResult(data);
      if (!data.errors?.length) toast.success(`Done! ${data.created} created, ${data.updated} updated`);
      else toast.error(`Completed with ${data.errors.length} error(s)`);
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        toast.error('Request timed out — server may still be processing. Check back in a minute.');
      } else {
        toast.error(extractErrorMessage(err));
      }
    } finally { setUploading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Upload File</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
              <select value={modelType} onChange={e => { setModelType(e.target.value as any); setResult(null); setGuideOpen(false); }}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="categories">Categories</option>
                <option value="brands">Brands</option>
                <option value="models">Device Models</option>
                <option value="attributes">Attributes</option>
                <option value="variants">Variants / Pricing</option>
              </select>
            </div>
            <FormatGuide type={modelType} open={guideOpen} onToggle={() => setGuideOpen(v => !v)} />
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input type="file" id="bulk-upload" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
                <label htmlFor="bulk-upload" className="cursor-pointer block">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <span className="text-sm text-gray-600 block mb-1">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500">Excel (.xlsx, .xls) or CSV — up to 50 MB</span>
                </label>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setProgress(null); setResult(null); }} disabled={uploading} className="text-gray-400 hover:text-red-600 disabled:opacity-40">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
            {uploading && <ProgressBar progress={progress} label={progress && progress.percent < 100 ? 'Uploading file to server…' : 'File received — processing rows…'} />}
            <StatusBanner uploading={uploading} progress={progress} />
            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress && progress.percent < 100 ? `Uploading ${progress.percent}%…` : 'Processing…'}</>
                ) : 'Upload & Import'}
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate} disabled={uploading}>
                <Download className="w-4 h-4 mr-2" />Template
              </Button>
            </div>
          </div>
        </Card>
        {result && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">Import Results</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-3xl font-bold text-green-600">{result.created}</div>
                  <div className="text-xs text-green-700 font-medium mt-1">CREATED</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-3xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-xs text-blue-700 font-medium mt-1">UPDATED</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <div className="text-3xl font-bold text-red-600">{result.errors?.length ?? 0}</div>
                  <div className="text-xs text-red-700 font-medium mt-1">ERRORS</div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">{result.errors.length} error(s) — fix and re-import:</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-800 bg-white rounded px-3 py-1.5 font-mono">{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      <div className="space-y-4">
        <Card>
          <div className="p-5">
            <h3 className="font-semibold mb-3 border-b pb-2">How to Import</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              {['Select the import type','Download the template CSV','Fill your data following the format guide','Upload — progress bar shows upload, then server processes','Review results and fix any errors'].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <div className="p-5">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Large Files (1000+ rows)</h3>
            <ul className="text-sm text-amber-800 space-y-1.5">
              <li>• File uploads in seconds</li>
              <li>• Server processing takes 30–120 s</li>
              <li>• Do not close the tab while "Processing…" is shown</li>
              <li>• Results appear automatically when done</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 2 — Bulk Image Upload
// ─────────────────────────────────────────────────────────────
function ImageUploadTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<ImageUploadResult | null>(null);
  const [namingOpen, setNamingOpen] = useState(true);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const all = Array.from(e.target.files).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name));
    if (all.length > 500) { toast.error('Maximum 500 images per upload'); return; }
    setFiles(all); setResult(null); setProgress(null);
    if (all.length > 0) toast.success(`${all.length} images selected`);
  };

  const handleUpload = async () => {
    if (!files.length) { toast.error('No images selected'); return; }
    setUploading(true); setResult(null);
    setProgress({ percent: 0, loaded: 0, total: files.reduce((s, f) => s + f.size, 0) });
    const fd = new FormData();
    files.forEach(f => { const rel = (f as any).webkitRelativePath || f.name; fd.append('images', f, rel); });
    try {
      const data = await bulkUploadImagesWithProgress(fd, setProgress);
      setResult(data);
      toast.success(`Uploaded ${data.uploaded} images`);
    } catch (err: any) { toast.error(extractErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const grouped = files.reduce<Record<string, File[]>>((acc, f) => {
    const rel: string = (f as any).webkitRelativePath || f.name;
    const parts = rel.split('/');
    const key = parts.length >= 3 ? parts.slice(0, 3).join(' / ') : parts[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="border border-blue-200 rounded-lg overflow-hidden">
          <button type="button" onClick={() => setNamingOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors">
            <span className="text-sm font-semibold text-blue-800 flex items-center gap-2"><FolderOpen className="w-4 h-4" />Folder Structure & Naming Convention</span>
            {namingOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
          </button>
          {namingOpen && <div className="p-4 bg-white"><pre className="bg-gray-900 text-green-400 text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap">{IMAGE_NAMING_GUIDE}</pre></div>}
        </div>
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Upload Image Folder</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" className="hidden" onChange={handleFolderChange} accept="image/jpeg,image/png,image/webp"
                // @ts-ignore
                webkitdirectory="" multiple />
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-700 font-medium">Click to select a folder</p>
              <p className="text-xs text-gray-500 mt-1">Category / Brand / Model folder structure</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — up to 500 images, 5 MB each</p>
            </div>
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{files.length} images across {Object.keys(grouped).length} models</p>
                  <button onClick={() => setFiles([])} disabled={uploading} className="text-xs text-red-600 hover:underline disabled:opacity-50">Clear all</button>
                </div>
                <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                  {Object.entries(grouped).map(([modelPath, modelFiles]) => (
                    <div key={modelPath} className="px-4 py-2 flex items-center justify-between text-sm">
                      <div><span className="font-medium text-gray-800">{modelPath}</span><span className="ml-2 text-xs text-gray-500">{modelFiles.length} image(s)</span></div>
                      <button onClick={() => setPreview({ name: modelPath, url: URL.createObjectURL(modelFiles[0]) })} className="text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {preview && (
              <div className="border rounded-lg p-3 bg-gray-50 relative">
                <button onClick={() => setPreview(null)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4" /></button>
                <p className="text-xs text-gray-500 mb-2">Preview: {preview.name}</p>
                <img src={preview.url} alt="preview" className="max-h-40 rounded object-contain mx-auto" />
              </div>
            )}
            {uploading && <ProgressBar progress={progress} label={progress && progress.percent < 100 ? 'Uploading images…' : 'Matching images to models…'} />}
            <StatusBanner uploading={uploading} progress={progress} />
            <Button onClick={handleUpload} disabled={!files.length || uploading} className="w-full">
              {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress && progress.percent < 100 ? `Uploading ${progress.percent}%…` : 'Processing…'}</>) : `Upload ${files.length} Images`}
            </Button>
          </div>
        </Card>
        {result && (
          <Card><div className="p-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Upload Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-green-600">{result.uploaded}</div><div className="text-xs text-green-700 font-medium mt-1">UPLOADED</div></div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-amber-600">{result.skipped}</div><div className="text-xs text-amber-700 font-medium mt-1">SKIPPED</div></div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-red-600">{result.errors?.length ?? 0}</div><div className="text-xs text-red-700 font-medium mt-1">ERRORS</div></div>
            </div>
            {result.details?.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y text-xs">
                {result.details.map((d, i) => (
                  <div key={i} className={`px-3 py-2 flex justify-between ${d.status === 'error' ? 'bg-red-50' : ''}`}>
                    <span className="font-mono text-gray-700">{d.filename}</span>
                    <span className={d.status === 'uploaded' ? 'text-green-600' : d.status === 'skipped' ? 'text-amber-600' : 'text-red-600'}>{d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div></Card>
        )}
      </div>
      <div className="space-y-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-5">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Image Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>• Folder names must match Category / Brand / Model</li>
              <li>• First image (01.jpg) becomes primary</li>
              <li>• Max 10 images per model</li>
              <li>• JPG, PNG, WEBP — max 5 MB each</li>
              <li>• Case-insensitive model matching</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 3 — Bulk Delete
// ─────────────────────────────────────────────────────────────
function BulkDeleteTab() {
  const [entityType, setEntityType] = useState('models');
  const [idsText, setIdsText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<BulkDeleteResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const idList = idsText.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);

  const handleDelete = async () => {
    if (!idList.length) { toast.error('Enter at least one ID'); return; }
    if (!confirmed) { toast.error('Check the confirmation box first'); return; }
    setDeleting(true); setResult(null);
    try {
      try {
        const res = await axiosInstance.post(`/catalog/${entityType}/bulk-delete/`, { ids: idList }, { timeout: 0 });
        setResult(res.data); toast.success(`Deleted ${res.data.deleted} records`);
      } catch {
        let deleted = 0; const failed: string[] = []; const errors: string[] = [];
        await Promise.allSettled(idList.map(async id => {
          try { await axiosInstance.delete(`/catalog/${entityType}/${id}/`, { timeout: 0 }); deleted++; }
          catch (e: any) { failed.push(id); errors.push(`${id}: ${e?.response?.data?.detail ?? 'failed'}`); }
        }));
        setResult({ deleted, failed, errors }); toast.success(`Deleted ${deleted}/${idList.length}`);
      }
    } catch (err: any) { toast.error(extractErrorMessage(err)); }
    finally { setDeleting(false); setConfirmed(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card><div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 text-red-700">Bulk Delete Records</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
              <option value="categories">Categories</option><option value="brands">Brands</option>
              <option value="models">Device Models</option><option value="variants">Variants</option><option value="attributes">Attributes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IDs to Delete <span className="ml-2 text-xs text-gray-400 font-normal">(one per line or comma/semicolon separated)</span></label>
            <textarea value={idsText} onChange={e => { setIdsText(e.target.value); setConfirmed(false); }}
              className="w-full h-36 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-red-500 focus:border-red-500 resize-none"
              placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6&#10;7b3a1c9e-4f2d-11ec-81d3-0242ac130003" />
            {idsText && <p className="text-xs text-gray-500 mt-1">{idList.length} ID(s) parsed</p>}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium mb-3">⚠ This permanently deletes {idList.length} {entityType} record(s). Cannot be undone.</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="rounded border-red-400" />
              <span className="text-sm text-red-800 font-medium">I understand this is irreversible and want to proceed</span>
            </label>
          </div>
          <Button onClick={handleDelete} disabled={!idList.length || deleting || !confirmed} className="w-full bg-red-600 hover:bg-red-700 text-white border-0">
            {deleting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</>) : (<><Trash2 className="w-4 h-4 mr-2" />Delete {idList.length} {entityType}</>)}
          </Button>
        </div></Card>
        {result && (
          <Card><div className="p-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Delete Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-green-600">{result.deleted}</div><div className="text-xs text-green-700 font-medium mt-1">DELETED</div></div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-red-600">{result.failed?.length ?? 0}</div><div className="text-xs text-red-700 font-medium mt-1">FAILED</div></div>
            </div>
            {result.failed?.length > 0 && <div className="max-h-32 overflow-y-auto space-y-1">{result.failed.map((id, i) => <div key={i} className="text-xs font-mono text-red-800 bg-red-50 rounded px-2 py-1">{id}</div>)}</div>}
          </div></Card>
        )}
      </div>
      <div className="space-y-4">
        <Card className="bg-red-50 border-red-200"><div className="p-5">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Caution</h3>
          <ul className="text-sm text-red-800 space-y-1.5">
            <li>• Deleted records cannot be recovered</li><li>• Deleting a Category removes all linked models</li>
            <li>• Deleting a Brand removes all its models</li><li>• Deleting a Model removes all its variants</li>
          </ul>
        </div></Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 4 — Bulk Status Update
// ─────────────────────────────────────────────────────────────
function BulkStatusTab() {
  const [entityType, setEntityType] = useState('models');
  const [field, setField] = useState<'is_active'|'is_featured'|'is_available'>('is_active');
  const [value, setValue] = useState<boolean>(true);
  const [idsText, setIdsText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<BulkStatusResult | null>(null);
  const idList = idsText.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
  const FIELDS: Record<string,{value:string;label:string}[]> = {
    categories:[{value:'is_active',label:'Active Status'},{value:'is_featured',label:'Featured'}],
    brands:[{value:'is_active',label:'Active Status'},{value:'is_featured',label:'Featured'}],
    models:[{value:'is_active',label:'Active Status'},{value:'is_featured',label:'Featured'}],
    variants:[{value:'is_available',label:'Availability'}],
    attributes:[{value:'is_active',label:'Active Status'}],
  };
  const handleUpdate = async () => {
    if (!idList.length) { toast.error('Enter at least one ID'); return; }
    setUpdating(true); setResult(null);
    try {
      try {
        const res = await axiosInstance.post(`/catalog/${entityType}/bulk-update/`, { ids: idList, updates: { [field]: value } }, { timeout: 0 });
        setResult(res.data); toast.success(`Updated ${res.data.updated} records`);
      } catch {
        let updated = 0; const failed: string[] = []; const errors: string[] = [];
        await Promise.allSettled(idList.map(async id => {
          try { await axiosInstance.patch(`/catalog/${entityType}/${id}/`, { [field]: value }, { timeout: 0 }); updated++; }
          catch (e: any) { failed.push(id); errors.push(`${id}: ${e?.response?.data?.detail ?? 'failed'}`); }
        }));
        setResult({ updated, failed, errors }); toast.success(`Updated ${updated}/${idList.length}`);
      }
    } catch (err: any) { toast.error(extractErrorMessage(err)); }
    finally { setUpdating(false); }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card><div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Bulk Status Update</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
              <select value={entityType} onChange={e => { setEntityType(e.target.value); setField('is_active'); }} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="categories">Categories</option><option value="brands">Brands</option>
                <option value="models">Models</option><option value="variants">Variants</option><option value="attributes">Attributes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
              <select value={field} onChange={e => setField(e.target.value as any)} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary">
                {(FIELDS[entityType]??[]).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Set To</label>
              <select value={String(value)} onChange={e => setValue(e.target.value === 'true')} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="true">✓ True / Active / Enable</option>
                <option value="false">✗ False / Inactive / Disable</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record IDs <span className="ml-2 text-xs text-gray-400 font-normal">(one per line or comma separated)</span></label>
            <textarea value={idsText} onChange={e => setIdsText(e.target.value)} className="w-full h-36 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-primary focus:border-primary resize-none" placeholder="Paste UUIDs here…" />
            {idsText && <p className="text-xs text-gray-500 mt-1">{idList.length} ID(s) parsed</p>}
          </div>
          {idList.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">Will set <strong>{field}</strong> = <strong>{String(value)}</strong> for <strong>{idList.length}</strong> {entityType} record(s).</p>
            </div>
          )}
          <Button onClick={handleUpdate} disabled={!idList.length || updating} className="w-full">
            {updating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</>) : (<><ToggleLeft className="w-4 h-4 mr-2" />Update {idList.length} Records</>)}
          </Button>
        </div></Card>
        {result && (
          <Card><div className="p-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Update Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-green-600">{result.updated}</div><div className="text-xs text-green-700 font-medium mt-1">UPDATED</div></div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"><div className="text-3xl font-bold text-red-600">{result.failed?.length ?? 0}</div><div className="text-xs text-red-700 font-medium mt-1">FAILED</div></div>
            </div>
          </div></Card>
        )}
      </div>
      <div className="space-y-4">
        <Card className="bg-blue-50 border-blue-200"><div className="p-5">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><ToggleLeft className="w-4 h-4" />Use Cases</h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>• Activate a batch of seasonal models</li><li>• Feature models for a campaign</li>
            <li>• Mark out-of-stock variants unavailable</li><li>• Deactivate discontinued brands</li>
          </ul>
        </div></Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
export default function BulkImport() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('import');
  const TABS = [
    { key: 'import' as const, label: 'CSV / Excel Import', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Import categories, brands, models, attributes, variants' },
    { key: 'images' as const, label: 'Bulk Image Upload', icon: <ImageIcon className="w-5 h-5" />, description: 'Upload a folder of images mapped to device models' },
    { key: 'delete' as const, label: 'Bulk Delete', icon: <Trash2 className="w-5 h-5" />, description: 'Permanently delete multiple records by ID' },
    { key: 'status' as const, label: 'Bulk Status Update', icon: <ToggleLeft className="w-5 h-5" />, description: 'Toggle active / featured / available for many records' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Bulk Operations</h1>
        <p className="text-gray-600 mt-1">Import, upload, and manage catalog records in bulk</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${activeTab === tab.key ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className={`mb-2 ${activeTab === tab.key ? 'text-primary' : 'text-gray-500'}`}>{tab.icon}</div>
            <div className={`text-sm font-semibold ${activeTab === tab.key ? 'text-primary' : 'text-gray-900'}`}>{tab.label}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{tab.description}</div>
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'import' && <ImportTab />}
        {activeTab === 'images' && <ImageUploadTab />}
        {activeTab === 'delete' && <BulkDeleteTab />}
        {activeTab === 'status' && <BulkStatusTab />}
      </div>
    </div>
  );
}