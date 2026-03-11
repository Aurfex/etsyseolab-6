import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const TermsOfServicePage: React.FC = () => {
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
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black">Terms of Service</h1>
        </div>

        <div className="prose prose-blue dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
          <p className="text-lg">Effective Date: March 10, 2026</p>
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>By connecting your Etsy shop to Etsyseolab, you agree to these terms. You are responsible for maintaining the security of your account and any actions taken under it.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. Use of AI Tools</h2>
            <p>Etsyseolab provides AI-generated suggestions for your shop. While we strive for accuracy, we cannot guarantee specific ranking results or compliance with all Etsy policies. Final approval of all changes rests with the user.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. Subscription and Fees</h2>
            <p>Some features require a paid subscription. Fees are non-refundable except where required by law. We reserve the right to change our pricing with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. Limitation of Liability</h2>
            <p>dXb Tech shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service or any changes made to your Etsy listings.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;