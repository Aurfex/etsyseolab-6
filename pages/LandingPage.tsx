import React, { useState } from 'react';
import { Zap, Shield, BarChart3, ArrowRight, CheckCircle2, Star, Rocket, Layout, Bot, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import ParticleBackground from '../components/ParticleBackground';

const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t } = useTranslation();
  const { showToast } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, we'd call /api/waitlist
      // For now, we'll just show success
      setStatus('success');
      showToast({ tKey: 'waitlist_success', type: 'success' });
      setEmail('');
    } catch (err) {
      setStatus('error');
      showToast({ tKey: 'waitlist_error', type: 'error' });
    } finally {
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-2xl animate-fade-in">
        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
        <span className="font-bold text-green-700 dark:text-green-400">{t('waitlist_success_msg')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md mx-auto sm:mx-0 w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('waitlist_input_placeholder')}
          className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#F1641E] outline-none transition-all text-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-8 py-4 bg-[#F1641E] text-white rounded-2xl font-bold hover:bg-[#d4551a] hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center disabled:opacity-50"
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{t('waitlist_btn')}</span>
              <Send className="ml-2 w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all hover:border-purple-300 dark:hover:border-purple-700/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
      >
        <span className="font-bold text-gray-900 dark:text-white text-lg pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-purple-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { setPage, login } = useAppContext();

  const testimonials = [
    { name: t('landing_testi_1_name'), shop: "VintageVibePrints", content: t('landing_testi_1_content'), avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: t('landing_testi_2_name'), shop: "TheLeatherCraft", content: t('landing_testi_2_content'), avatar: "https://i.pravatar.cc/150?u=marco" },
    { name: t('landing_testi_3_name'), shop: "PetrovaJewelry", content: t('landing_testi_3_content'), avatar: "https://i.pravatar.cc/150?u=elena" }
  ];

  const features = [
    { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: t('landing_feat_ai_title'), description: t('landing_feat_ai_desc') },
    { icon: <BarChart3 className="w-6 h-6 text-blue-500" />, title: t('landing_feat_radar_title'), description: t('landing_feat_radar_desc') },
    { icon: <Bot className="w-6 h-6 text-purple-500" />, title: t('landing_feat_auto_title'), description: t('landing_feat_auto_desc') }
  ];

  const faqs = [
    { question: t('landing_faq_1_q'), answer: t('landing_faq_1_a') },
    { question: t('landing_faq_2_q'), answer: t('landing_faq_2_a') },
    { question: t('landing_faq_3_q'), answer: t('landing_faq_3_a') },
    { question: t('landing_faq_4_q'), answer: t('landing_faq_4_a') }
  ];

  const pricing = [
    {
      name: t('landing_price_1_name'),
      price: t('landing_price_1_price'),
      description: t('landing_price_1_desc'),
      features: [t('landing_price_1_feat_1'), t('landing_price_1_feat_2'), t('landing_price_1_feat_3')],
      buttonText: t('landing_price_1_btn'),
      highlight: false
    },
    {
      name: t('landing_price_2_name'),
      price: t('landing_price_2_price'),
      description: t('landing_price_2_desc'),
      features: [t('landing_price_2_feat_1'), t('landing_price_2_feat_2'), t('landing_price_2_feat_3'), t('landing_price_2_feat_4')],
      buttonText: t('landing_price_2_btn'),
      highlight: true
    },
    {
      name: t('landing_price_3_name'),
      price: t('landing_price_3_price'),
      description: t('landing_price_3_desc'),
      features: [t('landing_price_3_feat_1'), t('landing_price_3_feat_2'), t('landing_price_3_feat_3'), t('landing_price_3_feat_4')],
      buttonText: t('landing_price_3_btn'),
      highlight: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white selection:bg-purple-500/30 overflow-x-hidden">
      <ParticleBackground />
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 dark:bg-gray-950/60 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-7 w-7 text-[#F1641E] flex-shrink-0" />
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">ETSY SEOLAB</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="hover:text-purple-600 transition-colors">{t('landing_nav_features')}</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">{t('landing_nav_pricing')}</a>
            <button 
              onClick={login}
              className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold hover:scale-105 transition-transform"
            >
              {t('landing_nav_login')}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold mb-8 animate-fade-in">
            <Rocket className="w-4 h-4" />
            <span>{t('landing_social_proof')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-12 leading-[1.3] animate-fade-in-up">
            {t('landing_hero_title1')} <span className="text-[#F1641E]">Etsy</span> {t('landing_hero_title2')} <br />
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500 mt-4 py-2">AI Intelligence.</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-4 animate-fade-in-up delay-100">
            {t('landing_hero_subtitle')}
          </p>
          <p className="text-lg font-medium text-purple-600 dark:text-purple-400 mb-10 animate-fade-in-up delay-150 italic">
            "Hasti AI: Because your competitors need a reason to cry."
          </p>
          <div className="flex flex-col items-center justify-center animate-fade-in-up delay-200">
            <div className="mb-6 w-full max-w-lg">
              <WaitlistForm />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={login}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all flex items-center justify-center group"
              >
                {t('landing_hero_cta')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-center"
              >
                {t('landing_hero_secondary_cta')}
              </a>
            </div>
          </div>

          {/* Floating UI Mockup */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-fade-in delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent blur-3xl -z-10 rounded-full animate-pulse"></div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-2 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
              <img 
                src="/hasti-hero.png" 
                alt="Hasti AI Dashboard" 
                className="rounded-2xl w-full grayscale-[0.1] dark:grayscale-0 opacity-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative py-20 px-6 bg-gray-50/50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">{t('landing_feat_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('landing_feat_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">{t('landing_testi_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('landing_testi_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic mb-6">"{t.content}"</p>
                <div className="flex items-center space-x-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full bg-gray-200" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{t.shop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">{t('landing_pricing_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('landing_pricing_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((p, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${p.highlight ? 'border-purple-500 ring-4 ring-purple-500/10 bg-white dark:bg-gray-900 relative scale-105 z-10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'}`}>
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                    {t('landing_pricing_popular')}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{p.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{p.price}</span>
                  {p.price !== 'Free' && <span className="text-gray-500 ml-1">{t('landing_pricing_mo')}</span>}
                </div>
                <p className="text-sm text-gray-500 mb-8">{p.description}</p>
                <div className="space-y-4 mb-8">
                  {p.features.map((feat, j) => (
                    <div key={j} className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={login}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${p.highlight ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/20' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {p.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">{t('landing_faq_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400">Everything you need to know about Hasti AI.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-600/40 to-indigo-700/40 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8">{t('landing_cta_bottom_title')}</h2>
            <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
              {t('landing_cta_bottom_subtitle')}
            </p>
            <div className="max-w-md mx-auto">
              <WaitlistForm />
            </div>
            <p className="mt-6 text-sm text-purple-200">
              {t('landing_cta_bottom_note')}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Zap className="h-7 w-7 text-purple-600" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white uppercase">ETSY SEOLAB</span>
          </div>
          <div className="flex space-x-8 text-sm text-gray-500">
            <button onClick={() => setPage('privacy')} className="hover:text-purple-600 transition-colors">{t('landing_nav_privacy')}</button>
            <button onClick={() => setPage('terms')} className="hover:text-purple-600 transition-colors">{t('landing_nav_terms')}</button>
            <button onClick={() => setPage('contact')} className="hover:text-purple-600 transition-colors">{t('landing_nav_contact')}</button>
          </div>
          <div className="text-sm text-gray-500">
            © 2026 dXb Tech. Built with ❤️ for Etsy Sellers.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;