import React from 'react';
import { Mail, MessageSquare, MapPin, ArrowLeft, Send } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const ContactPage: React.FC = () => {
  const { setPage, auth, showToast } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({ message: "Message sent! We'll get back to you soon. 😘", type: 'success' });
    setTimeout(() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing'), 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-8 md:p-20">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => setPage(auth.isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center text-sm font-medium text-purple-600 mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-5xl font-black mb-6">Let's talk.</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10">
              Have questions about Hasti AI or need help scaling your Etsy shop? We're here for you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Email Us</h4>
                  <p className="text-gray-500">hello@aswesee.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Live Chat</h4>
                  <p className="text-gray-500">Available Mon-Fri, 9am - 5pm EST</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Location</h4>
                  <p className="text-gray-500">Sainte-Anne-des-Plaines, Quebec, Canada</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Name</label>
                  <input required type="text" className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Dariush..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Email</label>
                  <input required type="email" className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="hello@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Message</label>
                <textarea required rows={5} className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="How can we help?" />
              </div>
              <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 transition-all flex items-center justify-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;