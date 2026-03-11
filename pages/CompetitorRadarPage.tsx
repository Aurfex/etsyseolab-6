import React, { useMemo, useState } from 'react';
import { Search, Tag, FileText, LayoutGrid, Sparkles, Loader2, Save, Radar, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Product } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const AnalysisItem: React.FC<{item: string, value: string, color?: string}> = ({item, value, color = "text-gray-900 dark:text-white"}) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
    <span className="text-gray-500 dark:text-gray-400">{item}</span>
    <span className={`font-bold ${color}`}>{value}</span>
  </div>
);

const CompetitorRadarPage: React.FC = () => {
  const { products, showToast } = useAppContext();
  const { t } = useTranslation();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showFixPreview, setShowFixPreview] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId) || null, [products, selectedProductId]);

  // Mock comparison data for the chart
  const chartData = useMemo(() => [
    { name: 'Your SEO', score: isOptimized ? 91 : 62, color: '#8B5CF6' },
    { name: 'Top 10 Avg', score: 88, color: '#10B981' },
    { name: 'Best Match', score: 94, color: '#3B82F6' },
  ], [isOptimized]);

  const handleSaveToEtsyMock = () => {
    showToast({ 
      message: "Syncing optimization to Etsy API... (Demo Mode)", 
      type: 'success' 
    });
    setTimeout(() => {
      showToast({ message: "Listing updated successfully on Etsy!", type: 'success' });
      setIsOptimized(true);
      setShowFixPreview(false);
    }, 1500);
  };

  const handlePreviewFixes = () => {
    setShowFixPreview(true);
  };

  const handleStartAnalysis = () => {
    console.log("Analysis button clicked, product ID:", selectedProductId);
    if (!selectedProductId) {
      showToast({ message: "Please select a product first!", type: 'error' });
      return;
    }
    setIsAnalyzing(true);
    setShowAnalysis(false);
    setShowFixPreview(false);
    setIsOptimized(false);
    
    // Play a "Scanning" animation for 2.5 seconds
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowAnalysis(true);
      showToast({ message: "Competitor Intelligence gathered!", type: 'success' });
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Radar className="w-8 h-8 me-3 text-purple-500" />
            {t('competitor_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Deep-dive into competitor strategies and optimize your listing rank.</p>
        </div>
      </div>

      {/* STEP 1: SELECT PRODUCT */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Radar className="w-32 h-32 text-purple-500 animate-pulse" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-1">
          <Search className="w-5 h-5 me-2 text-purple-500" />
          Target Listing
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select which product you want to compare against the market leaders.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="md:col-span-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          >
            <option value="">Select your product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button 
            onClick={handleStartAnalysis} 
            disabled={isAnalyzing || !selectedProductId} 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
            {isAnalyzing ? 'Scanning...' : 'Run Intelligence'}
          </button>
        </div>
      </Card>

      {/* STEP 2: SHOW MOCK ANALYSIS */}
      {showAnalysis && selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
          {/* SEO Comparison Chart */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                SEO Competitiveness vs Top Sellers
            </h3>
            <div className="h-64 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip 
                             cursor={{fill: 'transparent'}}
                             contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: '#fff' }} 
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                    <Sparkles className="w-4 h-4 inline mr-1 mb-1" />
                    <strong>AI Insight:</strong> Your competitors are using more specific "long-tail" keywords in their first 40 characters. We recommend restructuring your title to lead with material and occasion.
                </p>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="flex flex-col gap-6">
            <Card>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Market Stats</h3>
                <div className="space-y-1">
                    <AnalysisItem item="Competitors Found" value="48" />
                    <AnalysisItem item="Avg Price in Niche" value="$42.50" />
                    <AnalysisItem item="Your Rank (Est.)" value="#14" color="text-amber-500" />
                    <AnalysisItem item="Search Demand" value="High" color="text-green-500" />
                </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-indigo-500/20">
                <h3 className="font-bold flex items-center mb-2">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Optimization Ready
                </h3>
                <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                    Our AI has identified 4 high-impact tags used by your top 3 competitors that you are currently missing.
                </p>
                <button 
                    onClick={handlePreviewFixes}
                    className="w-full py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors"
                >
                    Preview AI Fixes
                </button>
            </Card>
          </div>

          {/* AI Fix Preview Section */}
          {showFixPreview && (
            <Card className="lg:col-span-3 border-2 border-dashed border-purple-400 dark:border-purple-500/50 animate-pulse-subtle bg-purple-50/30 dark:bg-purple-900/5">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
                            AI Optimization Preview
                        </h3>
                        <p className="text-sm text-gray-500">Proposed changes to outperform the top 10% of competitors.</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                        +22% Rank Potential
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Title Optimization</h4>
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="text-xs text-red-500 line-through mb-1">{selectedProduct.title}</div>
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                Luxury {selectedProduct.title} - Minimalist Art Deco Wedding Jewelry
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Tag Replacements</h4>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded line-through">jewelry</span>
                            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded font-bold">minimalist wedding</span>
                            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded font-bold">art deco style</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleSaveToEtsyMock}
                        className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all flex items-center"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Apply & Save to Etsy
                    </button>
                </div>
            </Card>
          )}

          {/* Keyword Gap Analysis */}
          <Card className="lg:col-span-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Missing Keyword Opportunities</h3>
              <div className="flex flex-wrap gap-2">
                  {['minimalist wedding', 'art deco style', 'personalized bridesmaid', 'solid 14k gold', 'dainty everyday wear', 'luxury gift box'].map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium flex items-center border border-gray-200 dark:border-gray-600">
                          <AlertCircle className="w-3 h-3 mr-1.5 text-purple-500" />
                          {tag}
                      </span>
                  ))}
              </div>
          </Card>
        </div>
      )}

      {/* PHASE 2 PLACEHOLDER */}
      {!showAnalysis && !isAnalyzing && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Radar className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Radar is Idle</h2>
              <p className="text-sm text-gray-500 max-w-xs mt-1">Choose a product above and hit 'Run Intelligence' to start the market scan.</p>
          </div>
      )}
    </div>
  );
};

export default CompetitorRadarPage;
