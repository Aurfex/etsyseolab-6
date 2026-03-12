import React, { useState } from 'react';
import { FileText, Download, Calendar, Search, TrendingUp, DollarSign, Filter, RefreshCw, ChevronRight, FileDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const SalesReportPage: React.FC = () => {
    const { activityLogs } = useAppContext();
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [startDate, setStartDate] = useState('2026-03-01');
    const [endDate, setEndDate] = useState('2026-03-31');

    const handleDownloadHistory = (reportName: string) => {
        alert(`Downloading ${reportName}... (In a production environment, this would fetch the archived PDF from your storage).`);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            // Simulate PDF Generation with a text blob
            const mockContent = `
                ===================================
                HASTI AI SALES INTELLIGENCE REPORT
                ===================================
                Period: ${startDate} to ${endDate}
                
                SUMMARY:
                - Total Sales: $12,450.00
                - Total Orders: 452
                - Conversion Rate: 3.8%
                - AI SEO Impact: +$1,280.00
                
                TOP PERFORMING TAGS:
                1. "handmade jewelry" (+24% reach)
                2. "custom gift for her" (+18% reach)
                3. "minimalist silver ring" (+15% reach)
                
                Generated on: ${new Date().toLocaleString()}
                ===================================
            `;
            const blob = new Blob([mockContent], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Hasti_Sales_Report_${startDate}.txt`;
            link.click();
        }, 3000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sales_title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('sales_desc')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-gray-100 dark:border-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 w-28"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 w-28"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sales_stats_total_sales')}</span>
                        <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">$12,450.00</div>
                    <div className="text-xs text-green-500 font-bold mt-1">+12.5% {t('sales_stats_vs_last')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sales_stats_total_orders')}</span>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">452</div>
                    <div className="text-xs text-green-500 font-bold mt-1">+8% {t('sales_stats_vs_last')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sales_stats_seo_impact')}</span>
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">+$1,280</div>
                    <div className="text-xs text-purple-500 font-bold mt-1">{t('sales_stats_ai_desc')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sales_stats_conv_rate')}</span>
                        <Filter className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">3.8%</div>
                    <div className="text-xs text-red-500 font-bold mt-1">-0.4% {t('sales_stats_vs_last')}</div>
                </div>
            </div>

            {/* Report Preview Placeholder */}
            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-card flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-64 h-80 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg p-6 overflow-hidden flex flex-col items-center group cursor-pointer hover:border-blue-400 transition-all">
                    <div className="w-12 h-1 bg-blue-500 rounded-full mb-6"></div>
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 self-start"></div>
                    
                    {/* Mock Charts */}
                    <div className="w-full h-24 flex items-end gap-2 mb-8">
                        <div className="w-1/4 h-1/2 bg-blue-200 dark:bg-blue-800 rounded-t"></div>
                        <div className="w-1/4 h-3/4 bg-blue-300 dark:bg-blue-700 rounded-t"></div>
                        <div className="w-1/4 h-full bg-blue-500 rounded-t"></div>
                        <div className="w-1/4 h-2/3 bg-blue-400 dark:bg-blue-600 rounded-t"></div>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all flex items-center justify-center">
                        <Search className="w-10 h-10 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                </div>
                
                <div className="mt-10 text-center space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('sales_pdf_ready_title')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {t('sales_pdf_ready_desc')}
                    </p>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-3 mx-auto ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                {t('sales_btn_processing')}
                            </>
                        ) : (
                            <>
                                <FileDown className="w-5 h-5" />
                                {t('sales_btn_download')}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Recent Reports History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-gray-400" />
                    {t('sales_history_title')}
                </h3>
                <div className="space-y-4">
                    <div 
                        onClick={() => handleDownloadHistory(t('sales_report_name_feb'))}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('sales_report_name_feb')}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('sales_history_generated_on', { date: 'Mar 01, 2026', size: '2.4' })}</p>
                            </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div 
                        onClick={() => handleDownloadHistory(t('sales_report_name_jan'))}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('sales_report_name_jan')}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('sales_history_generated_on', { date: 'Feb 01, 2026', size: '1.8' })}</p>
                            </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReportPage;