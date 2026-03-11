import React from 'react';
import { Shield, ArrowLeft, Lock, FileText, Server } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const PrivacyPolicyPage: React.FC = () => {
  const { setPage, auth } = useAppContext();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-8 md:p-20">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center text-sm font-medium text-purple-600 mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div className="flex items-center space-x-3 mb-10">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black">Privacy Policy</h1>
        </div>

        <div className="prose prose-purple dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-400">
          <p className="text-lg font-medium text-gray-900 dark:text-white border-l-4 border-purple-500 pl-4">
            We built Etsyseolab to help you grow, not to sell your data. Here is exactly how we handle your information.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Lock className="w-6 h-6 text-purple-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Encrypted Always</h3>
              <p className="text-sm">All data transferred between Etsy, our servers, and your browser is encrypted using industry-standard TLS.</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <Server className="w-6 h-6 text-purple-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Zero Data Selling</h3>
              <p className="text-sm">We will never sell your shop data, product information, or customer details to third parties.</p>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Data We Collect</h2>
            <p>When you connect your Etsy shop, we only request the specific permissions needed to optimize your listings (e.g., reading products, updating titles/tags). We do not store your Etsy password.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. How AI Uses Your Data</h2>
            <p>We use large language models (like Gemini) to generate SEO suggestions. We use secure, private enterprise endpoints, meaning your product data is <strong>never used to train public AI models</strong>.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Data Retention & Deletion</h2>
            <p>If you choose to disconnect your shop or delete your account, we will purge all associated Etsy data from our active databases within 30 days.</p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;