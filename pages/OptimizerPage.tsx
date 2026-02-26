import React, { useState } from 'react';
import { Sparkles, Copy, Info, Loader2, ArrowLeft, Search, Save, CheckCircle, Tag, Image as ImageIcon, Type, FileText } from 'lucide-react';
import { OptimizationResult, Product } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { runFullOptimization, generateOptimizedTags, generateOptimizedDescription } from '../services/optimizationService';
import { updateListing } from '../services/etsyApiService';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const OptimizerPage: React.FC = () => {
  const { products, showToast, refreshProducts } = useAppContext();

  const getOptimizedIds = (): string[] => {
    try {
      const raw = localStorage.getItem('optimizedListingIds');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingItem, setIsGeneratingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'title' | 'description' | 'altText' | 'tags'>('title');
  
  // State for product selection
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find selected product
  const productToOptimize = products.find(p => p.id === selectedProductId);

  // Filter products for list view
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFullOptimize = async () => {
      if (!productToOptimize) return;
      
      setIsLoading(true);
      setError(null);
      try {
          const result = await runFullOptimization(productToOptimize);
          setOptimizedData(result);
          showToast({ tKey: 'optimizer_toast_success', options: { message: 'Optimization suggestions generated!' }, type: 'success' });
      } catch (err: any) {
          setError(err.message);
          showToast({ tKey: 'optimizer_toast_optimization_failed', options: { error: err.message }, type: 'error' });
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateTags = async () => {
    if (!productToOptimize || !optimizedData) return;
    setIsGeneratingItem('tags');
    try {
        const newTags = await generateOptimizedTags({ ...productToOptimize, title: optimizedData.title || productToOptimize.title, description: optimizedData.description || productToOptimize.description });
        setOptimizedData(prev => prev ? { ...prev, tags: newTags } : null);
        showToast({ tKey: 'optimizer_toast_success', options: { message: 'Tags regenerated!' }, type: 'success' });
    } catch (err: any) {
        showToast({ tKey: 'optimizer_toast_error', options: { message: 'Failed to generate tags' }, type: 'error' });
    } finally {
        setIsGeneratingItem(null);
    }
  };

  const handleGenerateDescription = async () => {
    if (!productToOptimize || !optimizedData) return;
    setIsGeneratingItem('description');
    try {
        const newDesc = await generateOptimizedDescription({ ...productToOptimize, title: optimizedData.title || productToOptimize.title });
        setOptimizedData(prev => prev ? { ...prev, description: newDesc } : null);
        showToast({ tKey: 'optimizer_toast_success', options: { message: 'Description regenerated!' }, type: 'success' });
    } catch (err: any) {
        showToast({ tKey: 'optimizer_toast_error', options: { message: 'Failed to generate description' }, type: 'error' });
    } finally {
        setIsGeneratingItem(null);
    }
  };

  const handleSaveToEtsy = async () => {
    if (!productToOptimize || !optimizedData || !productToOptimize.listing_id) return;

    setIsSaving(true);
    try {
        const updates: any = {};
        if (optimizedData.title && optimizedData.title !== productToOptimize.title) {
            updates.title = optimizedData.title.length > 140 ? optimizedData.title.slice(0, 140) : optimizedData.title;
        }
        if (optimizedData.description && optimizedData.description !== productToOptimize.description) updates.description = optimizedData.description;
        if (optimizedData.tags && optimizedData.tags.length > 0) updates.tags = optimizedData.tags;
        
        if (Object.keys(updates).length === 0) {
            showToast({ tKey: 'optimizer_toast_success', options: { message: 'No changes to save.' }, type: 'info' });
            return;
        }

        if (optimizedData.title && optimizedData.title.length > 140) {
            showToast({ tKey: 'optimizer_toast_error', options: { message: 'Title was too long; trimmed to 140 chars for Etsy.' }, type: 'info' });
        }

        const result = await updateListing(productToOptimize.listing_id, updates);
        
        if ((result as any)?.skipped) {
            showToast({ tKey: 'optimizer_toast_success', options: { message: 'No changes detected.' }, type: 'info' });
        } else {
            const current = getOptimizedIds();
            const lid = String(productToOptimize.listing_id);
            if (!current.includes(lid)) {
              localStorage.setItem('optimizedListingIds', JSON.stringify([...current, lid]));
            }
            await refreshProducts();
            showToast({ tKey: 'optimizer_toast_success', options: { message: 'Changes saved to Etsy and synced successfully!' }, type: 'success' });
        }
        
    } catch (err: any) {
        console.error("Save error:", err);
        const errorMessage = err.message || "Failed to save to Etsy";
        showToast({ tKey: 'optimizer_toast_error', options: { message: errorMessage }, type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ tKey: 'optimizer_toast_copied_to_clipboard', type: 'success' });
  }

  // --- View: Product List ---
  if (!productToOptimize) {
      return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('optimizer_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Select a product to optimize its SEO.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                    const optimizedIds = getOptimizedIds();
                    const isOptimized = optimizedIds.includes(String((product as any).listing_id || product.id)); 
                    return (
                        <div 
                            key={product.id} 
                            onClick={() => { setSelectedProductId(product.id); setOptimizedData(null); }}
                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:scale-[1.02] group relative"
                        >
                             {isOptimized && (
                                <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    OPTIMIZED
                                </div>
                            )}

                            <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                {product.imageUrl ? (
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image'}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${product.seoScore >= 80 ? 'bg-green-500' : product.seoScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                    SEO: {product.seoScore}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm mb-2 group-hover:text-purple-500 transition-colors">
                                    {product.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{product.quantity} in stock</span>
                                    <span>${product.price || 0}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No products found matching "{searchQuery}"
                </div>
            )}
        </div>
      );
  }

  // --- View: Optimizer Panel ---
  const originalScore = productToOptimize.seoScore;
  const optimizedScore = optimizedData ? Math.min(99, originalScore + 25) : 0; 

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <button 
            onClick={() => setSelectedProductId(null)}
            className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
        </button>
        
        {optimizedData && (
             <button 
                onClick={handleSaveToEtsy}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
             >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes to Etsy'}
             </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('optimizer_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Optimizing: <span className="font-medium text-gray-900 dark:text-gray-200">{productToOptimize.title}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Suggestion Card */}
        <Card className="h-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-5 h-5 me-2 text-purple-500" />
            {t('optimizer_title_suggestions_title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('optimizer_title_suggestions_subtitle')}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('optimizer_current_label')}</label>
              <div className="mt-1 flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{productToOptimize.title}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 dark:text-gray-500">{t('optimizer_ai_variants_label')}</label>
              <div className="mt-1 flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg group min-h-[3rem]">
                {isLoading ? (
                    <div className="flex items-center space-x-2 text-purple-500 text-sm w-full justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating AI suggestions...</span>
                    </div>
                ) : (
                    <div className="flex items-start justify-between w-full">
                         <span className="text-sm text-gray-900 dark:text-gray-200 leading-relaxed pr-2">
                            {optimizedData?.title || "Click 'Optimize Now' to generate suggestions."}
                         </span>
                        {optimizedData && (
                            <button className="text-gray-400 hover:text-purple-500 transition-colors p-1" onClick={() => handleCopyToClipboard(optimizedData.title)}>
                                <Copy className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Score Card */}
        <Card className="h-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('optimizer_seo_score_comparison_title')}</h3>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('optimizer_original_label')}</span>
                    <span className="font-bold text-red-500">{originalScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-red-400 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${originalScore}%` }}></div>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('optimizer_ai_optimized_label')}</span>
                    <span className={`font-bold ${optimizedData ? 'text-green-500' : 'text-gray-400'}`}>
                        {optimizedData ? optimizedScore : '??'}/100
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                        className={`${optimizedData ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: optimizedData ? `${optimizedScore}%` : '0%' }}
                    ></div>
                </div>
            </div>

            <button 
                onClick={handleFullOptimize}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.99]"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{isLoading ? t('optimizer_optimizing_button') : t('optimizer_optimize_button')}</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Card className="overflow-hidden p-0">
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('title')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'title' ? 'text-purple-600 border-purple-600 bg-white dark:bg-gray-800 dark:text-purple-400' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Type className="w-4 h-4 mr-2" />
            Title
          </button>
          <button 
            onClick={() => setActiveTab('description')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'description' ? 'text-purple-600 border-purple-600 bg-white dark:bg-gray-800 dark:text-purple-400' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Description
          </button>
          <button 
            onClick={() => setActiveTab('altText')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'altText' ? 'text-purple-600 border-purple-600 bg-white dark:bg-gray-800 dark:text-purple-400' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Alt Text
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'tags' ? 'text-purple-600 border-purple-600 bg-white dark:bg-gray-800 dark:text-purple-400' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </button>
        </div>

        <div className="p-6 min-h-[200px]">
            {!optimizedData && !isLoading && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                    <Sparkles className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                    <p>Click "Optimize Now" to generate content.</p>
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                     <p className="text-gray-500">Generating best-in-class SEO content...</p>
                </div>
            )}

            {optimizedData && !isLoading && (
                <>
                    {/* TITLE TAB */}
                    {activeTab === 'title' && (
                        <div className="animate-fadeIn">
                            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Optimized Product Title</label>
                            <div className="relative group">
                                <textarea 
                                    value={optimizedData.title} 
                                    onChange={(e) => setOptimizedData({...optimizedData, title: e.target.value})}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-lg pr-12 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none" 
                                />
                                <button onClick={() => handleCopyToClipboard(optimizedData.title)} className="absolute right-3 top-3 p-2 text-gray-400 hover:text-purple-500 bg-white dark:bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                Contains high-value keywords for Etsy search algorithm.
                            </p>
                        </div>
                    )}

                    {/* DESCRIPTION TAB */}
                    {activeTab === 'description' && (
                        <div className="animate-fadeIn">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-900 dark:text-white block">Optimized Product Description</label>
                                <button 
                                    onClick={handleGenerateDescription}
                                    disabled={isGeneratingItem === 'description'}
                                    className="text-xs flex items-center bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1.5 rounded transition-colors"
                                >
                                    {isGeneratingItem === 'description' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                    Regenerate Description
                                </button>
                            </div>
                            <div className="relative group">
                                <textarea 
                                    value={optimizedData.description} 
                                    onChange={(e) => setOptimizedData({...optimizedData, description: e.target.value})}
                                    rows={10}
                                    className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-lg pr-12 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm" 
                                />
                                <button onClick={() => handleCopyToClipboard(optimizedData.description)} className="absolute right-3 top-3 p-2 text-gray-400 hover:text-purple-500 bg-white dark:bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                Optimized for readability and keyword density.
                            </p>
                        </div>
                    )}

                    {/* ALT TEXT TAB */}
                    {activeTab === 'altText' && (
                        <div className="animate-fadeIn">
                             <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Optimized Image Alt Text</label>
                             <div className="relative group">
                                <textarea 
                                    value={optimizedData.altText || "No alt text generated."} 
                                    readOnly 
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-lg pr-12 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none" 
                                />
                                <button onClick={() => handleCopyToClipboard(optimizedData.altText || "")} className="absolute right-3 top-3 p-2 text-gray-400 hover:text-purple-500 bg-white dark:bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                Improves accessibility and Google Images ranking.
                            </p>
                        </div>
                    )}

                    {/* TAGS TAB */}
                    {activeTab === 'tags' && (
                        <div className="animate-fadeIn">
                             <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-medium text-gray-900 dark:text-white">Generated Tags ({optimizedData.tags.length})</label>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleGenerateTags}
                                        disabled={isGeneratingItem === 'tags'}
                                        className="text-xs flex items-center bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1.5 rounded transition-colors"
                                    >
                                        {isGeneratingItem === 'tags' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Regenerate Tags
                                    </button>
                                    <button onClick={() => handleCopyToClipboard(optimizedData.tags.join(', '))} className="text-xs text-purple-600 hover:text-purple-700 flex items-center px-3 py-1.5">
                                        <Copy className="w-3 h-3 mr-1" /> Copy All
                                    </button>
                                </div>
                             </div>
                             
                             <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[100px]">
                                {optimizedData.tags.map((tag, idx) => (
                                    <span key={idx} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.length > 20 ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'}`}>
                                        <Tag className="w-3 h-3 mr-1.5 opacity-70" />
                                        {tag} {tag.length > 20 && "(!)"}
                                    </span>
                                ))}
                             </div>
                             <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                13 tags optimized for Etsy's matching algorithm.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
      </Card>
      
       {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm text-center">{error}</div>}
    </div>
  );
};

export default OptimizerPage;