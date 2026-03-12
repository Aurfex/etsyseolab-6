const fs = require('fs');

const en = {
    "landing_nav_privacy": "Privacy",
    "landing_nav_terms": "Terms",
    "landing_nav_contact": "Contact",
    "landing_nav_login": "Login to Etsy",
    "landing_hero_badge": "🔥 The #1 AI Copilot for Etsy Sellers",
    "landing_hero_title1": "Dominate Etsy Search.",
    "landing_hero_title2": "While You Sleep.",
    "landing_hero_subtitle": "Hasti AI analyzes millions of data points to optimize your listings, spy on competitors, and skyrocket your sales. No SEO expertise required.",
    "landing_hero_cta": "Connect Your Etsy Shop",
    "landing_hero_secondary_cta": "See How It Works",
    "landing_social_proof": "Trusted by 10,000+ top Etsy sellers",
    "landing_feat_ai_title": "AI-Powered SEO",
    "landing_feat_ai_desc": "Automatically optimize your Etsy titles, tags, and descriptions with high-converting keywords.",
    "landing_feat_radar_title": "Competitor Radar",
    "landing_feat_radar_desc": "Spy on top sellers in your niche. See their keywords, pricing strategies, and rank potential.",
    "landing_feat_auto_title": "Hasti Autopilot",
    "landing_feat_auto_desc": "Let our AI assistant manage your shop 24/7. It updates listings while you sleep.",
    "landing_testi_title": "Don't just take our word for it.",
    "landing_testi_subtitle": "See what top Etsy sellers are saying about Hasti AI.",
    "landing_testi_1_name": "Sarah Jenkins",
    "landing_testi_1_content": "Hasti AI changed my life. My sales doubled in two weeks after optimizing my titles. It's like having a full-time SEO expert for pennies.",
    "landing_testi_2_name": "Marco Rossi",
    "landing_testi_2_content": "The Competitor Radar is insane. I finally understand why my competitors were outranking me. Now I'm the one leading the niche.",
    "landing_testi_3_name": "Elena Petrova",
    "landing_testi_3_content": "I was skeptical about AI, but Etsyseolab is so intuitive. The automation saves me hours every day. Simply brilliant.",
    "landing_faq_title": "Frequently Asked Questions",
    "landing_faq_1_q": "Is it safe to connect my Etsy shop?",
    "landing_faq_1_a": "Absolutely. We use Etsy's official, secure OAuth 2.0 API. We never see your password, and you can revoke access at any time directly from your Etsy settings.",
    "landing_faq_2_q": "Will Hasti AI change my listings without my permission?",
    "landing_faq_2_a": "Only if you want it to! By default, Hasti acts as an advisor—you review and approve every change. If you trust the AI, you can enable 'Autopilot' to let it optimize in the background.",
    "landing_faq_3_q": "How is this different from eRank or Marmalead?",
    "landing_faq_3_a": "Traditional tools give you overwhelming spreadsheets of raw data and expect you to do the hard work. Hasti AI is a generative co-pilot. We don't just show you the data; we actually write the optimized titles and tags for you.",
    "landing_faq_4_q": "Do I need to be a tech expert to use this?",
    "landing_faq_4_a": "Not at all. We built Hasti specifically for creative entrepreneurs. If you can click a button, you can use our AI.",
    "landing_cta_title": "Ready to scale your Etsy empire?",
    "landing_cta_subtitle": "Join thousands of sellers who are already using AI to dominate their niche.",
    "landing_cta_btn": "Start Your Free Trial Now",
    "landing_footer_rights": "© 2026 dXb Tech. All rights reserved.",
    "landing_footer_made_with": "Made with ❤️ in Quebec"
};

const fr = {
    "landing_nav_privacy": "Confidentialité",
    "landing_nav_terms": "Conditions",
    "landing_nav_contact": "Contact",
    "landing_nav_login": "Se connecter à Etsy",
    "landing_hero_badge": "🔥 Le Copilote IA #1 pour les vendeurs Etsy",
    "landing_hero_title1": "Dominez la recherche Etsy.",
    "landing_hero_title2": "Pendant que vous dormez.",
    "landing_hero_subtitle": "Hasti IA analyse des millions de points de données pour optimiser vos fiches, espionner vos concurrents et faire exploser vos ventes. Aucune expertise SEO requise.",
    "landing_hero_cta": "Connecter votre boutique Etsy",
    "landing_hero_secondary_cta": "Voir comment ça marche",
    "landing_social_proof": "Approuvé par +10 000 top vendeurs Etsy",
    "landing_feat_ai_title": "SEO propulsé par l'IA",
    "landing_feat_ai_desc": "Optimisez automatiquement vos titres, tags et descriptions Etsy avec des mots-clés qui convertissent.",
    "landing_feat_radar_title": "Radar de concurrents",
    "landing_feat_radar_desc": "Espionnez les meilleurs vendeurs de votre niche. Découvrez leurs mots-clés, prix et potentiel de classement.",
    "landing_feat_auto_title": "Pilote automatique",
    "landing_feat_auto_desc": "Laissez notre assistant IA gérer votre boutique 24/7. Il met à jour vos fiches pendant que vous dormez.",
    "landing_testi_title": "Ne nous croyez pas sur parole.",
    "landing_testi_subtitle": "Découvrez ce que les meilleurs vendeurs Etsy disent de Hasti IA.",
    "landing_testi_1_name": "Sarah Jenkins",
    "landing_testi_1_content": "Hasti IA a changé ma vie. Mes ventes ont doublé en deux semaines. C'est comme avoir un expert SEO à temps plein pour quelques centimes.",
    "landing_testi_2_name": "Marco Rossi",
    "landing_testi_2_content": "Le radar de concurrents est incroyable. J'ai enfin compris pourquoi mes concurrents me dépassaient. Maintenant, c'est moi qui mène la niche.",
    "landing_testi_3_name": "Elena Petrova",
    "landing_testi_3_content": "J'étais sceptique vis-à-vis de l'IA, mais c'est tellement intuitif. L'automatisation me fait gagner des heures chaque jour. Tout simplement brillant.",
    "landing_faq_title": "Questions fréquentes",
    "landing_faq_1_q": "Est-il sûr de connecter ma boutique Etsy ?",
    "landing_faq_1_a": "Absolument. Nous utilisons l'API officielle et sécurisée OAuth 2.0 d'Etsy. Nous ne voyons jamais votre mot de passe.",
    "landing_faq_2_q": "L'IA modifiera-t-elle mes fiches sans ma permission ?",
    "landing_faq_2_a": "Seulement si vous le souhaitez ! Par défaut, Hasti agit comme un conseiller—vous approuvez chaque changement.",
    "landing_faq_3_q": "En quoi est-ce différent d'eRank ou Marmalead ?",
    "landing_faq_3_a": "Les outils traditionnels vous donnent des feuilles de calcul brutes. Hasti IA est un copilote génératif. Nous écrivons les titres et tags pour vous.",
    "landing_faq_4_q": "Dois-je être un expert technique ?",
    "landing_faq_4_a": "Pas du tout. Nous avons conçu Hasti pour les entrepreneurs créatifs. Si vous savez cliquer sur un bouton, vous savez utiliser notre IA.",
    "landing_cta_title": "Prêt à développer votre empire Etsy ?",
    "landing_cta_subtitle": "Rejoignez des milliers de vendeurs qui utilisent déjà l'IA pour dominer leur niche.",
    "landing_cta_btn": "Commencer votre essai gratuit",
    "landing_footer_rights": "© 2026 dXb Tech. Tous droits réservés.",
    "landing_footer_made_with": "Fait avec ❤️ au Québec"
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

let p = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/pages/LandingPage.tsx';
let txt = fs.readFileSync(p, 'utf8');
if(!txt.includes('useTranslation')) {
    txt = txt.replace("import { useAppContext } from '../contexts/AppContext';", "import { useAppContext } from '../contexts/AppContext';\nimport { useTranslation } from '../contexts/LanguageContext';");
    txt = txt.replace("const LandingPage: React.FC = () => {", "const LandingPage: React.FC = () => {\n  const { t } = useTranslation();");
    
    // Instead of replacing every little string in the arrays via simple regex which is error prone,
    // let's rewrite the arrays to use translation keys.
    txt = txt.replace(/const testimonials = \[[\s\S]*?\];/, `const testimonials = [
    { name: t('landing_testi_1_name'), shop: "VintageVibePrints", content: t('landing_testi_1_content'), avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: t('landing_testi_2_name'), shop: "TheLeatherCraft", content: t('landing_testi_2_content'), avatar: "https://i.pravatar.cc/150?u=marco" },
    { name: t('landing_testi_3_name'), shop: "PetrovaJewelry", content: t('landing_testi_3_content'), avatar: "https://i.pravatar.cc/150?u=elena" }
  ];`);

    txt = txt.replace(/const features = \[[\s\S]*?\];/, `const features = [
    { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: t('landing_feat_ai_title'), description: t('landing_feat_ai_desc') },
    { icon: <BarChart3 className="w-6 h-6 text-blue-500" />, title: t('landing_feat_radar_title'), description: t('landing_feat_radar_desc') },
    { icon: <Bot className="w-6 h-6 text-purple-500" />, title: t('landing_feat_auto_title'), description: t('landing_feat_auto_desc') }
  ];`);

    txt = txt.replace(/const faqs = \[[\s\S]*?\];/, `const faqs = [
    { question: t('landing_faq_1_q'), answer: t('landing_faq_1_a') },
    { question: t('landing_faq_2_q'), answer: t('landing_faq_2_a') },
    { question: t('landing_faq_3_q'), answer: t('landing_faq_3_a') },
    { question: t('landing_faq_4_q'), answer: t('landing_faq_4_a') }
  ];`);

    txt = txt.replace(/>Privacy</g, ">{t('landing_nav_privacy')}<");
    txt = txt.replace(/>Terms</g, ">{t('landing_nav_terms')}<");
    txt = txt.replace(/>Contact</g, ">{t('landing_nav_contact')}<");
    txt = txt.replace(/>Login to Etsy</g, ">{t('landing_nav_login')}<");

    txt = txt.replace(">🔥 The #1 AI Copilot for Etsy Sellers<", ">🔥 {t('landing_hero_badge')}<");
    txt = txt.replace("Dominate Etsy Search.", "{t('landing_hero_title1')}");
    txt = txt.replace("While You Sleep.", "{t('landing_hero_title2')}");
    txt = txt.replace("Hasti AI analyzes millions of data points to optimize your listings, spy on competitors, and skyrocket your sales. No SEO expertise required.", "{t('landing_hero_subtitle')}");
    txt = txt.replace("Connect Your Etsy Shop", "{t('landing_hero_cta')}");
    txt = txt.replace("See How It Works", "{t('landing_hero_secondary_cta')}");
    txt = txt.replace(">Trusted by 10,000+ top Etsy sellers<", ">{t('landing_social_proof')}<");
    txt = txt.replace("Don't just take our word for it.", "{t('landing_testi_title')}");
    txt = txt.replace("See what top Etsy sellers are saying about Hasti AI.", "{t('landing_testi_subtitle')}");
    txt = txt.replace("Frequently Asked Questions", "{t('landing_faq_title')}");
    txt = txt.replace("Ready to scale your Etsy empire?", "{t('landing_cta_title')}");
    txt = txt.replace("Join thousands of sellers who are already using AI to dominate their niche.", "{t('landing_cta_subtitle')}");
    txt = txt.replace("Start Your Free Trial Now", "{t('landing_cta_btn')}");
    txt = txt.replace("© 2026 dXb Tech. All rights reserved.", "{t('landing_footer_rights')}");
    txt = txt.replace("Made with ❤️ in Quebec", "{t('landing_footer_made_with')}");

    fs.writeFileSync(p, txt, 'utf8');
}
