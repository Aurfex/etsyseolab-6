import React from 'react';
import { Sparkles, Zap, Shield, BarChart3, ArrowRight, CheckCircle2, Star, Rocket, Layout, Bot } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const LandingPage: React.FC = () => {
  const { setPage, login } = useAppContext();

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "AI-Powered SEO",
      description: "Automatically optimize your Etsy titles, tags, and descriptions with high-converting keywords."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      title: "Competitor Radar",
      description: "Spy on top sellers in your niche. See their keywords, pricing strategies, and rank potential."
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-500" />,
      title: "Hasti Autopilot",
      description: "Let our AI assistant manage your shop 24/7. It updates listings while you sleep."
    }
  ];

  const pricing = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for new Etsy sellers.",
      features: ["5 AI Optimizations / month", "Basic Competitor Analysis", "Standard Support"],
      buttonText: "Get Started",
      highlight: false
    },
    {
      name: "Growth",
      price: "$19",
      description: "Best for growing businesses.",
      features: ["Unlimited AI Optimizations", "Deep Competitor Radar", "Priority AI Queue", "Image SEO Tools"],
      buttonText: "Go Pro",
      highlight: true
    },
    {
      name: "Elite",
      price: "$49",
      description: "For serious power users.",
      features: ["Full Shop Automation", "Multi-shop Support", "Custom AI Voice Assistant", "White-glove Setup"],
      buttonText: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white selection:bg-purple-500/30">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">ETSY<span className="text-purple-600">SEOLAB</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing</a>
            <button 
              onClick={login}
              className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Login with Etsy
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold mb-8 animate-fade-in">
            <Rocket className="w-4 h-4" />
            <span>Powering 2,500+ Etsy Shops with AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in-up">
            Dominate Etsy Search with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-500">AI Intelligence.</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
            Stop guessing your keywords. Use Hasti AI to analyze your competitors, optimize your listings, and scale your sales automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-200">
            <button 
              onClick={login}
              className="w-full sm:w-auto px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center group"
            >
              Start Your Free Audit
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Floating UI Mockup */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-fade-in delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent blur-3xl -z-10 rounded-full"></div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden p-2">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                alt="Dashboard Preview" 
                className="rounded-2xl w-full grayscale-[0.5] dark:grayscale-0 opacity-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Everything you need to <br /> scale on Etsy.</h2>
            <p className="text-gray-500 dark:text-gray-400">Powered by the latest LLMs and real-time Etsy market data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Simple, transparent pricing.</h2>
            <p className="text-gray-500 dark:text-gray-400">Choose the plan that fits your growth stage.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((p, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${p.highlight ? 'border-purple-500 ring-4 ring-purple-500/10 bg-white dark:bg-gray-900 relative scale-105 z-10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'}`}>
                {p.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-black">{p.price}</span>
                  {p.price !== 'Free' && <span className="text-gray-500 ml-1">/mo</span>}
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

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-black tracking-tight">ETSY<span className="text-purple-600">SEOLAB</span></span>
          </div>
          <div className="flex space-x-8 text-sm text-gray-500">
            <button onClick={() => setPage('privacy')} className="hover:text-purple-600 transition-colors">Privacy Policy</button>
            <button onClick={() => setPage('terms')} className="hover:text-purple-600 transition-colors">Terms of Service</button>
            <button onClick={() => setPage('contact')} className="hover:text-purple-600 transition-colors">Contact</button>
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