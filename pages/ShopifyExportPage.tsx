import React, { useState } from 'react';
import { Download, FileJson, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const ShopifyExportPage: React.FC = () => {
    const { products } = useAppContext();
    const { t } = useTranslation();
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

        // Official Shopify CSV Headers (Synced with product_template.csv)
        const headers = [
            'Title', 'URL handle', 'Description', 'Vendor', 'Product category', 'Type', 'Tags', 
            'Published on online store', 'Status', 'SKU', 'Barcode', 
            'Option1 name', 'Option1 value', 'Option1 Linked To', 
            'Option2 name', 'Option2 value', 'Option2 Linked To', 
            'Option3 name', 'Option3 value', 'Option3 Linked To', 
            'Price', 'Compare-at price', 'Cost per item', 'Charge tax', 'Tax code', 
            'Unit price total measure', 'Unit price total measure unit', 'Unit price base measure', 'Unit price base measure unit', 
            'Inventory tracker', 'Inventory quantity', 'Continue selling when out of stock', 
            'Weight value (grams)', 'Weight unit for display', 'Requires shipping', 'Fulfillment service', 
            'Product image URL', 'Image position', 'Image alt text', 'Variant image URL', 'Gift card', 
            'SEO title', 'SEO description', 'Color (product.metafields.shopify.color-pattern)', 
            'Google Shopping / Google product category', 'Google Shopping / Gender', 'Google Shopping / Age group', 
            'Google Shopping / Manufacturer part number (MPN)', 'Google Shopping / Ad group name', 'Google Shopping / Ads labels', 
            'Google Shopping / Condition', 'Google Shopping / Custom product', 'Google Shopping / Custom label 0', 
            'Google Shopping / Custom label 1', 'Google Shopping / Custom label 2', 'Google Shopping / Custom label 3', 'Google Shopping / Custom label 4'
        ];

        const rows: any[][] = [];

        productsToExport.forEach(p => {
            const handle = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            
            // Extract multiple images if they exist, otherwise fallback to single image
            const images = (p as any).images && Array.isArray((p as any).images) && (p as any).images.length > 0 
                ? (p as any).images 
                : [p.imageUrl];
            
            // Extract variants if they exist, otherwise create a default one
            const variants = (p as any).variants && Array.isArray((p as any).variants) && (p as any).variants.length > 0 
                ? (p as any).variants 
                : [{ title: 'Default Title', price: p.price || 0, quantity: p.quantity || 1, sku: `${handle}-01` }];

            const maxRows = Math.max(images.length, variants.length);

            for (let i = 0; i < maxRows; i++) {
                const variant = variants[i] || null;
                const image = images[i] || null;

                const row = Array(headers.length).fill('');
                
                // Common fields (URL handle is required on every row belonging to the product)
                row[headers.indexOf('URL handle')] = handle;

                // Base product fields (only on the very first row)
                if (i === 0) {
                    row[headers.indexOf('Title')] = p.title;
                    row[headers.indexOf('Description')] = p.description;
                    row[headers.indexOf('Vendor')] = 'Hasti AI Export';
                    row[headers.indexOf('Tags')] = p.tags.join(', ');
                    row[headers.indexOf('Published on online store')] = 'TRUE';
                    row[headers.indexOf('Status')] = 'active';
                    row[headers.indexOf('Gift card')] = 'FALSE';
                    row[headers.indexOf('SEO title')] = p.title;
                    row[headers.indexOf('SEO description')] = p.description.substring(0, 160);
                }

                // Variant fields
                if (variant) {
                    row[headers.indexOf('Option1 name')] = 'Title';
                    row[headers.indexOf('Option1 value')] = variant.title || 'Default Title';
                    row[headers.indexOf('Price')] = variant.price;
                    row[headers.indexOf('SKU')] = variant.sku || '';
                    row[headers.indexOf('Inventory tracker')] = 'shopify';
                    row[headers.indexOf('Inventory quantity')] = variant.quantity;
                    row[headers.indexOf('Continue selling when out of stock')] = 'deny';
                    row[headers.indexOf('Requires shipping')] = 'TRUE';
                    row[headers.indexOf('Fulfillment service')] = 'manual';
                    row[headers.indexOf('Weight value (grams)')] = '0';
                    row[headers.indexOf('Weight unit for display')] = 'g';
                    row[headers.indexOf('Charge tax')] = 'TRUE';
                }

                // Image fields
                if (image) {
                    row[headers.indexOf('Product image URL')] = typeof image === 'string' ? image : image.url || p.imageUrl;
                    row[headers.indexOf('Image position')] = i + 1;
                    if (i === 0) row[headers.indexOf('Image alt text')] = p.title;
                }

                rows.push(row);
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('shopify_title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('shopify_desc')}</p>
                    </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-8">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-bold mb-1">{t('shopify_how_it_works')}</p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>{t('shopify_hw_1')}</li>
                                <li>{t('shopify_hw_2')}</li>
                                <li>{t('shopify_hw_3')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl mb-8">
                    <div className="text-center space-y-4">
                        <div className="text-4xl font-black text-gray-900 dark:text-white">
                            {selectedIds.length} <span className="text-lg font-medium text-gray-500">{t('shopify_selected')}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
                            {selectedIds.length === 0 ? t('shopify_select_prompt') : t('shopify_ready_prompt')}
                        </p>
                        
                        <button
                            onClick={handleExport}
                            disabled={isExporting || selectedIds.length === 0}
                            className={`mt-4 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center gap-2 mx-auto ${isExporting ? 'bg-gray-400' : selectedIds.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#F1641E] hover:bg-[#D95A1B] hover:scale-105'}`}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('shopify_generating')}
                                </>
                            ) : exportComplete ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    {t('shopify_exported')}
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    {t('shopify_export_btn').replace('{count}', selectedIds.length.toString())}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* PRODUCT SELECTION LIST */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('shopify_select_products')}</h3>
                        <button 
                            onClick={toggleSelectAll}
                            className="text-xs font-bold text-[#F1641E] dark:text-purple-400 hover:underline"
                        >
                            {selectedIds.length === products.length ? t('shopify_deselect_all') : t('shopify_select_all')}
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-3 w-10"></th>
                                    <th className="px-6 py-3">{t('shopify_col_product')}</th>
                                    <th className="px-6 py-3">{t('shopify_col_tags')}</th>
                                    <th className="px-6 py-3 text-right">{t('shopify_col_price')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {products.map(p => (
                                    <tr 
                                        key={p.id} 
                                        onClick={() => toggleSelect(p.id)}
                                        className={`hover:bg-orange-50/30 dark:hover:bg-orange-900/10 cursor-pointer transition-colors ${selectedIds.includes(p.id) ? 'bg-orange-50/50 dark:bg-purple-900/20' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.includes(p.id) ? 'bg-[#F1641E] border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
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
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">{t('shopify_ready_file_msg')}</span>
                        </div>
                        <a 
                            href="https://help.shopify.com/en/manual/products/import-export/import-products" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1 hover:underline"
                        >
                            {t('shopify_view_guide')} <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopifyExportPage;
