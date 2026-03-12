const fs = require('fs');

const en = {
    "sales_title": "Sales & SEO Intelligence",
    "sales_desc": "Generate professional PDF reports of your store performance.",
    "sales_generate_btn": "Generate Full PDF Report",
    "sales_generating": "Compiling Data...",
    "sales_historical_title": "Historical Reports",
    "sales_download_txt": "Download",
    "sales_col_date": "Date",
    "sales_col_name": "Report Name",
    "sales_col_type": "Type",
    "sales_col_action": "Action",
    "sales_report_1": "February 2026 Performance",
    "sales_report_2": "Q4 2025 Wrap-up",
    "sales_report_3": "Holiday Season SEO Impact"
};

const fr = {
    "sales_title": "Rapports de ventes & SEO",
    "sales_desc": "Générez des rapports PDF professionnels sur les performances de votre boutique.",
    "sales_generate_btn": "Générer le rapport PDF complet",
    "sales_generating": "Compilation des données...",
    "sales_historical_title": "Rapports historiques",
    "sales_download_txt": "Télécharger",
    "sales_col_date": "Date",
    "sales_col_name": "Nom du rapport",
    "sales_col_type": "Type",
    "sales_col_action": "Action",
    "sales_report_1": "Performances Février 2026",
    "sales_report_2": "Bilan T4 2025",
    "sales_report_3": "Impact SEO période des fêtes"
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

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/SalesReportPage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { useAppContext } from '../contexts/AppContext';", "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const { activityLogs } = useAppContext();", "const { activityLogs } = useAppContext();\n    const { t } = useTranslation();");
    txt = txt.replace(">Sales & SEO Intelligence<", ">{t('sales_title')}<");
    txt = txt.replace(">Generate professional PDF reports of your store performance.<", ">{t('sales_desc')}<");
    txt = txt.replace("Generate Full PDF Report", "{t('sales_generate_btn')}");
    txt = txt.replace("Compiling Data...", "{t('sales_generating')}");
    txt = txt.replace(">Historical Reports<", ">{t('sales_historical_title')}<");
    txt = txt.replace(/>Download</g, ">{t('sales_download_txt')}<");
    txt = txt.replace(">Date<", ">{t('sales_col_date')}<");
    txt = txt.replace(">Report Name<", ">{t('sales_col_name')}<");
    txt = txt.replace(">Type<", ">{t('sales_col_type')}<");
    txt = txt.replace(">Action<", ">{t('sales_col_action')}<");
    txt = txt.replace("February 2026 Performance", "{t('sales_report_1')}");
    txt = txt.replace("Q4 2025 Wrap-up", "{t('sales_report_2')}");
    txt = txt.replace("Holiday Season SEO Impact", "{t('sales_report_3')}");
    fs.writeFileSync(p, txt, 'utf8');
}
