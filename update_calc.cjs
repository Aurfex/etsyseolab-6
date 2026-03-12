const fs = require('fs');

const en = {
    "calc_title": "Pricing Calculator",
    "calc_desc": "Etsy-matched sizes (6-12), 3 materials, full cost breakdown, and tax presets.",
    "calc_lbl_gold": "Gold Price / g",
    "calc_lbl_plat": "Platinum Price / g",
    "calc_lbl_silver": "Silver Fixed Price / Ring",
    "calc_lbl_base_weight": "Base Weight Size 7 (g)",
    "calc_refresh_live": "Refresh Live Metal Prices (CAD)",
    "calc_refreshing": "Refreshing metal prices...",
    "calc_lbl_design": "Design",
    "calc_lbl_3d": "3D Printing",
    "calc_lbl_casting": "Casting",
    "calc_lbl_finishing": "Soldering, Cleaning & Polishing",
    "calc_lbl_plating": "Plating",
    "calc_lbl_setting": "Stone Setting",
    "calc_lbl_engraving": "Laser Engraving",
    "calc_lbl_rhodium": "White Gold Rhodium Plating",
    "calc_lbl_cstone": "Center Stone",
    "calc_lbl_sstone": "Side Stones",
    "calc_lbl_hstone": "Hidden Stones",
    "calc_lbl_cert": "Certificate",
    "calc_lbl_markup": "Markup Multiplier (e.g. 1.2)",
    "calc_lbl_shipping": "Shipping",
    "calc_lbl_tax_preset": "Select Tax Preset",
    "calc_opt_qctax": "Quebec (14.975%)",
    "calc_opt_notax": "No Tax (0%)",
    "calc_lbl_tax_custom": "Or custom Tax %",
    "calc_export_csv": "Export CSV",
    "calc_table_size": "Size",
    "calc_table_material": "Material",
    "calc_table_prod": "Prod Cost",
    "calc_table_stone": "Stones+Cert",
    "calc_table_retail": "Retail Price",
    "calc_table_final": "Final (inc. Tax+Ship)"
};

const fr = {
    "calc_title": "Calculateur de prix",
    "calc_desc": "Tailles Etsy (6-12), 3 matériaux, détail complet des coûts et préréglages de taxes.",
    "calc_lbl_gold": "Prix de l'Or / g",
    "calc_lbl_plat": "Prix du Platine / g",
    "calc_lbl_silver": "Prix fixe Argent / Bague",
    "calc_lbl_base_weight": "Poids de base taille 7 (g)",
    "calc_refresh_live": "Actualiser les prix des métaux (CAD)",
    "calc_refreshing": "Actualisation des prix...",
    "calc_lbl_design": "Conception",
    "calc_lbl_3d": "Impression 3D",
    "calc_lbl_casting": "Moulage",
    "calc_lbl_finishing": "Soudure, nettoyage et polissage",
    "calc_lbl_plating": "Placage",
    "calc_lbl_setting": "Sertissage des pierres",
    "calc_lbl_engraving": "Gravure laser",
    "calc_lbl_rhodium": "Placage rhodium or blanc",
    "calc_lbl_cstone": "Pierre centrale",
    "calc_lbl_sstone": "Pierres latérales",
    "calc_lbl_hstone": "Pierres cachées",
    "calc_lbl_cert": "Certificat",
    "calc_lbl_markup": "Multiplicateur de marge (ex: 1.2)",
    "calc_lbl_shipping": "Livraison",
    "calc_lbl_tax_preset": "Sélectionner un préréglage de taxe",
    "calc_opt_qctax": "Québec (14.975%)",
    "calc_opt_notax": "Sans taxe (0%)",
    "calc_lbl_tax_custom": "Ou Taxe personnalisée %",
    "calc_export_csv": "Exporter CSV",
    "calc_table_size": "Taille",
    "calc_table_material": "Matériau",
    "calc_table_prod": "Coût Prod",
    "calc_table_stone": "Pierres+Cert",
    "calc_table_retail": "Prix détail",
    "calc_table_final": "Final (Taxe+Livr. incl.)"
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

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/PricingCalculatorPage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { Calculator, Download, RefreshCw } from 'lucide-react';", "import { Calculator, Download, RefreshCw } from 'lucide-react';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const PricingCalculatorPage: React.FC = () => {", "const PricingCalculatorPage: React.FC = () => {\n  const { t } = useTranslation();");
    
    txt = txt.replace("> Pricing Calculator<", "> {t('calc_title')}<");
    txt = txt.replace("Etsy-matched sizes (6-12), 3 materials, full cost breakdown, and tax presets.", "{t('calc_desc')}");
    txt = txt.replace('label="Gold Price / g"', 'label={t("calc_lbl_gold")}');
    txt = txt.replace('label="Platinum Price / g"', 'label={t("calc_lbl_plat")}');
    txt = txt.replace('label="Silver Fixed Price / Ring"', 'label={t("calc_lbl_silver")}');
    txt = txt.replace('label="Base Weight Size 7 (g)"', 'label={t("calc_lbl_base_weight")}');
    txt = txt.replace("{isRefreshingMetals ? 'Refreshing metal prices...' : 'Refresh Live Metal Prices (CAD)'}", "{isRefreshingMetals ? t('calc_refreshing') : t('calc_refresh_live')}");
    txt = txt.replace('label="Design"', 'label={t("calc_lbl_design")}');
    txt = txt.replace('label="3D Printing"', 'label={t("calc_lbl_3d")}');
    txt = txt.replace('label="Casting"', 'label={t("calc_lbl_casting")}');
    txt = txt.replace('label="Soldering, Cleaning & Polishing"', 'label={t("calc_lbl_finishing")}');
    txt = txt.replace('label="Plating"', 'label={t("calc_lbl_plating")}');
    txt = txt.replace('label="Stone Setting"', 'label={t("calc_lbl_setting")}');
    txt = txt.replace('label="Laser Engraving"', 'label={t("calc_lbl_engraving")}');
    txt = txt.replace('label="White Gold Rhodium Plating"', 'label={t("calc_lbl_rhodium")}');
    txt = txt.replace('label="Center Stone"', 'label={t("calc_lbl_cstone")}');
    txt = txt.replace('label="Side Stones"', 'label={t("calc_lbl_sstone")}');
    txt = txt.replace('label="Hidden Stones"', 'label={t("calc_lbl_hstone")}');
    txt = txt.replace('label="Certificate"', 'label={t("calc_lbl_cert")}');
    txt = txt.replace('label="Markup Multiplier (e.g. 1.2)"', 'label={t("calc_lbl_markup")}');
    txt = txt.replace('label="Shipping"', 'label={t("calc_lbl_shipping")}');
    txt = txt.replace(">Select Tax Preset<", ">{t('calc_lbl_tax_preset')}<");
    txt = txt.replace(">Quebec (14.975%)<", ">{t('calc_opt_qctax')}<");
    txt = txt.replace(">No Tax (0%)<", ">{t('calc_opt_notax')}<");
    txt = txt.replace(">Or custom Tax %<", ">{t('calc_lbl_tax_custom')}<");
    txt = txt.replace("> Export CSV<", "> {t('calc_export_csv')}<");
    txt = txt.replace(">Size<", ">{t('calc_table_size')}<");
    txt = txt.replace(">Material<", ">{t('calc_table_material')}<");
    txt = txt.replace(">Prod Cost<", ">{t('calc_table_prod')}<");
    txt = txt.replace(">Stones+Cert<", ">{t('calc_table_stone')}<");
    txt = txt.replace(">Retail Price<", ">{t('calc_table_retail')}<");
    txt = txt.replace(">Final (inc. Tax+Ship)<", ">{t('calc_table_final')}<");
    fs.writeFileSync(p, txt, 'utf8');
}
