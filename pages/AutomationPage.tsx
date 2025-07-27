import React, { useState } from 'react';
import { Play, Download, UploadCloud, BarChart2, CheckCircle, RefreshCw, Shield, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { ActivityLog, ActivityType } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const TriggerButton: React.FC<{icon: React.ElementType, text: string, onClick: () => void, isLoading: boolean}> = ({ icon: Icon, text, onClick, isLoading }) => (
  <button 
    onClick={onClick}
    disabled={isLoading}
    className="flex items-center justify-center w-full p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
    {isLoading ? <Loader2 className="w-5 h-5 text-gray-500 dark:text-gray-400 me-3 animate-spin" /> : <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 me-3" />}
    <span className="font-medium text-gray-800 dark:text-gray-200">{text}</span>
  </button>
);

const ActivityItem: React.FC<{activity: ActivityLog}> = ({ activity }) => {
    const { t } = useTranslation();
    const iconMap: Record<string, React.ElementType> = {
        'sync_complete': CheckCircle,
        'sync_start': RefreshCw,
        'report_generated': BarChart2,
        'data_exported_csv': Download,
        'backup_complete': Shield
    };
    const Icon = iconMap[activity.type] || CheckCircle;

    return (
        <div className="flex items-center space-x-4 py-3">
            <div className={`p-2 rounded-full ${activity.status === 'Success' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                <Icon className={`w-5 h-5 ${activity.status === 'Success' ? 'text-green-500' : 'text-blue-500'}`} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-900 dark:text-white">{t(activity.tKey, activity.options)}</p>
                <p className={`text-sm font-medium ${activity.status === 'Success' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{t(`status_${activity.status.toLowerCase()}` as any)}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp.toLocaleTimeString()}</p>
            </div>
        </div>
    );
};


const AutomationPage: React.FC = () => {
    const { runAutomationTask, activityLogs } = useAppContext();
    const { t } = useTranslation();
    const [loadingTask, setLoadingTask] = useState<string | null>(null);

    const handleTask = async (taskName: string, type: ActivityType, tKey: string) => {
        setLoadingTask(taskName);
        await runAutomationTask(type, tKey);
        setLoadingTask(null);
    }
    
    const automationLogs = activityLogs.filter(log => ['sync_start', 'sync_complete', 'report_generated', 'backup_complete', 'data_exported_csv'].includes(log.type)).slice(-5).reverse();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('automation_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('automation_subtitle')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('automation_manual_triggers_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('automation_manual_triggers_subtitle')}</p>
          <div className="grid grid-cols-2 gap-4">
            <TriggerButton icon={Play} text={t('automation_scrape_now')} onClick={() => handleTask('scrape', 'backup_complete', 'log_backup_complete')} isLoading={loadingTask === 'scrape'} />
            <TriggerButton icon={BarChart2} text={t('automation_generate_report')} onClick={() => handleTask('report', 'report_generated', 'log_report_generated')} isLoading={loadingTask === 'report'} />
            <TriggerButton icon={Download} text={t('automation_export_csv')} onClick={() => handleTask('export', 'data_exported_csv', 'log_data_exported_csv')} isLoading={loadingTask === 'export'} />
            <TriggerButton icon={UploadCloud} text={t('automation_sync_to_etsy')} onClick={() => handleTask('sync', 'sync_start', 'log_sync_start')} isLoading={loadingTask === 'sync'} />
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('automation_schedule_config_title')}</h3>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="auto-opt" className="font-medium text-gray-800 dark:text-gray-200">{t('automation_auto_optimization_label')}</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="auto-opt" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                <label htmlFor="auto-opt" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"></label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('automation_frequency_label')}</label>
              <select className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2">
                <option>{t('automation_freq_6h')}</option>
                <option>{t('automation_freq_daily')}</option>
                <option>{t('automation_freq_weekly')}</option>
              </select>
            </div>
             <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('automation_email_reports_label')}</label>
              <input type="email" defaultValue="your@email.com" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('automation_google_sheets_id_label')}</label>
              <input type="text" defaultValue="18xiMV60XRA5nFMdKV8dBZigmUUgptbs74OgyE2upms" className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('automation_live_activity_feed_title')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('automation_live_activity_feed_subtitle')}</p>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
             {automationLogs.length > 0 ? (
                automationLogs.map(activity => <ActivityItem key={activity.id} activity={activity} />)
            ) : (
                <p className="text-center py-4 text-gray-500">{t('automation_no_activity')}</p>
            )}
        </div>
      </Card>
    </div>
  );
};

export default AutomationPage;