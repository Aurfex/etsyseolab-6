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
    const storeNiche = auth.user?.niche || 'Jewelry';

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
    const [fixList, setFixList] = useState<FixItem[]>([]);
    const [fixProgress, setFixProgress] = useState<('pending' | 'loading' | 'done')[]>([]);
    
    // Real-time Health Scanning Logic
    const realMissingTags = products.filter(p => p.tags.length < 13);
    const realPoorImages = products.filter(p => !p.imageUrl);
    const realLowSeo = products.filter(p => p.seoScore < 70);
    const realShortTitles = products.filter(p => p.title.length < 40);

    const totalIssues = realMissingTags.length + realPoorImages.length + realLowSeo.length + realShortTitles.length;
    
    const getGrade = (issues: number, total: number) => {
        if (total === 0) return 'Analyzing...';
        const ratio = issues / total;
        if (ratio === 0) return 'A+';
        if (ratio < 0.1) return 'A';
        if (ratio < 0.2) return 'A-';
        if (ratio < 0.4) return 'B';
        if (ratio < 0.6) return 'C';
        return 'C-';
    };

    const healthScore = products.length === 0 ? 'Analyzing...' : getGrade(totalIssues, products.length * 2);
    const avgSeoScore = products.length > 0 
        ? Math.round(products.reduce((acc, p) => acc + p.seoScore, 0) / products.length)
        : 0;

    const missingTagsCount = realMissingTags.length;
    const lowSeoCount = realLowSeo.length;

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
                    score: Math.min(100, p.seoScore + 25)
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
        setFixList([]);
        setFixProgress(['loading', 'pending', 'pending', 'pending', 'pending']);
        
        const productsToFix = [...products].sort((a, b) => a.seoScore - b.seoScore).slice(0, 5);
        const newFixes: FixItem[] = [];
        
        for (let i = 0; i < productsToFix.length; i++) {
            // Update progress state
            setFixProgress(prev => prev.map((s, idx) => idx === i ? 'loading' : s));
            
            const result = await optimizeItem(productsToFix[i]);
            if (result) {
                newFixes.push(result);
                setFixProgress(prev => prev.map((s, idx) => idx === i ? 'done' : s));
            } else {
                setFixProgress(prev => prev.map((s, idx) => idx === i ? 'pending' : s));
            }
            
            // Set next one to loading if exists
            if (i < productsToFix.length - 1) {
                setFixProgress(prev => prev.map((s, idx) => idx === i + 1 ? 'loading' : s));
            }
        }
        
        if (newFixes.length > 0) {
            setFixList(newFixes);
            showToast({ type: 'success', message: 'AI Analysis complete!' });
        } else {
            showToast({ type: 'error', message: 'Analysis failed.' });
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
        } else {
            setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
        }
    };

    const handleCancelFix = (item: FixItem) => {
        setFixList(prev => prev.filter(f => f.id !== item.id));
    };

    const handleSaveFix = async (item: FixItem) => {
        setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'saving' } : f));
        try {
            const token = auth.token || sessionStorage.getItem('etsy_token');
            if (!token) throw new Error('Unauthorized: No token found');

            const response = await fetch('/api/etsy-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({
                    listing_id: item.id,
                    payload: {
                        title: item.optimized.title,
                        description: item.optimized.description,
                        tags: item.optimized.tags // Send as array for V3
                    }
                })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Update failed');
            
            showToast({ type: 'success', message: 'Saved successfully to Etsy!' });
            setFixList(prev => prev.filter(f => f.id !== item.id));
            refreshProducts();
        } catch (error: any) {
            console.error('Save failed:', error);
            setFixList(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed' } : f));
            showToast({ type: 'error', message: 'Failed to save: ' + error.message });
        }
    };

    useEffect(() => {
        if (auth.isAuthenticated) fetchSalesData();
    }, [auth.isAuthenticated]);

    const optimizationsToday = activityLogs.filter(log => 
        log.timestamp.toDateString() === new Date().toDateString() &&
        (log.type === 'title_optimization' || log.type === 'tag_enhancement' || log.type === 'description_rewrite' || log.type === 'image_optimization')
    ).length;

    return (
        <div className="space-y-8 animate-fade-in w-full h-full min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">SEO Engine v2.6: Real-time Sync Active</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 rounded-full">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                        AI ACTIVE
                    </button>
                </div>
            </div>

            {/* Health Card */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-card border border-gray-100 dark:border-gray-700">
                <div className={"absolute -top-24 -right-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 " + (healthScore.startsWith('A') ? 'bg-green-400' : 'bg-purple-400')}></div>
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                    <div className="flex-shrink-0">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="12" fill="transparent" />
                                <circle cx="80" cy="80" r="70" className={"stroke-current transition-all duration-1000 " + (healthScore.startsWith('A') ? 'text-green-500' : 'text-purple-600')} strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={healthScore.startsWith('A') ? "40" : "220"} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</span>
                                <span className={"text-5xl font-black " + (healthScore.startsWith('A') ? 'text-green-500' : 'text-purple-600')}>{healthScore === 'Analyzing...' ? '...' : healthScore}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow w-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Store Health Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center p-3 rounded-xl border bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3" /><span className="text-sm text-gray-700 dark:text-gray-300">{products.length === 0 ? 'Checking listings...' : `${missingTagsCount} products need tag improvement`}</span>
                            </div>
                            <div className="flex items-center p-3 rounded-xl border bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-3" /><span className="text-sm text-gray-700 dark:text-gray-300">{products.length === 0 ? 'Analyzing SEO gaps...' : `${lowSeoCount} products have critical SEO gaps`}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center gap-4">
                        {/* Progress Indicators */}
                        {isFixing && (
                            <div className="flex gap-2 mb-2">
                                {fixProgress.map((status, i) => (
                                    <div key={i} className={"w-4 h-4 rounded-md " + (status === 'done' ? 'bg-green-500' : status === 'loading' ? 'bg-orange-500 animate-pulse' : 'bg-gray-300')}></div>
                                ))}
                            </div>
                        )}
                        <button onClick={handleFixAll} disabled={isFixing} className="w-full lg:w-64 py-4 px-6 rounded-2xl font-bold text-white shadow-lg bg-[#F1641E] hover:bg-[#D95A1B] disabled:bg-gray-400">
                            {isFixing ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : "✨ FIX 5 PRIORITY ITEMS"}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Review List */}
            {fixList.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-purple-200 dark:border-purple-800/50 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center"><Zap className="w-6 h-6 mr-2 text-purple-500" /> AI Batch SEO Review</h3>
                    <div className="space-y-6">
                        {fixList.map(item => (
                            <div key={item.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex flex-col gap-4 relative">
                                {item.status === 'optimizing' && <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-20 flex items-center justify-center backdrop-blur-sm rounded-2xl"><RefreshCw className="w-8 h-8 text-purple-500 animate-spin" /></div>}
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                        <img src={item.imageUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-2 opacity-70">
                                            <span className="text-[10px] font-bold text-red-500 uppercase px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded">BEFORE ({item.original.score}%)</span>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.original.title}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.original.tags.slice(0, 5).map(t => <span key={'b'+t} className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{t}</span>)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-green-500 uppercase px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded">AFTER (EST. {item.optimized.score}%)</span>
                                                <span className="text-[10px] font-bold text-green-600">+{item.optimized.score - item.original.score}%</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{item.optimized.title}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.optimized.tags.slice(0, 10).map(t => <span key={'a'+t} className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 px-1.5 py-0.5 rounded border border-green-200">{t}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={() => handleCancelFix(item)} className="p-2 text-gray-400 hover:text-red-500"><XCircle className="w-5 h-5" /></button>
                                    <button onClick={() => handleRegenerate(item)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-xl transition-all"><RotateCw className="w-4 h-4" /> Regenerate</button>
                                    <button onClick={() => handleSaveFix(item)} disabled={item.status === 'saving'} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg disabled:bg-gray-400">
                                        {item.status === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save to Etsy
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESTORED SECTIONS + Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 min-h-[300px]">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center"><DollarSign className="w-5 h-5 me-2 text-indigo-500"/>Potential Revenue Boost</h3>
                    <div className="h-64 w-full">
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
                    <div className="bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0] dark:from-[#1E1E1E] dark:to-[#2D2D2D] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"><Search className="w-4 h-4" /></span><h3 className="font-bold text-gray-900 dark:text-white">Competitor Radar</h3></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">3 Top competitors in <b>{storeNiche}</b> recently updated their tags. Check your rank now.</p>
                        <button className="w-full py-2 bg-[#F1641E] hover:bg-[#D95A1B] text-white text-sm font-semibold rounded-xl transition-colors">View Analysis</button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Flame className="w-4 h-4" /></span><h3 className="font-bold text-gray-900 dark:text-white">Trending Keywords</h3></div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Unique {storeNiche}</span><span className="text-xs text-green-500 font-bold">+124%</span></li>
                            <li className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Custom {storeNiche} gift</span><span className="text-xs text-green-500 font-bold">+89%</span></li>
                        </ul>
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