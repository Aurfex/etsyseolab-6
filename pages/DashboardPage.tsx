import React, { useState, useEffect, useCallback } from 'react';
import { Package, TrendingUp, Zap, Activity, FileText, Tag, Image as ImageIcon, Check, Info, AlertTriangle, AlertCircle, RefreshCw, DollarSign, Search, Flame, RotateCw, XCircle } from 'lucide-react';
import type { ElementType } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ActivityLog, Product } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  icon: ElementType;
  title: string;
  value: string;
  change: string;
  bgColor: string;
  iconColor: string;
}

interface FixItem {
    id: string;
    listing_id: string;
    imageUrl?: string;
    original: { title: string; description: string; tags: string[]; score: number };
    optimized: { title: string; description: string; tags: string[]; score: number };
    status: 'pending' | 'saving' | 'saved' | 'failed' | 'optimizing';
}


const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, value, change, bgColor, iconColor }) => (
  <div className={`p-5 rounded-2xl shadow-card dark:shadow-card-dark ${bgColor} border border-gray-100 dark:border-gray-800`}>
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{change}</span>
      </div>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
    const { products, activityLogs, salesData, fetchSalesData, runAutopilotFix, runFullOptimization, showToast, auth, refreshProducts } = useAppContext();
    const { t } = useTranslation();
    const storeNiche = auth.user?.niche || 'Gift';

    // Chart Data mapping
    const revenueData = salesData && salesData.recent_orders.length > 0
        ? [...salesData.recent_orders].reverse().map(order => ({
            name: new Date(order.date).toLocaleDateString(undefined, { weekday: 'short' }),
            actual: order.total,
            missed: order.total * 1.4
        }))
        : [
            { name: 'Mon', actual: 120, missed: 400 },
            { name: 'Tue', actual: 180, missed: 420 },
            { name: 'Wed', actual: 150, missed: 450 },
            { name: 'Thu', actual: 200, missed: 500 },
            { name: 'Fri', actual: 250, missed: 520 },
            { name: 'Sat', actual: 300, missed: 600 },
            { name: 'Sun', actual: 280, missed: 650 },
        ];

    // State
    const [isFixing, setIsFixing] = useState(false);
    const [isInitialScanning, setIsInitialScanning] = useState(false);
    const [fixList, setFixList] = useState<FixItem[]>([]);
    
    // Real-time Health Scanning Logic
    const realMissingTags = products.filter(p => p.tags.length < 13);
    const realPoorImages = products.filter(p => !p.imageUrl);
    const realLowSeo = products.filter(p => p.seoScore < 70);
    const realShortTitles = products.filter(p => p.title.length < 40);

    const totalIssues = realMissingTags.length + realPoorImages.length + realLowSeo.length + realShortTitles.length;
    
    // Grades: A+ to C-
    const getGrade = (issues: number, total: number) => {
        if (total === 0) return 'N/A';
        const ratio = issues / total;
        if (ratio === 0) return 'A+';
        if (ratio < 0.1) return 'A';
        if (ratio < 0.2) return 'A-';
        if (ratio < 0.4) return 'B';
        if (ratio < 0.6) return 'C';
        return 'C-';
    };

    const healthScore = getGrade(totalIssues, products.length * 2); // multiplied by 2 to make it harder to get A+
    const avgSeoScore = products.length > 0 
        ? Math.round(products.reduce((acc, p) => acc + p.seoScore, 0) / products.length)
        : 0;

    const missingTagsCount = realMissingTags.length;
    const poorImagesCount = realPoorImages.length;
    const lowSeoCount = realLowSeo.length;

    // Optimization Logic
    const optimizeItem = async (p: Product): Promise<FixItem | null> => {
        try {
            const optResult = await runFullOptimization(p);
            return {
                id: p.id,
                listing_id: p.id,
                imageUrl: p.imageUrl,
                original: { title: p.title, description: p.description, tags: p.tags, score: p.seoScore },
                optimized: { 
                    title: optResult.title, 
                    description: optResult.description, 
                    tags: optResult.tags || p.tags,
                    score: Math.min(100, p.seoScore + 25) // AI boost
                },
                status: 'pending'
            };
        } catch (err) {
            console.error('Failed to optimize', p.id, err);
            return null;
        }
    };

    const handleFixAll = async () => {
        if (products.length === 0) return;
        setIsFixing(true);
        
        // Pick top 5 products with lowest SEO scores
        const productsToFix = [...products]
            .sort((a, b) => a.seoScore - b.seoScore)
            .slice(0, 5);

        const newFixes: FixItem[] = [];
        for (const p of productsToFix) {
            const result = await optimizeItem(p);
            if (result) newFixes.push(result);
        }
            
        if (newFixes.length > 0) {
            setFixList(newFixes);
            showToast({ type: 'success', message: 'AI Analysis complete for 5 priority listings!' });
        } else {
            showToast({ type: 'error', message: 'Analysis failed. API limits might be reached.' });
        }
        setIsFixing(false);
    };

    const handleRegenerate = async (item: FixItem) => {
        setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'optimizing' } : f));
        const p = products.find(prod => prod.id === item.id);
        if (!p) return;
        
        const result = await optimizeItem(p);
        if (result) {
            setFixList(prev => prev.map(f => f.id === item.id ? result : f));
            showToast({ type: 'success', message: 'New optimization generated!' });
        } else {
            setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
            showToast({ type: 'error', message: 'Regeneration failed.' });
        }
    };

    const handleCancelFix = (item: FixItem) => {
        setFixList(prev => prev.filter(f => f.id !== item.id));
    };

    const handleSaveFix = async (item: FixItem) => {
        setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'saving' } : f));
        try {
            const token = auth.token || localStorage.getItem('etsy_token');
            const response = await fetch('/api/etsy-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({
                    listing_id: item.id,
                    payload: {
                        title: item.optimized.title,
                        description: item.optimized.description,
                        tags: item.optimized.tags.join(',')
                    }
                })
            });
            if (!response.ok) throw new Error('Update failed');
            showToast({ type: 'success', message: 'Saved successfully to Etsy!' });
            setFixList(prev => prev.filter(f => f.id !== item.id));
            refreshProducts();
        } catch (error) {
            setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
            showToast({ type: 'error', message: 'Failed to save to Etsy.' });
        }
    };

    // Auto-scan on load (inform user)
    useEffect(() => {
        if (products.length > 0 && fixList.length === 0 && !isInitialScanning) {
            // We could auto-trigger FixAll here but better to just set a state that we ARE analyzing.
            // For now, let's just fetch sales.
            fetchSalesData();
        }
    }, [products.length]);

    const optimizationsToday = activityLogs.filter(log => 
        log.timestamp.toDateString() === new Date().toDateString() &&
        (log.type === 'title_optimization' || log.type === 'tag_enhancement' || log.type === 'description_rewrite' || log.type === 'image_optimization')
    ).length;

    const latestProducts = products.slice(0, 4);

    return (
        <div className="space-y-8 animate-fade-in w-full h-full min-h-[400px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Analyzing your store performance...</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 rounded-full">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                        AI ACTIVE: Scanning 5 Priority Items
                    </button>
                </div>
            </div>

            {/* Health Score Card */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                <div className={"absolute -top-24 -right-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-1000 " + (healthScore.startsWith('A') ? 'bg-green-400' : 'bg-purple-400')}></div>
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="12" fill="transparent" />
                                <circle cx="80" cy="80" r="70" className={"stroke-current transition-all duration-1000 ease-out " + (healthScore.startsWith('A') ? 'text-green-500' : 'text-purple-600')} strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={healthScore.startsWith('A') ? "40" : "220"} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Health Score</span>
                                <span className={"text-5xl font-black " + (healthScore.startsWith('A') ? 'text-green-500' : 'text-purple-600')}>{healthScore}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow w-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {healthScore.startsWith('A') ? 'Your store looks great!' : 'Your store needs SEO attention'}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 rounded-xl border bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{missingTagsCount} products have missing or low tags</span>
                            </div>
                            <div className="flex items-center p-3 rounded-xl border bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{lowSeoCount} products have critical SEO errors</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 w-full lg:w-auto">
                        <button onClick={handleFixAll} disabled={isFixing} className={"w-full lg:w-64 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-105 " + (isFixing ? 'bg-gray-400' : 'bg-[#F1641E] hover:bg-[#D95A1B]')}>
                            {isFixing ? <span className="flex items-center justify-center"><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Analyzing...</span> : <span className="flex items-center justify-center text-lg">✨ FIX 5 PRIORITY ITEMS</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Fix Review List */}
            {fixList.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-purple-200 dark:border-purple-800/50 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                        <span className="flex items-center"><Zap className="w-6 h-6 mr-2 text-purple-500" /> AI Batch SEO Review</span>
                        <span className="text-xs font-normal text-gray-500 uppercase">Step 1: Review & Optimize</span>
                    </h3>
                    <div className="space-y-6">
                        {fixList.map(item => (
                            <div key={item.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex flex-col gap-4 relative overflow-hidden">
                                {item.status === 'optimizing' && <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-20 flex items-center justify-center backdrop-blur-sm"><RefreshCw className="w-8 h-8 text-purple-500 animate-spin" /></div>}
                                
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <img src={item.imageUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* BEFORE */}
                                        <div className="space-y-3 opacity-70">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded">BEFORE ({item.original.score}%)</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.original.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">"{item.original.description.slice(0, 100)}..."</p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.original.tags.slice(0, 8).map(t => <span key={'b'+item.id+t} className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}
                                            </div>
                                        </div>
                                        {/* AFTER */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded">AFTER (EST. {item.optimized.score}%)</span>
                                                <span className="text-xs font-bold text-green-600">+{item.optimized.score - item.original.score}% IMPROVEMENT</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{item.optimized.title}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">{item.optimized.description.slice(0, 150)}...</p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.optimized.tags.map(t => <span key={'a'+item.id+t} className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-medium border border-green-200/50 dark:border-green-800/50">{t}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={() => handleCancelFix(item)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Discard"><XCircle className="w-5 h-5" /></button>
                                    <button onClick={() => handleRegenerate(item)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"><RotateCw className="w-4 h-4" /> Regenerate</button>
                                    <button onClick={() => handleSaveFix(item)} disabled={item.status === 'saving'} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/20 disabled:bg-gray-400">
                                        {item.status === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save Changes to Etsy
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metrics and Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center"><DollarSign className="w-5 h-5 me-2 text-indigo-500"/>Potential Revenue Boost</h3><p className="text-sm text-gray-500 dark:text-gray-400">Based on optimized SEO visibility</p></div>
                        <div className="text-right"><p className="text-sm text-gray-500 dark:text-gray-400">Monthly Potential</p><p className="text-2xl font-bold text-green-500">{salesData ? '$' + (salesData.total_revenue * 1.6).toFixed(0) : '$4,820'}</p></div>
                    </div>
                    <div className="h-64 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient><linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="actual" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="missed" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMissed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Flame className="w-4 h-4" /></span><h3 className="font-bold text-gray-900 dark:text-white">Trending in {storeNiche}</h3></div>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Handmade {storeNiche}</span><span className="text-xs text-green-500 font-bold">+124%</span></li>
                            <li className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom {storeNiche} Gift</span><span className="text-xs text-green-500 font-bold">+89%</span></li>
                        </ul>
                    </div>
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 shadow-xl">
                        <h3 className="text-white font-bold mb-2 flex items-center"><Zap className="w-4 h-4 mr-2 text-yellow-400" /> Hasti's Pro Tip</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">"Listen to me, boss: Your titles are too short! Etsy loves long, keyword-rich titles. Let me rewrite them and watch the traffic roll in! 💋"</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={Package} title="Total Products" value={String(products.length)} change="" bgColor="bg-white dark:bg-gray-800" iconColor="text-blue-500"/>
                <MetricCard icon={TrendingUp} title="Avg SEO Score" value={avgSeoScore + "%"} change="" bgColor="bg-white dark:bg-gray-800" iconColor="text-green-500"/>
                <MetricCard icon={DollarSign} title="Total Revenue" value={salesData ? salesData.total_revenue.toFixed(2) + ' ' + salesData.currency : '$0.00'} change="Overall" bgColor="bg-white dark:bg-gray-800" iconColor="text-indigo-500"/>
                <MetricCard icon={Zap} title="Optimizations" value={String(optimizationsToday)} change="Today" bgColor="bg-white dark:bg-gray-800" iconColor="text-purple-500"/>
            </div>
        </div>
    );
};


export default DashboardPage;