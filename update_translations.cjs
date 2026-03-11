const fs = require('fs');

const keys_en = {
    'contact_success_message': "Message sent! We'll get back to you soon. 😘",
    'contact_back': "Back to Home",
    'contact_title': "Let's talk.",
    'contact_subtitle': "Have questions about Hasti AI or need help scaling your Etsy shop? We're here for you.",
    'contact_email_title': "Email Us",
    'contact_email_value': "hello@aswesee.com",
    'contact_chat_title': "Live Chat",
    'contact_chat_value': "Available Mon-Fri, 9am - 5pm EST",
    'contact_location_title': "Location",
    'contact_location_value': "Sainte-Anne-des-Plaines, Quebec, Canada",
    'contact_form_name': "Name",
    'contact_form_name_placeholder': "Dariush...",
    'contact_form_email': "Email",
    'contact_form_email_placeholder': "hello@example.com",
    'contact_form_message': "Message",
    'contact_form_message_placeholder': "How can we help?",
    'contact_form_submit': "Send Message"
};

const keys_fr = {
    'contact_success_message': "Message envoyé ! Nous vous répondrons bientôt. 😘",
    'contact_back': "Retour à l'accueil",
    'contact_title': "Parlons-en.",
    'contact_subtitle': "Vous avez des questions sur Hasti AI ou besoin d'aide pour développer votre boutique Etsy ? Nous sommes là pour vous.",
    'contact_email_title': "Écrivez-nous",
    'contact_email_value': "hello@aswesee.com",
    'contact_chat_title': "Chat en direct",
    'contact_chat_value': "Disponible Lun-Ven, 9h - 17h EST",
    'contact_location_title': "Emplacement",
    'contact_location_value': "Sainte-Anne-des-Plaines, Québec, Canada",
    'contact_form_name': "Nom",
    'contact_form_name_placeholder': "Dariush...",
    'contact_form_email': "Email",
    'contact_form_email_placeholder': "hello@example.com",
    'contact_form_message': "Message",
    'contact_form_message_placeholder': "Comment pouvons-nous vous aider ?",
    'contact_form_submit': "Envoyer le message"
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
