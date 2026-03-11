import React, { useState } from 'react';
import { FileText, Download, Calendar, Search, TrendingUp, DollarSign, Filter, RefreshCw, ChevronRight, FileDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const SalesReportPage: React.FC = () => {
    const { activityLogs } = useAppContext();
    const [isGenerating, setIsGenerating] = useState(false);
    const [startDate, setStartDate] = useState('2026-03-01');
    const [endDate, setEndDate] = useState('2026-03-31');

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            alert('PDF Sales Report for ' + startDate + ' to ' + endDate + ' has been generated and downloaded.');
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & SEO Intelligence</h1>
                        <p className="text-gray-500 dark:text-gray-400">Generate professional PDF reports of your store performance.</p>
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
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
                        <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">$12,450.00</div>
                    <div className="text-xs text-green-500 font-bold mt-1">+12.5% vs last period</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">452</div>
                    <div className="text-xs text-green-500 font-bold mt-1">+8% vs last period</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">SEO Impact</span>
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">+$1,280</div>
                    <div className="text-xs text-purple-500 font-bold mt-1">Revenue from AI optimizations</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversion Rate</span>
                        <Filter className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">3.8%</div>
                    <div className="text-xs text-red-500 font-bold mt-1">-0.4% vs last period</div>
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Professional PDF Ready</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Your report will include a detailed breakdown of revenue, top-selling items, and SEO performance metrics.
                    </p>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-3 mx-auto ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Processing Data...
                            </>
                        ) : (
                            <>
                                <FileDown className="w-5 h-5" />
                                Download Full Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Recent Reports History */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-gray-400" />
                    Report History
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sales Report - February 2026</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Generated on Mar 01, 2026 • 2.4 MB</p>
                            </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Store Health Audit - Jan 2026</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Generated on Feb 01, 2026 • 1.8 MB</p>
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