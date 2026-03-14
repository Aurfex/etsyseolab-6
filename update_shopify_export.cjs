const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'ShopifyExportPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldHandleExport = `    const handleExport = () => {
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
            ...rows.map(row => row.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(','))
        ].join('\\n');

        // Create download
        setTimeout(() => {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', \`shopify_export_\${new Date().toISOString().split('T')[0]}.csv\`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExporting(false);
            setExportComplete(true);
        }, 2000);
    };`;

const newHandleExport = `    const handleExport = () => {
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
                : [{ title: 'Default Title', price: p.price || 0, quantity: p.quantity || 1, sku: \`\${handle}-01\` }];

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
            ...rows.map(row => row.map(cell => \`"\${String(cell || '').replace(/"/g, '""')}"\`).join(','))
        ].join('\\n');

        // Create download
        setTimeout(() => {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', \`shopify_export_\${new Date().toISOString().split('T')[0]}.csv\`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExporting(false);
            setExportComplete(true);
        }, 2000);
    };`;

if (content.includes('Standard Shopify CSV Headers')) {
    content = content.replace(oldHandleExport, newHandleExport);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated ShopifyExportPage.tsx');
} else {
    console.log('Could not find the target code block.');
}
