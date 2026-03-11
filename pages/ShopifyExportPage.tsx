import React, { useState } from 'react';
import { Download, FileJson, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const ShopifyExportPage: React.FC = () => {
    const { products } = useAppContext();
    const [isExporting, setIsExporting] = useState(false);
    const [exportComplete, setExportComplete] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        const productsToExport = products.filter(p => selectedIds.includes(p.id));
        if (productsToExport.length === 0) return;

        setIsExporting(true);
        setExportComplete(false);

        // Standard Shopify CSV Headers
        const headers = [
            'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Standardized Product Type', 'Custom Product Type', 
            'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 
            'Option3 Name', 'Option3 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 
            'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 
            'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 
            'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 
            'SEO Title', 'SEO Description', 'Google Shopping / Google Product Category', 'Google Shopping / Gender', 
            'Google Shopping / Age Group', 'Google Shopping / MPN', 'Google Shopping / Condition', 
            'Google Shopping / Custom Product', 'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1', 
            'Google Shopping / Custom Label 2', 'Google Shopping / Custom Label 3', 'Google Shopping / Custom Label 4', 
            'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Price / International', 'Compare At Price / International', 'Status'
        ];

        // Map Selected Etsy Products to Shopify Format
        const rows = productsToExport.map(p => {
            const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return [
                handle, // Handle
                p.title, // Title
                p.description, // Body (HTML)
                'My Etsy Shop', // Vendor
                '', // Standardized Product Type
                '', // Custom Product Type
                p.tags.join(', '), // Tags
                'TRUE', // Published
                'Title', // Option1 Name
                'Default Title', // Option1 Value
                '', '', '', '', // Option 2 & 3
                '', // Variant SKU
                '0', // Variant Grams
                'shopify', // Variant Inventory Tracker
                p.quantity || '1', // Variant Inventory Qty
                'deny', // Variant Inventory Policy
                'manual', // Variant Fulfillment Service
                p.price || '0.00', // Variant Price
                '', // Variant Compare At Price
                'TRUE', // Variant Requires Shipping
                'TRUE', // Variant Taxable
                '', // Variant Barcode
                p.imageUrl, // Image Src
                '1', // Image Position
                p.title, // Image Alt Text
                'FALSE', // Gift Card
                p.title, // SEO Title
                p.description.substring(0, 160), // SEO Description
                '', '', '', '', '', '', '', '', '', '', '', // Google Shopping fields
                'g', // Variant Weight Unit
                '', // Variant Tax Code
                '', // Cost per item
                '', '', // International
                'active' // Status
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Create download
        setTimeout(() => {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `shopify_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExporting(false);
            setExportComplete(true);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-card dark:shadow-card-dark border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                        <FileJson className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopify Migration Tool</h1>
                        <p className="text-gray-500 dark:text-gray-400">Export your Etsy listings as a Shopify-compatible CSV file.</p>
                    </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-8">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-bold mb-1">How it works:</p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>We map your Etsy Titles, Descriptions, and Tags to Shopify standards.</li>
                                <li>Image URLs are preserved so Shopify can import them directly.</li>
                                <li>SEO metadata is automatically generated from your listing content.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl mb-8">
                    <div className="text-center space-y-4">
                        <div className="text-4xl font-black text-gray-900 dark:text-white">
                            {selectedIds.length} <span className="text-lg font-medium text-gray-500">Selected</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
                            {selectedIds.length === 0 ? "Select products from the list below to export." : "Ready to generate your Shopify-compatible CSV."}
                        </p>
                        
                        <button
                            onClick={handleExport}
                            disabled={isExporting || selectedIds.length === 0}
                            className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-2 mx-auto ${isExporting ? 'bg-gray-400' : selectedIds.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating CSV...
                                </>
                            ) : exportComplete ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Exported Successfully
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Export {selectedIds.length} Products
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* PRODUCT SELECTION LIST */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">Select Products</h3>
                        <button 
                            onClick={toggleSelectAll}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            {selectedIds.length === products.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-3 w-10"></th>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">Tags</th>
                                    <th className="px-6 py-3 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {products.map(p => (
                                    <tr 
                                        key={p.id} 
                                        onClick={() => toggleSelect(p.id)}
                                        className={`hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer transition-colors ${selectedIds.includes(p.id) ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(p.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {selectedIds.includes(p.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0">
                                                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] rounded-full text-gray-500">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {p.tags.length > 3 && <span className="text-[10px] text-gray-400">+{p.tags.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            ${p.price || '0.00'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {exportComplete && (
                    <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-700 dark:text-green-300" />
                            </div>
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">Your file is ready! Go to Shopify &gt; Products &gt; Import to start.</span>
                        </div>
                        <a 
                            href="https://help.shopify.com/en/manual/products/import-export/import-products" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1 hover:underline"
                        >
                            View Guide <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopifyExportPage;