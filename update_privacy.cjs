const fs = require('fs');

const en = {
    "privacy_title": "Privacy Policy",
    "privacy_back": "Back to Home",
    "privacy_intro": "We built Etsyseolab to help you grow, not to sell your data. Here is exactly how we handle your information.",
    "privacy_encrypted": "Encrypted Always",
    "privacy_encrypted_desc": "All data transferred between Etsy, our servers, and your browser is encrypted using industry-standard TLS.",
    "privacy_zero_selling": "Zero Data Selling",
    "privacy_zero_selling_desc": "We will never sell your shop data, product information, or customer details to third parties.",
    "privacy_s1_title": "1. Data We Collect",
    "privacy_s1_desc": "When you connect your Etsy shop, we only request the specific permissions needed to optimize your listings (e.g., reading products, updating titles/tags). We do not store your Etsy password.",
    "privacy_s2_title": "2. How AI Uses Your Data",
    "privacy_s2_desc": "We use large language models (like Gemini) to generate SEO suggestions. We use secure, private enterprise endpoints, meaning your product data is <strong>never used to train public AI models</strong>.",
    "privacy_s3_title": "3. Data Retention & Deletion",
    "privacy_s3_desc": "If you choose to disconnect your shop or delete your account, we will purge all associated Etsy data from our active databases within 30 days."
};

const fr = {
    "privacy_title": "Politique de confidentialité",
    "privacy_back": "Retour à l'accueil",
    "privacy_intro": "Nous avons créé Etsyseolab pour vous aider à vous développer, pas pour vendre vos données. Voici exactement comment nous gérons vos informations.",
    "privacy_encrypted": "Toujours crypté",
    "privacy_encrypted_desc": "Toutes les données transférées entre Etsy, nos serveurs et votre navigateur sont cryptées via le standard TLS.",
    "privacy_zero_selling": "Aucune vente de données",
    "privacy_zero_selling_desc": "Nous ne vendrons jamais les données de votre boutique, les informations sur vos produits ou les détails de vos clients.",
    "privacy_s1_title": "1. Les données que nous collectons",
    "privacy_s1_desc": "Lorsque vous connectez votre boutique Etsy, nous demandons uniquement les permissions nécessaires pour optimiser vos fiches (ex: lire les produits, modifier titres/tags). Nous ne stockons pas votre mot de passe.",
    "privacy_s2_title": "2. Comment l'IA utilise vos données",
    "privacy_s2_desc": "Nous utilisons des LLM (comme Gemini) pour générer des suggestions SEO. Vos données ne sont <strong>jamais utilisées pour entraîner des modèles d'IA publics</strong>.",
    "privacy_s3_title": "3. Conservation et suppression",
    "privacy_s3_desc": "Si vous déconnectez votre boutique ou supprimez votre compte, nous purgerons toutes les données Etsy associées de nos bases de données sous 30 jours."
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

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/PrivacyPolicyPage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { useAppContext } from '../contexts/AppContext';", "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const { setPage, auth } = useAppContext();", "const { setPage, auth } = useAppContext();\n  const { t } = useTranslation();");
    txt = txt.replace(">Privacy Policy<", ">{t('privacy_title')}<");
    txt = txt.replace(">Back to Home<", ">{t('privacy_back')}<");
    txt = txt.replace(/We built Etsyseolab.*information\./, "{t('privacy_intro')}");
    txt = txt.replace(">Encrypted Always<", ">{t('privacy_encrypted')}<");
    txt = txt.replace(">All data transferred between Etsy, our servers, and your browser is encrypted using industry-standard TLS.<", ">{t('privacy_encrypted_desc')}<");
    txt = txt.replace(">Zero Data Selling<", ">{t('privacy_zero_selling')}<");
    txt = txt.replace(">We will never sell your shop data, product information, or customer details to third parties.<", ">{t('privacy_zero_selling_desc')}<");
    txt = txt.replace(">1. Data We Collect<", ">{t('privacy_s1_title')}<");
    txt = txt.replace(">When you connect your Etsy shop, we only request the specific permissions needed to optimize your listings (e.g., reading products, updating titles/tags). We do not store your Etsy password.<", ">{t('privacy_s1_desc')}<");
    txt = txt.replace(">2. How AI Uses Your Data<", ">{t('privacy_s2_title')}<");
    txt = txt.replace(/We use large language models.*public AI models<\/strong>\./, "We use large language models (like Gemini) to generate SEO suggestions. We use secure, private enterprise endpoints, meaning your product data is <strong>never used to train public AI models</strong>.");
    txt = txt.replace(/We use large language models.*public AI models<\/strong>\./, "{/* eslint-disable-next-line react/no-danger */}\n            <p dangerouslySetInnerHTML={{ __html: t('privacy_s2_desc') }} />");
    txt = txt.replace(">3. Data Retention & Deletion<", ">{t('privacy_s3_title')}<");
    txt = txt.replace(">If you choose to disconnect your shop or delete your account, we will purge all associated Etsy data from our active databases within 30 days.<", ">{t('privacy_s3_desc')}<");
    fs.writeFileSync(p, txt, 'utf8');
}
