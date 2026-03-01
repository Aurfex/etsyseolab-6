import React, { useMemo, useState } from 'react';
import { Search, Tag, FileText, LayoutGrid, Sparkles, Loader2, Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { compareSeoWithCompetitors, updateListing } from '../services/etsyApiService';
import { useTranslation } from '../contexts/LanguageContext';
import { Product } from '../types';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const AnalysisItem: React.FC<{item: string, value: string}> = ({item, value}) => (
  <div className="flex justify-between items-center text-sm py-1.5">
    <span className="text-gray-600 dark:text-gray-300">{item}</span>
    <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const ProgressBar: React.FC<{label: string, value: number}> = ({label, value}) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div className="bg-purple-600 h-2 rounded-full" style={{width: `${value}%`}}></div>
    </div>
  </div>
);

const CompetitorRadarPage: React.FC = () => {
  const { products, runFullOptimization, showToast } = useAppContext();
  const { t } = useTranslation();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [compareData, setCompareData] = useState<{
    yourScore: number;
    yourRank: number;
    totalCompared: number;
    avgTopScore: number;
    topCompetitorTitle: string | null;
    recommendations: string[];
  } | null>(null);

  const [draft, setDraft] = useState<{ old: Pick<Product, 'title' | 'description' | 'tags'>; next: Pick<Product, 'title' | 'description' | 'tags'> } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId) || null, [products, selectedProductId]);

  const handleAnalyze = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      const data = await compareSeoWithCompetitors({
        listing_id: selectedProduct.listing_id || selectedProduct.id,
        title: selectedProduct.title,
        description: selectedProduct.description,
        tags: selectedProduct.tags,
      });
      setCompareData(data);
      setDraft(null);
    } catch (e: any) {
      showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestionDraft = async () => {
    if (!selectedProduct) return;
    setIsApplying(true);
    try {
      const oldData = {
        title: selectedProduct.title,
        description: selectedProduct.description,
        tags: selectedProduct.tags || [],
      };
      const next = await runFullOptimization(selectedProduct);
      setDraft({
        old: oldData,
        next: {
          title: next.title || oldData.title,
          description: next.description || oldData.description,
          tags: next.tags?.length ? next.tags : oldData.tags,
        }
      });
      showToast({ tKey: 'toast_metadata_generated', type: 'success' });
    } catch (e: any) {
      showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveToEtsy = async () => {
    if (!selectedProduct || !draft) return;
    setIsSaving(true);
    try {
      await updateListing(selectedProduct.listing_id || selectedProduct.id, {
        title: draft.next.title,
        description: draft.next.description,
        tags: draft.next.tags,
      } as any);
      showToast({ tKey: 'toast_product_published', type: 'success' });
    } catch (e: any) {
      showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('competitor_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyze one of your listings vs competitors, then apply draft fixes and save to Etsy.</p>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-1">
          <Search className="w-5 h-5 me-2 text-purple-500" />
          Competitor Intelligence
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pick your product first, then run competitor comparison.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="md:col-span-3 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg p-3"
          >
            <option value="">Select your product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button onClick={handleAnalyze} disabled={isLoading || !selectedProductId} className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze'}
          </button>
        </div>
      </Card>

      {compareData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                <Tag className="w-5 h-5 me-2" /> SEO Snapshot
              </h3>
              <div className="space-y-2">
                <AnalysisItem item="Your score" value={`${compareData.yourScore}/100`} />
                <AnalysisItem item="Your rank" value={`#${compareData.yourRank} of ${compareData.totalCompared}`} />
                <AnalysisItem item="Top avg" value={`${compareData.avgTopScore}`} />
              </div>
            </Card>
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                <FileText className="w-5 h-5 me-2" /> Top Competitor
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {compareData.topCompetitorTitle || 'N/A'}
              </div>
            </Card>
            <Card className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                <LayoutGrid className="w-5 h-5 me-2" /> Recommendation Strength
              </h3>
              <div className="space-y-4">
                <ProgressBar label="Actionable recommendations" value={Math.min(100, compareData.recommendations.length * 20)} />
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
              <Sparkles className="w-5 h-5 me-2 text-green-500" /> Recommendations
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc ps-5">
              {compareData.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <button onClick={handleApplySuggestionDraft} disabled={isApplying || !selectedProduct} className="w-full mt-4 bg-indigo-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{isApplying ? 'Creating draft...' : 'Apply Suggested Draft'}</span>
            </button>
          </Card>
        </>
      )}

      {draft && selectedProduct && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Draft Preview</h3>
          <p className="text-xs text-gray-500 mb-2">Old vs New (you decide, then save to Etsy)</p>
          <div className="space-y-3 text-sm">
            <div><span className="font-semibold">Old title:</span> {draft.old.title}</div>
            <div><span className="font-semibold">New title:</span> {draft.next.title}</div>
            <div><span className="font-semibold">Old tags:</span> {draft.old.tags.join(', ')}</div>
            <div><span className="font-semibold">New tags:</span> {draft.next.tags.join(', ')}</div>
          </div>
          <button onClick={handleSaveToEtsy} disabled={isSaving} className="w-full mt-4 bg-emerald-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-colors disabled:opacity-60">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{isSaving ? 'Saving...' : 'Save to Etsy'}</span>
          </button>
        </Card>
      )}
    </div>
  );
};

export default CompetitorRadarPage;
