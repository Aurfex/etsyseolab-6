import React, { useState } from 'react';
import { Search, Tag, FileText, LayoutGrid, Sparkles, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

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
    const { competitorData, analyzeCompetitor } = useAppContext();
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!url) return;
        setIsLoading(true);
        await analyzeCompetitor(url);
        setIsLoading(false);
    }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('competitor_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('competitor_subtitle')}</p>
        </div>
      </div>
      
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-1">
          <Search className="w-5 h-5 me-2 text-purple-500" />
          {t('competitor_intelligence_title')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('competitor_intelligence_subtitle')}</p>
        <div className="flex gap-2">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('competitor_input_placeholder')} className="flex-grow bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg p-3 focus:ring-purple-500 focus:border-purple-500" />
          <button onClick={handleAnalyze} disabled={isLoading || !url} className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : t('competitor_analyze_button')}
          </button>
        </div>
      </Card>
      
      {competitorData && (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Tag className="w-5 h-5 me-2" />{t('competitor_top_tags_title')}
                </h3>
                <div className="space-y-2">
                    {competitorData.topTags.map(t => <AnalysisItem key={t.tag} item={t.tag} value={t.value} />)}
                </div>
                </Card>
                <Card className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <FileText className="w-5 h-5 me-2" />{t('competitor_title_patterns_title')}
                </h3>
                <div className="space-y-2">
                    {competitorData.titlePatterns.map(pattern => (
                        <div key={pattern} className="bg-gray-100 dark:bg-gray-700/50 p-2.5 rounded-md text-center text-sm font-medium text-gray-700 dark:text-gray-300">{pattern}</div>
                    ))}
                </div>
                </Card>
                <Card className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <LayoutGrid className="w-5 h-5 me-2" />{t('competitor_category_focus_title')}
                </h3>
                <div className="space-y-4">
                    {competitorData.categoryFocus.map(c => <ProgressBar key={c.label} label={c.label} value={c.value} />)}
                </div>
                </Card>
            </div>
            
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                <Sparkles className="w-5 h-5 me-2 text-green-500" />{t('competitor_competitive_opt_title')}
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <p className="font-semibold text-green-800 dark:text-green-300">{t('competitor_competitive_opt_ready')}</p>
                    <p className="text-sm text-green-700 dark:text-green-400">{t('competitor_competitive_opt_found_opportunities', { count: competitorData.opportunities })}</p>
                </div>
                <button className="w-full mt-4 bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                    <Sparkles className="w-5 h-5" />
                    <span>{t('competitor_optimize_based_on_this_button')}</span>
                </button>
            </Card>
        </>
      )}
    </div>
  );
};

export default CompetitorRadarPage;