import React, { useState } from 'react';
import { Sparkles, Copy, Info, Loader2 } from 'lucide-react';
import { OptimizationResult, Product } from '../types.ts';
import { useAppContext } from '../contexts/AppContext.tsx';
import { useTranslation } from '../contexts/LanguageContext.tsx';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const OptimizerPage: React.FC = () => {
  const { products, runFullOptimization, showToast } = useAppContext();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizationResult | null>(null);

  // For demonstration, we always optimize the first product.
  // In a real app, this would come from a selector.
  const productToOptimize: Product | undefined = products[0];

  const handleOptimize = async () => {
      if (!productToOptimize) {
          showToast({ tKey: 'optimizer_error_no_product', type: 'error'});
          return;
      }
      setIsLoading(true);
      setError(null);
      try {
          const result = await runFullOptimization(productToOptimize);
          setOptimizedData(result);
      } catch (err: any) {
          setError(err.message);
          showToast({ tKey: 'optimizer_toast_optimization_failed', options: { error: err.message }, type: 'error' });
      } finally {
          setIsLoading(false);
      }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ tKey: 'optimizer_toast_copied_to_clipboard', type: 'success' });
  }

  if (!productToOptimize) {
      return <Card>{t('optimizer_no_product')}</Card>
  }

  const originalScore = productToOptimize.seoScore;
  const optimizedScore = optimizedData ? 89 : 0; // Static for demo after optimization

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('optimizer_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('optimizer_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-5 h-5 me-2 text-purple-500" />
            {t('optimizer_title_suggestions_title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('optimizer_title_suggestions_subtitle')}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('optimizer_current_label')}</label>
              <div className="mt-1 flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">{productToOptimize.title}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('optimizer_ai_variants_label')}</label>
              <div className="mt-1 flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg group">
                <span className="text-sm text-gray-900 dark:text-gray-200">{optimizedData?.title || t('optimizer_placeholder_title')}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyToClipboard(optimizedData?.title || "")}>
                  <Copy className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('optimizer_seo_score_comparison_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('optimizer_seo_score_comparison_subtitle')}</p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">{t('optimizer_original_label')}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-red-400 h-2.5 rounded-full" style={{ width: `${originalScore}%` }}></div>
              </div>
              <span className="w-10 text-right text-sm font-bold text-red-500">{originalScore}%</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">{t('optimizer_ai_optimized_label')}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className={`${optimizedData ? 'bg-green-500' : 'bg-gray-400'} h-2.5 rounded-full transition-all duration-500`} style={{ width: optimizedData ? `${optimizedScore}%` : '0%' }}></div>
              </div>
              <span className={`w-10 text-right text-sm font-bold ${optimizedData ? 'text-green-500' : 'text-gray-500'}`}>{optimizedData ? `${optimizedScore}%` : t('n_a')}</span>
            </div>
          </div>
          <button 
            onClick={handleOptimize}
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>{isLoading ? t('optimizer_optimizing_button') : t('optimizer_optimize_button')}</span>
          </button>
        </Card>
      </div>

      <Card>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[t('optimizer_tab_title'), t('optimizer_tab_alt_text'), t('optimizer_tab_tags')].map((tab, i) => (
            <button key={tab} className={`px-4 py-2 text-sm font-medium ${i === 0 ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="pt-6">
          <label className="text-sm font-medium text-gray-900 dark:text-white">{t('optimizer_product_title_label')}</label>
          <div className="mt-2 relative">
            <input type="text" value={optimizedData?.title || t('optimizer_placeholder_product_title')} readOnly className="w-full bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg pr-10 text-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700 border" />
            <button onClick={() => handleCopyToClipboard(optimizedData?.title || "")}>
              <Copy className="absolute right-3 top-3 w-4 h-4 text-gray-400 cursor-pointer" />
            </button>
          </div>
          <div className="mt-4 flex items-start bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 me-3 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">{t('optimizer_ai_insight_prefix')}</span> {t('optimizer_ai_insight_text')} {t('optimizer_ai_insight_score_prefix')} {optimizedData ? '89/100' : t('n_a')}
            </p>
          </div>
           {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
        </div>
      </Card>
    </div>
  );
};

export default OptimizerPage;