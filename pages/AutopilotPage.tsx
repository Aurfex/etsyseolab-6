import React, { useMemo, useState } from 'react';
import { Bot, AlertTriangle, Loader2, Search, Wrench, Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Product } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { compareSeoWithCompetitors, updateListing } from '../services/etsyApiService';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

type Severity = 'high' | 'medium' | 'low';
type Issue = {
  id: string;
  productId: string;
  productTitle: string;
  type: 'title' | 'tags' | 'description' | 'seo';
  severity: Severity;
  message: string;
};

const severityClass: Record<Severity, string> = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-blue-600',
};

const scanProduct = (p: Product): Issue[] => {
  const issues: Issue[] = [];
  const title = String(p.title || '');
  const description = String(p.description || '');
  const tags = Array.isArray(p.tags) ? p.tags : [];

  if (title.length < 90) {
    issues.push({ id: `${p.id}-title-short`, productId: p.id, productTitle: p.title, type: 'title', severity: 'high', message: 'Title is short (target 90-140 chars).' });
  } else if (title.length > 140) {
    issues.push({ id: `${p.id}-title-long`, productId: p.id, productTitle: p.title, type: 'title', severity: 'high', message: 'Title exceeds 140 chars.' });
  }

  const duplicateTags = tags.length !== new Set(tags.map(t => t.toLowerCase().trim())).size;
  const invalidTagLen = tags.some(t => String(t).trim().length > 20 || String(t).trim().length === 0);
  if (tags.length < 10 || tags.length > 13 || duplicateTags || invalidTagLen) {
    issues.push({ id: `${p.id}-tags`, productId: p.id, productTitle: p.title, type: 'tags', severity: 'high', message: 'Tags need optimization (count/duplicates/length).' });
  }

  if (description.length < 300) {
    issues.push({ id: `${p.id}-desc-short`, productId: p.id, productTitle: p.title, type: 'description', severity: 'medium', message: 'Description is short (target 300+ chars).' });
  }

  if ((p.seoScore || 0) < 85) {
    issues.push({ id: `${p.id}-seo`, productId: p.id, productTitle: p.title, type: 'seo', severity: 'low', message: 'SEO score is below target (85+).' });
  }

  return issues;
};

const AutopilotPage: React.FC = () => {
  const { products, settings, updateSettings, runFullOptimization, showToast } = useAppContext();
  const { t } = useTranslation();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | Issue['type']>('all');
  const [fixPreview, setFixPreview] = useState<Record<string, { old: Pick<Product, 'title' | 'description' | 'tags'>; next: Pick<Product, 'title' | 'description' | 'tags'>; gate: { beforeScore: number; afterScore: number; beforeRank: number; afterRank: number } }>>({});

  const stats = useMemo(() => ({
    totalProducts: products.length,
    totalIssues: issues.length,
    high: issues.filter(i => i.severity === 'high').length,
    byType: {
      title: issues.filter(i => i.type === 'title').length,
      tags: issues.filter(i => i.type === 'tags').length,
      description: issues.filter(i => i.type === 'description').length,
      seo: issues.filter(i => i.type === 'seo').length,
    }
  }), [products.length, issues]);

  const visibleIssues = useMemo(() => (
    filterType === 'all' ? issues : issues.filter(i => i.type === filterType)
  ), [issues, filterType]);

  const runScan = async () => {
    setIsScanning(true);
    try {
      const allIssues = products.flatMap(scanProduct);
      setIssues(allIssues);
    } finally {
      setIsScanning(false);
    }
  };

  const fixIssue = async (issue: Issue) => {
    const product = products.find(p => p.id === issue.productId);
    if (!product) return;
    setFixingIssueId(issue.id);
    try {
      const before = {
        title: product.title,
        description: product.description,
        tags: Array.isArray(product.tags) ? product.tags : [],
      };

      const beforeCmp = await compareSeoWithCompetitors({
        listing_id: product.listing_id || product.id,
        title: before.title,
        description: before.description,
        tags: before.tags,
      });

      const optimized = await runFullOptimization(product);
      const after = {
        title: optimized.title || before.title,
        description: optimized.description || before.description,
        tags: optimized.tags?.length ? optimized.tags : before.tags,
      };

      const afterCmp = await compareSeoWithCompetitors({
        listing_id: product.listing_id || product.id,
        title: after.title,
        description: after.description,
        tags: after.tags,
      });

      const titleValid = after.title.length >= 90 && after.title.length <= 140;
      const tagsValid = after.tags.length >= 10 && after.tags.length <= 13 && after.tags.every(t => String(t).trim().length > 0 && String(t).trim().length <= 20);
      const descValid = after.description.length >= 300;
      const scoreDelta = afterCmp.yourScore - beforeCmp.yourScore;
      const rankDelta = beforeCmp.yourRank - afterCmp.yourRank; // positive means better rank
      const balancedPass = (scoreDelta >= 0 && rankDelta >= 0) || (scoreDelta >= -1 && rankDelta > 0);

      if (!(titleValid && tagsValid && descValid && balancedPass)) {
        showToast({
          tKey: 'toast_generic_error_with_message',
          options: { message: `Quality Gate rejected (balanced mode): before score/rank ${beforeCmp.yourScore}/#${beforeCmp.yourRank} -> after ${afterCmp.yourScore}/#${afterCmp.yourRank}.` },
          type: 'error'
        });
        return;
      }

      setFixPreview(prev => ({
        ...prev,
        [product.id]: {
          old: before,
          next: after,
          gate: {
            beforeScore: beforeCmp.yourScore,
            afterScore: afterCmp.yourScore,
            beforeRank: beforeCmp.yourRank,
            afterRank: afterCmp.yourRank,
          }
        }
      }));
      setIssues(prev => prev.filter(i => i.productId !== issue.productId));
      showToast({ tKey: 'toast_metadata_generated', type: 'success' });
    } finally {
      setFixingIssueId(null);
    }
  };

  const saveFixToEtsy = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    const preview = fixPreview[productId];
    if (!product || !preview) return;

    const listingId = (product.listing_id || product.id) as string;
    setSavingProductId(productId);
    try {
      await updateListing(listingId, {
        title: preview.next.title,
        description: preview.next.description,
        tags: preview.next.tags,
      } as any);
      showToast({ tKey: 'toast_product_published', type: 'success' });
      setFixPreview(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    } catch (e: any) {
      showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
    } finally {
      setSavingProductId(null);
    }
  };

  const handleAutopilotToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({
      ...settings,
      autopilot: {
        ...settings.autopilot,
        enabled: e.target.checked,
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('autopilot_page_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Phase 1: Scan listings, detect SEO issues, and apply one-click fixes.</p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
          <Bot className="w-5 h-5 me-2 text-purple-500" />
          Autopilot Status
        </h3>
        <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">{settings.autopilot.enabled ? 'Enabled' : 'Disabled'}</p>
            <p className="text-sm text-green-700 dark:text-green-400">Products: {stats.totalProducts} | Issues found: {stats.totalIssues} (High: {stats.high})</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">Title: {stats.byType.title} | Tags: {stats.byType.tags} | Description: {stats.byType.description} | SEO: {stats.byType.seo}</p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" id="autopilot-toggle" checked={settings.autopilot.enabled} onChange={handleAutopilotToggle} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
            <label htmlFor="autopilot-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"></label>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={runScan} disabled={isScanning} className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-60">
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Scan Shop
          </button>
        </div>
      </Card>

      {Object.keys(fixPreview).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Fix Preview (before saving to Etsy)</h3>
          <div className="space-y-4">
            {Object.entries(fixPreview).map(([productId, preview]) => {
              const p = products.find(x => x.id === productId);
              return (
                <div key={productId} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">{p?.title || productId}</p>
                  <p className="text-xs text-gray-500 mt-1">Title (new): {preview.next.title}</p>
                  <p className="text-xs text-gray-500">Tags (new): {preview.next.tags.join(', ')}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Quality Gate: Score {preview.gate.beforeScore} → {preview.gate.afterScore} | Rank #{preview.gate.beforeRank} → #{preview.gate.afterRank}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveFixToEtsy(productId)}
                      disabled={savingProductId === productId}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
                    >
                      {savingProductId === productId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingProductId === productId ? 'Saving...' : 'Save to Etsy'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 me-2 text-yellow-500" /> Detected Issues
        </h3>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {(['all', 'title', 'tags', 'description', 'seo'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              className={`px-2 py-1 rounded border ${filterType === k ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}
            >
              {k === 'all' ? 'All' : k}
            </button>
          ))}
        </div>

        {issues.length === 0 ? (
          <p className="text-sm text-gray-500">No issues yet. Run Scan Shop.</p>
        ) : visibleIssues.length === 0 ? (
          <p className="text-sm text-gray-500">No issues in this filter.</p>
        ) : (
          <div className="space-y-3">
            {visibleIssues.map(issue => (
              <div key={issue.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{issue.productTitle}</p>
                    <p className={`text-xs uppercase ${severityClass[issue.severity]}`}>{issue.severity}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{issue.message}</p>
                  </div>
                  <button
                    onClick={() => fixIssue(issue)}
                    disabled={fixingIssueId === issue.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
                  >
                    {fixingIssueId === issue.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                    {fixingIssueId === issue.id ? 'Fixing...' : 'Fix'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AutopilotPage;
