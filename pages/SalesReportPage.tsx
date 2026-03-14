import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Search, TrendingUp, DollarSign, Filter, RefreshCw, ChevronRight, FileDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const SalesReportPage: React.FC = () => {
    const { auth, showToast } = useAppContext();
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [salesData, setSalesData] = useState<{ total_revenue: number, order_count: number, recent_orders: any[], currency: string } | null>(null);

    // Fetch real sales data on mount
    useEffect(() => {
        if (!auth.token) return;
        
        const fetchSales = async () => {
            setIsFetching(true);
            try {
                const response = await fetch('/api/etsy-proxy', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'get_sales_data' })
                });

                if (response.ok) {
                    const data = await response.json();
                    setSalesData(data);
                } else {
                    const error = await response.json().catch(()=>({}));
                    showToast({ message: error.error || 'Failed to fetch sales data', type: 'error' });
                }
            } catch (err) {
                console.error(err);
                showToast({ message: 'Network error fetching sales', type: 'error' });
            } finally {
                setIsFetching(false);
            }
        };

        fetchSales();
    }, [auth.token, showToast]);

    const handleDownloadHistory = (reportName: string) => {
        alert(`Downloading ${reportName}... (In a production environment, this would fetch the archived PDF from your storage).`);
    };

    const handleGenerate = () => {
        if (!salesData || salesData.recent_orders.length === 0) {
            showToast({ message: 'No sales data available to export.', type: 'info' });
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            
            const headers = ["Receipt ID", "Buyer Email", "Date", "Status", "Total", "Currency"];
            
            const rows = salesData.recent_orders.map((order: any) => [
                order.receipt_id,
                order.buyer_email || 'Hidden',
                new Date(order.date).toLocaleDateString(),
                order.status,
                order.total.toFixed(2),
                order.currency
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast({ message: t('sales_report_success'), type: 'success' });
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sales_report_title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('sales_report_desc')}</p>
                    </div>
                </div>

                {/* LIVE DATA DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">Total Revenue (Last 100 Orders)</h3>
                        </div>
                        {isFetching ? (
                            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mt-2"></div>
                        ) : (
                            <div className="text-4xl font-black text-gray-900 dark:text-white mt-2">
                                {salesData ? `${salesData.total_revenue.toFixed(2)} ${salesData.currency}` : '0.00'}
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">Recent Orders Count</h3>
                        </div>
                        {isFetching ? (
                            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mt-2"></div>
                        ) : (
                            <div className="text-4xl font-black text-gray-900 dark:text-white mt-2">
                                {salesData ? salesData.order_count : '0'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl mb-8 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                            <FileDown className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('sales_report_ready_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                            {t('sales_report_ready_desc')}
                        </p>
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isFetching}
                            className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-2 mx-auto ${isGenerating || isFetching ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {t('sales_generating')}
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    {t('sales_btn_generate')}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        Recent Live Orders
                    </h3>
                    <div className="space-y-3">
                        {isFetching ? (
                            <div className="text-center py-4 text-gray-500">Loading orders from Etsy...</div>
                        ) : salesData?.recent_orders && salesData.recent_orders.length > 0 ? (
                            salesData.recent_orders.map((order: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Receipt #{order.receipt_id}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString()} - {order.status}</p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                        {Number(order.total).toFixed(2)} {order.currency}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500">No recent orders found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReportPage;