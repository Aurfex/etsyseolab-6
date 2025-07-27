import React, { useState } from 'react';
import { Bot, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Product } from '../types';
import { useTranslation } from '../contexts/LanguageContext';


const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const ActivityItem: React.FC<{icon: React.ElementType, title: string, subtitle: string, tagText: string, time: string}> = ({ icon: Icon, title, subtitle, tagText, time }) => (
    <div className="flex items-center space-x-4 py-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{tagText}</span>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
);

const WatchlistItem: React.FC<{product: Product, reason: string, level: 'high' | 'medium' | 'low'}> = ({product, reason, level}) => {
    const { title, seoScore } = product;
    const levelColors = {
        high: 'border-red-500',
        medium: 'border-yellow-500',
        low: 'border-blue-500'
    };
    const levelText = {
        high: 'text-red-500 font-bold',
        medium: 'text-yellow-500 font-bold',
        low: 'text-blue-500 font-bold'
    }
    const { t } = useTranslation();
    return (
        <div className={`p-4 border-l-4 ${levelColors[level]} bg-gray-50 dark:bg-gray-900/50 rounded-r-lg`}>
            <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                <span className={`text-xs uppercase font-bold ${levelText[level]}`}>{t(`watchlist_level_${level}`)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('watchlist_seo_score')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{seoScore}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 my-2">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${seoScore}%`}}></div>
            </div>
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4 me-2" />
                <span>{reason}</span>
            </div>
        </div>
    )
}

const AutopilotPage: React.FC = () => {
    const { products, activityLogs, runAutopilotFix, settings, updateSettings } = useAppContext();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const watchlistReasons = [
        t('watchlist_reason_alt_text'),
        t('watchlist_reason_title_structure'),
        t('watchlist_reason_tags'),
    ];
    
    const watchlistLevels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
    
    const watchlist = products.slice(0, 3).map((p, i) => ({
        product: p,
        reason: watchlistReasons[i % watchlistReasons.length],
        level: watchlistLevels[i % watchlistLevels.length]
    })).filter(item => item.product);

    const autopilotLogs = activityLogs.filter(log => log.type === 'title_optimization').slice(-4).reverse();
    const optimizationsToday = autopilotLogs.length;

    const handleFixAll = async () => {
        setIsLoading(true);
        await runAutopilotFix(watchlist.map(item => item.product));
        setIsLoading(false);
    }

    const handleAutopilotToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettings({
            ...settings,
            autopilot: {
                ...settings.autopilot,
                enabled: e.target.checked,
            }
        });
    }
    
  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('autopilot_page_title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('autopilot_page_subtitle')}</p>
            </div>
        </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
          <Bot className="w-5 h-5 me-2 text-purple-500" />
          {t('autopilot_command_center_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('autopilot_command_center_subtitle')}</p>
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">{t('autopilot_status_title')}</p>
            <p className="text-sm text-green-700 dark:text-green-400">{settings.autopilot.enabled ? t('autopilot_status_active', { count: products.length }) : t('autopilot_status_inactive')}</p>
          </div>
           <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" name="toggle" id="autopilot-toggle" checked={settings.autopilot.enabled} onChange={handleAutopilotToggle} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
            <label htmlFor="autopilot-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"></label>
          </div>
        </div>
         <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300">{t('autopilot_ai_working_title')}</p>
          <p className="text-sm text-blue-700 dark:text-blue-400">{t('autopilot_ai_working_subtitle', { count: optimizationsToday })}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('autopilot_activity_log_title')}</h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {autopilotLogs.map(log => (
                 <ActivityItem key={log.id} icon={FileText} title={t(log.tKey, log.options)} subtitle={log.subtitle || ''} tagText={log.change || t(`status_${log.status.toLowerCase()}` as any)} time={log.timestamp.toLocaleTimeString()} />
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('autopilot_watchlist_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('autopilot_watchlist_subtitle')}</p>
          <div className="space-y-4">
            {watchlist.map(item => <WatchlistItem key={item.product.id} {...item} />)}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 me-2 text-yellow-500" />
            {t('autopilot_recommendations_title')}
        </h3>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-bold">{t('autopilot_priority_alert_prefix')}</span> {t('autopilot_priority_alert_suffix', { count: watchlist.length })}
            </p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <button 
                onClick={handleFixAll}
                disabled={isLoading}
                className="flex-1 bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="animate-spin me-2" /> : null}
                {isLoading ? t('autopilot_optimizing_button') : t('autopilot_fix_all_button')}
            </button>
            <button className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{t('autopilot_review_changes_button')}</button>
        </div>
      </Card>
    </div>
  );
};

export default AutopilotPage;