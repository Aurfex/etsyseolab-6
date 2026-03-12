const fs = require('fs');

const en = {
    "terms_title": "Terms of Service",
    "terms_back": "Back to Home",
    "terms_date": "Effective Date: March 10, 2026",
    "terms_s1_title": "1. Acceptance of Terms",
    "terms_s1_desc": "By connecting your Etsy shop to Etsyseolab, you agree to these terms. You are responsible for maintaining the security of your account and any actions taken under it.",
    "terms_s2_title": "2. Use of AI Tools",
    "terms_s2_desc": "Etsyseolab provides AI-generated suggestions for your shop. While we strive for accuracy, we cannot guarantee specific ranking results or compliance with all Etsy policies. Final approval of all changes rests with the user.",
    "terms_s3_title": "3. Subscription and Fees",
    "terms_s3_desc": "Some features require a paid subscription. Fees are non-refundable except where required by law. We reserve the right to change our pricing with 30 days notice.",
    "terms_s4_title": "4. Limitation of Liability",
    "terms_s4_desc": "dXb Tech shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service or any changes made to your Etsy listings."
};

const fr = {
    "terms_title": "Conditions d'utilisation",
    "terms_back": "Retour à l'accueil",
    "terms_date": "Date d'entrée en vigueur : 10 Mars 2026",
    "terms_s1_title": "1. Acceptation des conditions",
    "terms_s1_desc": "En connectant votre boutique Etsy à Etsyseolab, vous acceptez ces conditions. Vous êtes responsable du maintien de la sécurité de votre compte et de toutes les actions qui y sont effectuées.",
    "terms_s2_title": "2. Utilisation des outils d'IA",
    "terms_s2_desc": "Etsyseolab fournit des suggestions générées par l'IA pour votre boutique. Bien que nous visions l'exactitude, nous ne pouvons garantir des résultats de classement spécifiques ni la conformité avec toutes les politiques d'Etsy. L'approbation finale de toutes les modifications incombe à l'utilisateur.",
    "terms_s3_title": "3. Abonnement et frais",
    "terms_s3_desc": "Certaines fonctionnalités nécessitent un abonnement payant. Les frais ne sont pas remboursables, sauf si la loi l'exige. Nous nous réservons le droit de modifier nos prix avec un préavis de 30 jours.",
    "terms_s4_title": "4. Limitation de responsabilité",
    "terms_s4_desc": "dXb Tech ne pourra être tenu responsable des dommages indirects, accessoires ou consécutifs résultant de votre utilisation du service ou de toute modification apportée à vos fiches Etsy."
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

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/TermsOfServicePage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { useAppContext } from '../contexts/AppContext';", "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const { setPage, auth } = useAppContext();", "const { setPage, auth } = useAppContext();\n  const { t } = useTranslation();");
    txt = txt.replace(">Terms of Service<", ">{t('terms_title')}<");
    txt = txt.replace("Back to Home", "{t('terms_back')}");
    txt = txt.replace(">Effective Date: March 10, 2026<", ">{t('terms_date')}<");
    txt = txt.replace(">1. Acceptance of Terms<", ">{t('terms_s1_title')}<");
    txt = txt.replace(">By connecting your Etsy shop to Etsyseolab, you agree to these terms. You are responsible for maintaining the security of your account and any actions taken under it.<", ">{t('terms_s1_desc')}<");
    txt = txt.replace(">2. Use of AI Tools<", ">{t('terms_s2_title')}<");
    txt = txt.replace(">Etsyseolab provides AI-generated suggestions for your shop. While we strive for accuracy, we cannot guarantee specific ranking results or compliance with all Etsy policies. Final approval of all changes rests with the user.<", ">{t('terms_s2_desc')}<");
    txt = txt.replace(">3. Subscription and Fees<", ">{t('terms_s3_title')}<");
    txt = txt.replace(">Some features require a paid subscription. Fees are non-refundable except where required by law. We reserve the right to change our pricing with 30 days notice.<", ">{t('terms_s3_desc')}<");
    txt = txt.replace(">4. Limitation of Liability<", ">{t('terms_s4_title')}<");
    txt = txt.replace(">dXb Tech shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service or any changes made to your Etsy listings.<", ">{t('terms_s4_desc')}<");
    fs.writeFileSync(p, txt, 'utf8');
}
