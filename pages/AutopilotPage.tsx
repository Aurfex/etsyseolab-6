import React, { useMemo, useState } from 'react';
import { Bot, AlertTriangle, Loader2, Search, Wrench, Save, Zap, RotateCcw, X } from 'lucide-react';
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

  // Loosen requirements for demo visibility
  if (title.length < 110) {
    issues.push({ id: `${p.id}-title-short`, productId: p.id, productTitle: p.title, type: 'title', severity: 'high', message: 'Title is below recommended length (110-140 chars).' });
  } else if (title.length > 140) {
    issues.push({ id: `${p.id}-title-long`, productId: p.id, productTitle: p.title, type: 'title', severity: 'high', message: 'Title exceeds Etsy limit (140 chars).' });
  }

  const tagCount = tags.length;
  if (tagCount < 13) {
    issues.push({ id: `${p.id}-tags-count`, productId: p.id, productTitle: p.title, type: 'tags', severity: 'medium', message: `Only ${tagCount}/13 tags used. Etsy recommends using all 13 tags.` });
  }

  if (description.length < 500) {
    issues.push({ id: `${p.id}-desc-short`, productId: p.id, productTitle: p.title, type: 'description', severity: 'low', message: 'Description could be more detailed (target 500+ chars).' });
  }

  if ((p.seoScore || 0) < 90) {
    issues.push({ id: `${p.id}-seo`, productId: p.id, productTitle: p.title, type: 'seo', severity: 'medium', message: `SEO score (${p.seoScore}) is below optimum (90+).` });
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
  const [fixPreview, setFixPreview] = useState<Record<string, { old: Pick<Product, 'title' | 'description' | 'tags'>; next: Pick<Product, 'title' | 'description' | 'tags'>; gate: { beforeScore: number; afterScore: number; beforeRank: number; afterRank: number; passed: boolean; reason?: string } }>>({});

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
      showToast({ tKey: 'toast_generic_success_with_message', options: { message: `Scan complete! Found ${allIssues.length} issues.` }, type: 'success' });
    } finally {
      setIsScanning(false);
    }
  };

  const fixAllHighSeverity = async () => {
    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length === 0) return;
    
    showToast({ tKey: 'toast_generic_info_with_message', options: { message: `Starting bulk fix for ${highIssues.length} products...` }, type: 'info' });
    
    // We process them sequentially to avoid rate limits
    for (const issue of highIssues) {
      await fixIssue(issue);
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

      const passed = titleValid && tagsValid && descValid && balancedPass;
      const reason = passed
        ? undefined
        : `Gate warning: before ${beforeCmp.yourScore}/#${beforeCmp.yourRank} -> after ${afterCmp.yourScore}/#${afterCmp.yourRank}`;

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
            passed,
            reason,
          }
        }
      }));
      setIssues(prev => prev.filter(i => i.productId !== issue.productId));
      if (!passed) {
        showToast({ tKey: 'toast_generic_error_with_message', options: { message: `${reason}. Preview generated; review and save manually if acceptable.` }, type: 'info' });
      } else {
        showToast({ tKey: 'toast_metadata_generated', type: 'success' });
      }
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

  const cancelFix = (productId: string) => {
    const p = products.find(x => x.id === productId);
    if (p) {
      const productIssues = scanProduct(p);
      setIssues(prev => [...prev, ...productIssues]);
    }
    setFixPreview(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const regenerateFix = async (productId: string) => {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const tempIssue: Issue = {
      id: `${p.id}-regen`,
      productId: p.id,
      productTitle: p.title,
      type: 'seo',
      severity: 'medium',
      message: 'Regenerating optimization...'
    };
    await fixIssue(tempIssue);
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
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auto_phase_desc')}</p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
          <Bot className="w-5 h-5 me-2 text-[#F1641E]" />
          {t('auto_status_title')}
        </h3>
        <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">{settings.autopilot.enabled ? t('auto_status_enabled') : t('auto_status_disabled')}</p>
            <p className="text-sm text-green-700 dark:text-green-400">{t('auto_stats_products')}: {stats.totalProducts} | {t('auto_stats_issues')}: {stats.totalIssues} ({t('auto_stats_high')}: {stats.high})</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1 uppercase tracking-tighter">{t('auto_stats_title')}: {stats.byType.title} | {t('auto_stats_tags')}: {stats.byType.tags} | {t('auto_stats_description')}: {stats.byType.description} | {t('auto_stats_seo')}: {stats.byType.seo}</p>
          </div>
          <button
            onClick={() => handleAutopilotToggle({ target: { checked: !settings.autopilot.enabled } } as any)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F1641E] focus:ring-offset-2 dark:focus:ring-offset-gray-900 mr-2 ${settings.autopilot.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={settings.autopilot.enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autopilot.enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={runScan} disabled={isScanning} className="inline-flex items-center gap-2 bg-[#F1641E] text-white px-4 py-2 rounded-lg disabled:opacity-60">
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {t('auto_btn_scan')}
          </button>
          
          {issues.some(i => i.severity === 'high') && (
            <button 
              onClick={fixAllHighSeverity} 
              disabled={isScanning || fixingIssueId !== null} 
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {fixingIssueId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {t('auto_btn_fix_high')}
            </button>
          )}
        </div>
      </Card>

      {Object.keys(fixPreview).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('auto_preview_title')}</h3>
          <div className="space-y-4">
            {Object.entries(fixPreview).map(([productId, preview]) => {
              const p = products.find(x => x.id === productId);
              return (
                <div key={productId} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">{p?.title || productId}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('auto_preview_title_new')}: {preview.next.title}</p>
                  <p className="text-xs text-gray-500">{t('auto_preview_tags_new')}: {preview.next.tags.join(', ')}</p>
                  <p className={`text-xs ${preview.gate.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {t('auto_quality_gate', { beforeScore: preview.gate.beforeScore, afterScore: preview.gate.afterScore, beforeRank: preview.gate.beforeRank, afterRank: preview.gate.afterRank })} {preview.gate.passed ? '✓' : '⚠'}
                  </p>
                  {!preview.gate.passed && preview.gate.reason && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">{preview.gate.reason}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveFixToEtsy(productId)}
                      disabled={savingProductId === productId}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
                    >
                      {savingProductId === productId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingProductId === productId ? t('opt_btn_saving') : t('auto_btn_save')}
                    </button>

                    <button
                      onClick={() => regenerateFix(productId)}
                      disabled={fixingIssueId !== null || savingProductId !== null}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
                      title="Regenerate AI suggestion"
                    >
                      {fixingIssueId === `${productId}-regen` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      {t('auto_btn_regenerate')}
                    </button>

                    <button
                      onClick={() => cancelFix(productId)}
                      disabled={savingProductId !== null}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-60"
                    >
                      <X className="w-4 h-4" />
                      {t('auto_btn_cancel')}
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
          <AlertTriangle className="w-5 h-5 me-2 text-yellow-500" /> {t('auto_issues_title')}
        </h3>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {(['all', 'title', 'tags', 'description', 'seo'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${filterType === k ? 'bg-[#F1641E] text-white border-purple-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {k === 'all' ? t('auto_filter_all') : t(`auto_filter_${k}`)}
            </button>
          ))}
        </div>

        {issues.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('auto_no_issues')}</p>
        ) : visibleIssues.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('auto_no_filter_issues')}</p>
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
                    {fixingIssueId === issue.id ? t('add_product_btn_analyzing') : t('auto_btn_fix')}
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
