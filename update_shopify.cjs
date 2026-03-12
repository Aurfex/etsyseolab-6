const fs = require('fs');

const en = {
    "shopify_title": "Shopify Migration Tool",
    "shopify_desc": "Export your Etsy listings as a Shopify-compatible CSV file.",
    "shopify_how_it_works": "How it works:",
    "shopify_hw_1": "We map your Etsy Titles, Descriptions, and Tags to Shopify standards.",
    "shopify_hw_2": "Image URLs are preserved so Shopify can import them directly.",
    "shopify_hw_3": "SEO metadata is automatically generated from your listing content.",
    "shopify_selected": "Selected",
    "shopify_select_prompt": "Select products from the list below to export.",
    "shopify_ready_prompt": "Ready to generate your Shopify-compatible CSV.",
    "shopify_generating": "Generating CSV...",
    "shopify_exported": "Exported Successfully",
    "shopify_export_btn": "Export {count} Products",
    "shopify_select_products": "Select Products",
    "shopify_deselect_all": "Deselect All",
    "shopify_select_all": "Select All",
    "shopify_col_product": "Product",
    "shopify_col_tags": "Tags",
    "shopify_col_price": "Price"
};

const fr = {
    "shopify_title": "Outil de migration Shopify",
    "shopify_desc": "Exportez vos fiches Etsy sous forme de fichier CSV compatible avec Shopify.",
    "shopify_how_it_works": "Comment ça marche :",
    "shopify_hw_1": "Nous mappons vos titres, descriptions et tags Etsy aux standards de Shopify.",
    "shopify_hw_2": "Les URL des images sont conservées pour que Shopify puisse les importer directement.",
    "shopify_hw_3": "Les métadonnées SEO sont générées automatiquement à partir du contenu de votre fiche.",
    "shopify_selected": "Sélectionné(s)",
    "shopify_select_prompt": "Sélectionnez les produits dans la liste ci-dessous pour les exporter.",
    "shopify_ready_prompt": "Prêt à générer votre CSV compatible avec Shopify.",
    "shopify_generating": "Génération du CSV...",
    "shopify_exported": "Exportation réussie",
    "shopify_export_btn": "Exporter {count} produits",
    "shopify_select_products": "Sélectionner des produits",
    "shopify_deselect_all": "Tout désélectionner",
    "shopify_select_all": "Tout sélectionner",
    "shopify_col_product": "Produit",
    "shopify_col_tags": "Tags",
    "shopify_col_price": "Prix"
};

function inject(path, dict) {
    let content = fs.readFileSync(path, 'utf8');
    let entries = [];
    for (const [k, v] of Object.entries(dict)) {
        if (!content.includes(`"${k}"`)) {
            entries.push(`    "${k}": ${JSON.stringify(v)}`);
        }
    }
    if (entries.length > 0) {
        content = content.replace(/\n};\s*export default/, ',\n' + entries.join(',\n') + '\n};\nexport default');
        fs.writeFileSync(path, content, 'utf8');
    }
}
inject('C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/en.ts', en);
inject('C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/fr.ts', fr);

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/ShopifyExportPage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { useAppContext } from '../contexts/AppContext';", "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const { products } = useAppContext();", "const { products } = useAppContext();\n    const { t } = useTranslation();");
    txt = txt.replace(">Shopify Migration Tool<", ">{t('shopify_title')}<");
    txt = txt.replace(">Export your Etsy listings as a Shopify-compatible CSV file.<", ">{t('shopify_desc')}<");
    txt = txt.replace(">How it works:<", ">{t('shopify_how_it_works')}<");
    txt = txt.replace(">We map your Etsy Titles, Descriptions, and Tags to Shopify standards.<", ">{t('shopify_hw_1')}<");
    txt = txt.replace(">Image URLs are preserved so Shopify can import them directly.<", ">{t('shopify_hw_2')}<");
    txt = txt.replace(">SEO metadata is automatically generated from your listing content.<", ">{t('shopify_hw_3')}<");
    txt = txt.replace(">Selected<", ">{t('shopify_selected')}<");
    txt = txt.replace('"Select products from the list below to export."', "t('shopify_select_prompt')");
    txt = txt.replace('"Ready to generate your Shopify-compatible CSV."', "t('shopify_ready_prompt')");
    txt = txt.replace("Generating CSV...", "{t('shopify_generating')}");
    txt = txt.replace("Exported Successfully", "{t('shopify_exported')}");
    txt = txt.replace("Export {selectedIds.length} Products", "{t('shopify_export_btn').replace('{count}', selectedIds.length.toString())}");
    txt = txt.replace(">Select Products<", ">{t('shopify_select_products')}<");
    txt = txt.replace("'Deselect All' : 'Select All'", "t('shopify_deselect_all') : t('shopify_select_all')");
    txt = txt.replace(">Product<", ">{t('shopify_col_product')}<");
    txt = txt.replace(">Tags<", ">{t('shopify_col_tags')}<");
    txt = txt.replace(">Price<", ">{t('shopify_col_price')}<");
    fs.writeFileSync(p, txt, 'utf8');
}
