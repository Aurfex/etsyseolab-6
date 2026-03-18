import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Search, TrendingUp, DollarSign, RefreshCw, ChevronRight, FileDown } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesReportPage: React.FC = () => {
    const { auth, showToast } = useAppContext();
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    
    // Default dates: Last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const [salesData, setSalesData] = useState<{ total_revenue: number, order_count: number, recent_orders: any[], currency: string } | null>(null);

    const fetchSales = async () => {
        if (!auth.token) return;
        setIsFetching(true);
        try {
            const response = await fetch('/api/etsy-proxy', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'get_sales_data',
                    payload: { startDate, endDate }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSalesData(data);
                showToast({ message: 'Live sales data updated', type: 'success' });
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

    // Fetch on mount
    useEffect(() => {
        if (auth.token) fetchSales();
    }, [auth.token]);

    const handleSearch = () => {
        fetchSales();
    };

    const handleGeneratePDF = () => {
        if (!salesData || salesData.recent_orders.length === 0) {
            showToast({ message: 'No sales data available to export.', type: 'info' });
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const currency = salesData.currency;
                
                // Title & Header
                doc.setFontSize(22);
                doc.setTextColor(88, 28, 135); // Purple-900
                doc.text('Etsyseolab (Hasti AI) Sales Report', 14, 22);
                
                doc.setFontSize(12);
                doc.setTextColor(100, 116, 139); // Slate-500
                doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

                // Summary Block
                doc.setFillColor(248, 250, 252); // Slate-50
                doc.rect(14, 45, 182, 30, 'F');
                doc.setTextColor(15, 23, 42); // Slate-900
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text(`Total Revenue: ${salesData.total_revenue.toFixed(2)} ${currency}`, 20, 58);
                doc.text(`Total Orders: ${salesData.order_count}`, 120, 58);

                // Table
                const tableColumn = ["Receipt ID", "Date", "Buyer Email", "Status", "Total"];
                const tableRows = salesData.recent_orders.map(order => [
                    order.receipt_id,
                    new Date(order.date).toLocaleDateString(),
                    order.buyer_email || 'Hidden',
                    order.status,
                    `${Number(order.total).toFixed(2)} ${currency}`
                ]);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 85,
                    theme: 'grid',
                    styles: { fontSize: 10, cellPadding: 4 },
                    headStyles: { fillColor: [88, 28, 135] },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                });

                // Save PDF
                doc.save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
                showToast({ message: 'PDF generated successfully!', type: 'success' });
            } catch (err) {
                console.error("PDF Error", err);
                showToast({ message: 'Error generating PDF.', type: 'error' });
            } finally {
                setIsGenerating(false);
            }
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
                        <p className="text-gray-500 dark:text-gray-400">Generate beautiful PDF reports of your live Etsy sales data.</p>
                    </div>
                </div>

                {/* FILTER SECTION */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('sales_filter_date_start', { defaultValue: 'Start Date' })}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#F1641E] focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('sales_filter_date_end', { defaultValue: 'End Date' })}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#F1641E] focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleSearch}
                            disabled={isFetching}
                            className="w-full md:w-auto px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {t('sales_btn_search', { defaultValue: 'Search' })}
                        </button>
                    </div>
                </div>

                {/* LIVE DATA DASHBOARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-orange-100 dark:border-purple-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-[#F1641E] dark:text-purple-400" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">Total Revenue (Range)</h3>
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
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">Orders in Range</h3>
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ready to Export PDF</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                            Generate a clean, professional PDF report of the selected date range.
                        </p>
                        
                        <button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating || isFetching}
                            className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-2 mx-auto ${isGenerating || isFetching ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#F1641E] hover:bg-[#D95A1B] hover:scale-105'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {t('sales_generating')}
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Download PDF Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        Sample Receipts in Range
                    </h3>
                    <div className="space-y-3">
                        {isFetching ? (
                            <div className="text-center py-4 text-gray-500">Loading orders from Etsy...</div>
                        ) : salesData?.recent_orders && salesData.recent_orders.length > 0 ? (
                            salesData.recent_orders.map((order: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 transition-colors">
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
                            <div className="text-center py-4 text-gray-500">No recent orders found. Try expanding the date range.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReportPage;
