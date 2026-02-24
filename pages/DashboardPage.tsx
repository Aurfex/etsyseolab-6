import React from 'react';
import { Package, TrendingUp, Zap, Activity, FileText, Tag, Image as ImageIcon, Check, Info } from 'lucide-react';
import type { ElementType } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ActivityLog } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

// Interfaces for component props
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
  <div className={`p-5 rounded-2xl shadow-card dark:shadow-card-dark ${bgColor}`}>
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

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
    const { t } = useTranslation();
    const { tKey, subtitle, change, status, timestamp, options } = activity;

    const activityTypeMap: Record<string, { icon: ElementType, tagType: 'success' | 'processing' | 'info' | 'queued' | 'running'}> = {
        title_optimization: { icon: FileText, tagType: 'success' },
        tag_enhancement: { icon: Tag, tagType: 'success' },
        description_rewrite: { icon: FileText, tagType: 'success' },
        image_optimization: { icon: ImageIcon, tagType: 'success' },
        sync_start: { icon: Activity, tagType: 'running'},
        sync_complete: { icon: Check, tagType: 'success'},
        default: {icon: Info, tagType: 'info'}
    };

    const { icon: Icon, tagType } = activityTypeMap[activity.type] || activityTypeMap.default;

  const tagStyles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse',
    info: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    queued: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  };

  const getTagText = () => {
      if (change) return change;
      if (status) return t(`status_${status.toLowerCase()}` as any);
      return t('status_info');
  }

  return (
    <div className="flex items-center space-x-4 py-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-900 dark:text-white">{t(tKey, options)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="text-right">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${tagStyles[tagType]}`}>{getTagText()}</span>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timestamp.toLocaleTimeString()}</p>
      </div>
    </div>
  );
};


const DashboardPage: React.FC = () => {
    const { products, activityLogs } = useAppContext();
    const { t } = useTranslation();
    
    const optimizationsToday = activityLogs.filter(log => 
        log.timestamp.toDateString() === new Date().toDateString() &&
        (log.type === 'title_optimization' || log.type === 'tag_enhancement' || log.type === 'description_rewrite' || log.type === 'image_optimization')
    ).length;

    const avgSeoScore = products.length > 0 
        ? Math.round(products.reduce((acc, p) => acc + p.seoScore, 0) / products.length)
        : 0;

    const recentActivities = activityLogs.slice(-4).reverse();
    const lastOptimized = activityLogs.find(log => log.type === 'title_optimization');

    // Get latest 4 products to display
    const latestProducts = products.slice(0, 4);

    return (
        <div className="space-y-8">
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
                    <button className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700/80 rounded-full">
                        {t('autopilot_on')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={Package} title={t('metric_total_products')} value={String(products.length)} change="" bgColor="bg-white dark:bg-gray-800" iconColor="text-blue-500"/>
                <MetricCard icon={TrendingUp} title={t('metric_avg_seo_score')} value={`${avgSeoScore}%`} change="" bgColor="bg-white dark:bg-gray-800" iconColor="text-green-500"/>
                <MetricCard icon={Zap} title={t('metric_ai_optimizations')} value={String(optimizationsToday)} change={t('today')} bgColor="bg-white dark:bg-gray-800" iconColor="text-purple-500"/>
                <MetricCard icon={Activity} title={t('metric_sync_status')} value={t('live')} change={t('live_status_time_ago', { minutes: 2 })} bgColor="bg-white dark:bg-gray-800" iconColor="text-orange-500"/>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center"><Zap className="w-5 h-5 me-2 text-purple-500"/>{t('autopilot_summary_title')}</h3>
                <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-center my-4">
                    <p className="text-gray-600 dark:text-gray-300">{t('autopilot_summary_line_1', { count: optimizationsToday })}</p>
                    {lastOptimized && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('top_title_prefix')} "{lastOptimized.subtitle}" ({lastOptimized.change})</p>}
                </div>
                 <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4 me-1.5"/>
                        <span className="font-medium">{optimizationsToday} {t('completed_status')}</span>
                    </div>
                     <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Info className="w-4 h-4 me-1.5"/>
                        <span className="font-medium">2 {t('queued_status')}</span>
                    </div>
                </div>
            </div>

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
                                        SEO: {product.seoScore}%
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
                        <p className="text-gray-500 dark:text-gray-400">No listings found. Connect your Etsy shop to see your products.</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recent_activity_title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('recent_activity_subtitle')}</p>
                <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentActivities.length > 0 ? (
                        recentActivities.map(activity => <ActivityItem key={activity.id} activity={activity} />)
                    ) : (
                        <p className="text-center py-4 text-gray-500">{t('no_recent_activity')}</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;