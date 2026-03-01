import React, { useMemo, useState } from 'react';
import { Download, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

type RenamedImage = {
  file: File;
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
      let resizedCount = 0;
      const started = performance.now();

      for (let i = 0; i < files.length; i++) {
        const itemStart = performance.now();
        const file = files[i];
        const optimized = await optimizeImageForAnalyze(file);
        if (optimized.resized) resizedCount += 1;

        const resp = await fetch('/api/generate-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
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

        const title = String(json?.title || productTitle).trim();
        const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || '.jpg').toLowerCase();
        const newName = `${String(i + 1).padStart(2, '0')}-${sanitizeName(title || productTitle)}${ext}`;

        out.push({ file, newName, ms: Math.round(performance.now() - itemStart) });
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

  const downloadRenamed = () => {
    results.forEach(({ file, newName }) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = newName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
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
          <input type="file" multiple accept="image/*" onChange={onFileChange} className="mt-1 w-full text-sm" />
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
              <Download className="w-4 h-4" /> Download Renamed
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
                    <div className="text-gray-500 truncate">{r.file.name}</div>
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{r.newName}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{r.ms ?? 0} ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSeoPage;
