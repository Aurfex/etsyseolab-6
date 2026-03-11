import React, { useMemo, useState } from 'react';
import { Download, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { useAppContext } from '../contexts/AppContext';

type RenamedImage = {
  file: File;
  resizedBlob: Blob;
  newName: string;
  ms?: number;
};

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    const comma = result.indexOf(',');
    resolve(comma >= 0 ? result.slice(comma + 1) : result);
  };
  reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
  reader.readAsDataURL(blob);
});

const MAX_DIM = 1024;
const MAX_BYTES = 300 * 1024;
const OUTPUT_SIZE = 2000;

const resizeForFinalOutput = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const scale = Math.min(OUTPUT_SIZE / bitmap.width, OUTPUT_SIZE / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const x = Math.round((OUTPUT_SIZE - w) / 2);
  const y = Math.round((OUTPUT_SIZE - h) / 2);

  ctx.drawImage(bitmap, x, y, w, h);
  bitmap.close();

  const outBlob: Blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || file), 'image/webp', 0.9);
  });
  return outBlob;
};

const optimizeImageForAnalyze = async (file: File): Promise<{ mimeType: string; data: string; resized: boolean }> => {
  if (file.size <= MAX_BYTES) {
    return { mimeType: file.type || 'image/jpeg', data: await blobToBase64(file), resized: false };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { mimeType: file.type || 'image/jpeg', data: await blobToBase64(file), resized: false };
  }

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let q = 0.8;
  let outBlob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', q));
  while (outBlob.size > MAX_BYTES && q > 0.45) {
    q -= 0.08;
    outBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || outBlob), 'image/jpeg', q));
  }

  return { mimeType: 'image/jpeg', data: await blobToBase64(outBlob), resized: true };
};

const sanitizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

const ImageSeoPage: React.FC = () => {
  const { showToast } = useAppContext();
  const [productTitle, setProductTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<RenamedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timing, setTiming] = useState<{ totalMs: number; avgMs: number; resizedCount: number } | null>(null);

  const canRun = useMemo(() => files.length > 0 && productTitle.trim().length > 0, [files.length, productTitle]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).slice(0, 15);
    setFiles(list);
    setResults([]);
    setTiming(null);
  };

  const generateNames = async () => {
    if (!canRun) return;
    setIsProcessing(true);
    try {
      const tokenRaw = sessionStorage.getItem('auth');
      const token = tokenRaw ? JSON.parse(tokenRaw).token : null;
      if (!token) throw new Error('Authentication required.');

      const out: RenamedImage[] = [];
      const usedStems = new Map<string, number>();
      let resizedCount = 0;
      const started = performance.now();

      for (let i = 0; i < files.length; i++) {
        const itemStart = performance.now();
        const file = files[i];
        const resizedBlob = await resizeForFinalOutput(file);
        const optimized = await optimizeImageForAnalyze(file);
        if (optimized.resized) resizedCount += 1;

        const resp = await fetch('/api/generate-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'image_seo_name',
            details: {
              title: productTitle,
              description: '',
              keywords,
            },
            images: [{ mimeType: optimized.mimeType, data: optimized.data }],
          }),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json.error || `Name generation failed (${resp.status})`);

        const stem = sanitizeName(String(json?.filenameStem || productTitle || 'product-image'));
        const seen = (usedStems.get(stem) || 0) + 1;
        usedStems.set(stem, seen);
        const uniqueStem = seen > 1 ? `${stem}-${seen}` : stem;
        const newName = `${uniqueStem}.webp`;

        out.push({ file, resizedBlob, newName, ms: Math.round(performance.now() - itemStart) });
      }

      const totalMs = Math.round(performance.now() - started);
      setTiming({ totalMs, avgMs: Math.round(totalMs / Math.max(1, out.length)), resizedCount });
      setResults(out);
      showToast({ tKey: 'toast_metadata_generated', type: 'success' });
    } catch (e: any) {
      showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadRenamed = async () => {
    if (!results.length) return;
    const zip = new JSZip();

    for (const r of results) {
      const buf = await r.resizedBlob.arrayBuffer();
      zip.file(r.newName, buf);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-seo-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Image SEO</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate SEO-friendly image names using product title, manual keywords, and AI image analysis.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product title</label>
          <input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} className="mt-1 w-full input-field" placeholder="e.g. Rose Gold Claddagh Ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual keywords (optional)</label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mt-1 w-full input-field" placeholder="e.g. irish ring, wedding band, celtic" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images (up to 15)</label>
          <input type="file" multiple accept="image/*" onChange={onFileChange} className="mt-1 w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/50 dark:file:text-purple-300" />
          <p className="text-xs text-gray-500 mt-1">Selected: {files.length}</p>
        </div>

        <button onClick={generateNames} disabled={!canRun || isProcessing} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60">
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isProcessing ? 'Generating...' : 'Generate SEO Names'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Results</h2>
            <button onClick={downloadRenamed} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
              <Download className="w-4 h-4" /> Download ZIP (2000x2000 WEBP)
            </button>
          </div>

          {timing && (
            <div className="text-xs p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200">
              Total: {timing.totalMs} ms | Avg/Image: {timing.avgMs} ms | Resized: {timing.resizedCount}/{results.length}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {results.map((r, i) => (
              <div key={`${r.newName}-${i}`} className="p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={URL.createObjectURL(r.file)} alt={r.file.name} className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700" />
                  <div className="min-w-0">
                    <div className="text-gray-500 dark:text-gray-400 truncate">{r.file.name}</div>
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{r.newName}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.ms ?? 0} ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSeoPage;
