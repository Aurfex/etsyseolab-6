const fs = require('fs');

const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/ImageSeoPage.tsx';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes('useTranslation')) {
    text = text.replace(
        "import { useAppContext } from '../contexts/AppContext';",
        "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';"
    );
    
    text = text.replace(
        "const { showToast } = useAppContext();",
        "const { showToast } = useAppContext();\n  const { t } = useTranslation();"
    );
    
    text = text.replace(">Image SEO<", ">{t('image_seo_title')}<");
    text = text.replace(">Generate SEO-friendly image names using product title, manual keywords, and AI image analysis.<", ">{t('image_seo_desc')}<");
    text = text.replace(">Product title<", ">{t('image_seo_product_title')}<");
    text = text.replace('placeholder="e.g. Rose Gold Claddagh Ring"', 'placeholder={t("image_seo_product_title_placeholder")}');
    text = text.replace(">Manual keywords (optional)<", ">{t('image_seo_manual_keywords')}<");
    text = text.replace('placeholder="e.g. irish ring, wedding band, celtic"', 'placeholder={t("image_seo_manual_keywords_placeholder")}');
    text = text.replace(">Images (up to 15)<", ">{t('image_seo_images_label')}<");
    text = text.replace("Selected: {files.length}", "{t('image_seo_selected')} {files.length}");
    text = text.replace("{isProcessing ? 'Generating...' : 'Generate SEO Names'}", "{isProcessing ? t('image_seo_generating') : t('image_seo_generate_btn')}");
    text = text.replace("> Results<", "> {t('image_seo_results_title')}<");
    text = text.replace("> Download ZIP (2000x2000 WEBP)<", "> {t('image_seo_download_zip')}<");
    text = text.replace("Total: {timing.totalMs} ms | Avg/Image: {timing.avgMs} ms | Resized: {timing.resizedCount}/{results.length}", "{t('image_seo_timing_total')} {timing.totalMs} {t('image_seo_timing_avg')} {timing.avgMs} {t('image_seo_timing_resized')} {timing.resizedCount}/{results.length}");
    text = text.replace("{r.ms ?? 0} ms", "{r.ms ?? 0} {t('image_seo_ms')}");

    fs.writeFileSync(path, text, 'utf8');
    console.log("Updated ImageSeoPage.tsx");
} else {
    console.log("Already updated ImageSeoPage.tsx");
}
