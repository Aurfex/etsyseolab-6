import React, { useState } from 'react';
import { Package, TrendingUp, Zap, Activity, FileText, Tag, Image as ImageIcon, Check, Info, AlertTriangle, AlertCircle, RefreshCw, DollarSign, Search, Flame } from 'lucide-react';
import type { ElementType } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ActivityLog } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MetricCardProps {
  icon: ElementType;
  title: string;
  value: string;
  change: string;
  bgColor: string;
  iconColor: string;
}

interface ActivityItemProps {
  activity: ActivityLog;
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
    const { products, activityLogs, salesData, fetchSalesData } = useAppContext();
    const { t } = useTranslation();

    // Chart Data mapping
    const revenueData = salesData && salesData.recent_orders.length > 0
        ? [...salesData.recent_orders].reverse().map(order => ({
            name: new Date(order.date).toLocaleDateString(undefined, { weekday: 'short' }),
            actual: order.total,
            missed: order.total * 1.4 // Mocked missed as 40% of actual for UI purposes
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
    
    // Store Health Logic (Mocked for Demo effect)
    const [isFixing, setIsFixing] = useState(false);
    const [healthScore, setHealthScore] = useState<'A+' | 'C-'>('C-');
    
    const missingTagsCount = products.length > 0 ? products.filter(p => p.tags.length < 13).length : 7;
    const poorImagesCount = products.length > 0 ? products.filter(p => !p.imageUrl).length : 3;
    const lowSeoCount = products.length > 0 ? products.filter(p => p.seoScore < 70).length : 5;

    const handleFixAll = () => {
        setIsFixing(true);
        setTimeout(() => {
            setIsFixing(false);
            setHealthScore('A+');
        }, 3000);
    };

    const optimizationsToday = activityLogs.filter(log => 
        log.timestamp.toDateString() === new Date().toDateString() &&
        (log.type === 'title_optimization' || log.type === 'tag_enhancement' || log.type === 'description_rewrite' || log.type === 'image_optimization')
    ).length;

    const avgSeoScore = products.length > 0 
        ? Math.round(products.reduce((acc, p) => acc + p.seoScore, 0) / products.length)
        : 0;

    const latestProducts = products.slice(0, 4);

    return (
        <div className="space-y-8 animate-fade-in w-full h-full min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-shrink-0">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/10 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {t('ai_active')}
                    </button>
                </div>
            </div>

            {/* dY" WOW FACTOR: Store Health Dashboard dY" */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                {/* Decorative background glow */}
                <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-1000 ${healthScore === 'C-' ? 'bg-purple-400' : 'bg-green-400'}`}></div>
                <div className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-all duration-1000 ${healthScore === 'C-' ? 'bg-indigo-400' : 'bg-teal-400'}`}></div>

                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                    {/* Left: Score Circle */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="12" fill="transparent" />
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    className={`stroke-current transition-all duration-1000 ease-out ${healthScore === 'C-' ? 'text-purple-600' : 'text-green-500'}`} 
                                    strokeWidth="12" fill="transparent" 
                                    strokeDasharray="440" 
                                    strokeDashoffset={healthScore === 'C-' ? "220" : "40"} 
                                    strokeLinecap="round" 
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dash_health_score')}</span>
                                <span className={`text-5xl font-black ${healthScore === 'C-' ? 'text-purple-600' : 'text-green-500'}`}>
                                    {healthScore}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Issues List */}
                    <div className="flex-grow w-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {healthScore === 'C-' ? t('dash_health_needs_attention') : t('dash_health_perfect')}
                        </h2>
                        
                        <div className="space-y-3">
                            <div className={`flex items-center p-3 rounded-xl border ${healthScore === 'C-' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50'}`}>
                                {healthScore === 'C-' ? <AlertTriangle className="w-5 h-5 text-purple-500 mr-3" /> : <Check className="w-5 h-5 text-green-500 mr-3" />}
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {healthScore === 'C-' ? t('dash_health_missing_tags', { count: missingTagsCount }) : t('dash_health_tags_ok')}
                                </span>
                            </div>
                            <div className={`flex items-center p-3 rounded-xl border ${healthScore === 'C-' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50'}`}>
                                {healthScore === 'C-' ? <AlertCircle className="w-5 h-5 text-indigo-500 mr-3" /> : <Check className="w-5 h-5 text-green-500 mr-3" />}
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {healthScore === 'C-' ? t('dash_health_low_seo', { count: lowSeoCount }) : t('dash_health_seo_ok')}
                                </span>
                            </div>
                            <div className={`flex items-center p-3 rounded-xl border ${healthScore === 'C-' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50'}`}>
                                {healthScore === 'C-' ? <ImageIcon className="w-5 h-5 text-blue-600 mr-3" /> : <Check className="w-5 h-5 text-green-500 mr-3" />}
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {healthScore === 'C-' ? t('dash_health_missing_image_seo', { count: poorImagesCount }) : t('dash_health_image_seo_ok')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Magic Button */}
                    <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center justify-center">
                        {healthScore === 'C-' ? (
                            <button 
                                onClick={handleFixAll}
                                disabled={isFixing}
                                className={`w-full lg:w-64 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-105 ${isFixing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F1641E] hover:bg-[#D95A1B] hover:shadow-[#F1641E]/50'}`}
                            >
                                {isFixing ? (
                                    <span className="flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        {t('dash_health_fixing')}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center text-lg">
                                        ✨ {t('dash_health_fix_all')}
                                    </span>
                                )}
                            </button>
                        ) : (
                            <div className="w-full lg:w-64 py-4 px-6 rounded-2xl font-bold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300 text-center border border-green-200 dark:border-green-800">
                                <span className="flex items-center justify-center text-lg">
                                    <Check className="w-6 h-6 mr-2" />
                                    {t('dash_health_perfect_store')}
                                </span>
                            </div>
                        )}
                        {healthScore === 'C-' && !isFixing && (
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                {t('dash_health_fix_desc', { count: missingTagsCount + lowSeoCount + poorImagesCount })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* NEW: Missed Revenue & AI Intelligence Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart: Missed Revenue */}
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <DollarSign className="w-5 h-5 me-2 text-indigo-500"/>
                                {t('dash_rev_title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dash_rev_subtitle')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dash_rev_missed_label')}</p>
                            <p className={`text-2xl font-bold ${healthScore === 'C-' ? 'text-indigo-500' : 'text-green-500'}`}>
                                {healthScore === 'C-' 
                                    ? (salesData ? `$${(salesData.total_revenue * 0.4).toFixed(2)}` : '$2,450.00') 
                                    : '$0.00'}
                            </p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="actual" name={t('dash_rev_current')} stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                {healthScore === 'C-' && (
                                    <Area type="monotone" dataKey="missed" name={t('dash_rev_potential')} stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMissed)" />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Alerts & Trends */}
                <div className="col-span-1 flex flex-col gap-6">
                    {/* Competitor Alert */}
                    <div className="bg-gradient-to-br from-[#FAFAFA] to-[#F0F0F0] dark:from-[#1E1E1E] dark:to-[#2D2D2D] p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <Search className="w-4 h-4" />
                            </span>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('dash_radar_title')}</h3>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            <span dangerouslySetInnerHTML={{ __html: t('dash_radar_alert', { shop: 'BohoJewelryCo', count: 3 }) }} /> <span className="inline-block bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700 mx-1 font-mono text-gray-800 dark:text-gray-200">chunky silver ring</span>.
                        </p>
                        <button className="w-full py-2 bg-[#F1641E] hover:bg-[#D95A1B] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#F1641E]/20">
                            {t('dash_radar_btn')}
                        </button>
                    </div>

                    {/* Trending Keywords */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700 flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                <Flame className="w-4 h-4" />
                            </span>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('dash_trends_title')}</h3>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Cyberpunk mask</span>
                                <span className="text-xs text-green-500 font-bold">+124%</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Mother's day necklace</span>
                                <span className="text-xs text-green-500 font-bold">+89%</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">3. Raw emerald ring</span>
                                <span className="text-xs text-green-500 font-bold">+45%</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={Package} title={t('metric_total_products')} value={String(products.length || 0)} change="" bgColor="bg-white dark:bg-gray-800" iconColor="text-blue-500"/>
                <MetricCard icon={TrendingUp} title={t('metric_avg_seo_score')} value={healthScore === 'A+' ? '98%' : `${avgSeoScore || 62}%`} change={healthScore === 'A+' ? '+36% today' : ''} bgColor="bg-white dark:bg-gray-800" iconColor="text-green-500"/>
                <MetricCard icon={DollarSign} title={t('metric_total_revenue')} value={salesData ? `${salesData.total_revenue.toFixed(2)} ${salesData.currency}` : '$0.00'} change={salesData?._isMock ? 'Demo Data' : t('today')} bgColor="bg-white dark:bg-gray-800" iconColor="text-indigo-500"/>
                <MetricCard icon={Zap} title={t('metric_ai_optimizations')} value={healthScore === 'A+' ? String(optimizationsToday + 15) : String(optimizationsToday)} change={t('today')} bgColor="bg-white dark:bg-gray-800" iconColor="text-purple-500"/>
            </div>

            {/* YOUR LISTINGS (Restored) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Package className="w-5 h-5 me-2 text-blue-500"/>{t('your_listings')}
                </h3>
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {latestProducts.map(product => (
                            <div key={product.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
                                <div className="aspect-square w-full overflow-hidden bg-gray-200 dark:bg-gray-600 relative">
                                    {product.imageUrl && product.imageUrl.startsWith('http') ? (
                                        <img 
                                            src={product.imageUrl} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                        {t('dash_seo_label')}: {healthScore === 'A+' ? '99' : product.seoScore}%
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 h-10 mb-1" title={product.title}>
                                        {product.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {product.tags.slice(0, 3).join(', ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{t('dash_no_listings')}</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default DashboardPage;