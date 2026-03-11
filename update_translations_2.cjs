const fs = require('fs');

const keys_en = {
    'image_seo_title': "Image SEO",
    'image_seo_desc': "Generate SEO-friendly image names using product title, manual keywords, and AI image analysis.",
    'image_seo_product_title': "Product title",
    'image_seo_product_title_placeholder': "e.g. Rose Gold Claddagh Ring",
    'image_seo_manual_keywords': "Manual keywords (optional)",
    'image_seo_manual_keywords_placeholder': "e.g. irish ring, wedding band, celtic",
    'image_seo_images_label': "Images (up to 15)",
    'image_seo_selected': "Selected:",
    'image_seo_generating': "Generating...",
    'image_seo_generate_btn': "Generate SEO Names",
    'image_seo_results_title': "Results",
    'image_seo_download_zip': "Download ZIP (2000x2000 WEBP)",
    'image_seo_timing_total': "Total:",
    'image_seo_timing_avg': "ms | Avg/Image:",
    'image_seo_timing_resized': "ms | Resized:",
    'image_seo_ms': "ms"
};

const keys_fr = {
    'image_seo_title': "SEO d'images",
    'image_seo_desc': "Générez des noms d'images optimisés pour le SEO en utilisant le titre du produit, des mots-clés manuels et l'analyse d'image par l'IA.",
    'image_seo_product_title': "Titre du produit",
    'image_seo_product_title_placeholder': "ex. Bague de fiançailles en or rose",
    'image_seo_manual_keywords': "Mots-clés manuels (optionnel)",
    'image_seo_manual_keywords_placeholder': "ex. bague irlandaise, alliance, celtique",
    'image_seo_images_label': "Images (jusqu'à 15)",
    'image_seo_selected': "Sélectionné :",
    'image_seo_generating': "Génération...",
    'image_seo_generate_btn': "Générer des noms SEO",
    'image_seo_results_title': "Résultats",
    'image_seo_download_zip': "Télécharger ZIP (2000x2000 WEBP)",
    'image_seo_timing_total': "Total :",
    'image_seo_timing_avg': "ms | Moy/Image :",
    'image_seo_timing_resized': "ms | Redimensionné :",
    'image_seo_ms': "ms"
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
        console.log(`Updated ${path}`);
    } else {
        console.log(`No updates for ${path}`);
    }
}

inject('C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/en.ts', keys_en);
inject('C:/Users/baghe/.openclaw/workspace/etsyseolab-6/locales/fr.ts', keys_fr);
