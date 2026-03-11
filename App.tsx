


import React from 'react';
import { Page } from './types';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import OptimizerPage from './pages/OptimizerPage';
import AutopilotPage from './pages/AutopilotPage';
import CompetitorRadarPage from './pages/CompetitorRadarPage';
import SettingsPage from './pages/SettingsPage';
import OptimoBot from './components/OptimoBot';
import Toast from './components/Toast';
import { useAppContext } from './contexts/AppContext';
import ReviewsPage from './pages/ReviewsPage';
import FaqPage from './pages/FaqPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import GiftFinderPage from './pages/GiftFinderPage';
import LoyaltyPage from './pages/LoyaltyPage';
import StoryMagazinePage from './pages/StoryMagazinePage';
import AddProductPage from './pages/AddProductPage';
import PricingCalculatorPage from './pages/PricingCalculatorPage';
import ImageSeoPage from './pages/ImageSeoPage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ContactPage from './pages/ContactPage';

const App: React.FC = () => {
  const { 
    page,
    toast,
    setToast,
    auth,
    handleOAuthCallback // Get this from context
  } = useAppContext();

  React.useEffect(() => {
    // Check for tokens in URL hash (returned from OAuth callback)
    const hash = window.location.hash.substring(1);
    console.log("🔍 Checking URL Hash:", hash); // Debug Log

    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      console.log("✅ Access Token Found!", accessToken.substring(0, 10) + "..."); // Debug Log
      
      // Update Context & Session Storage
      handleOAuthCallback(accessToken, refreshToken || undefined);
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      
    } else {
      console.log("❌ No Access Token in URL");
    }
    
    // Check for errors
    const errorParams = new URLSearchParams(window.location.search);
    const error = errorParams.get('error');
    if (error) {
      setToast({
        message: `Connection failed: ${error}`,
        type: 'error'
      });
    }
  }, [setToast, handleOAuthCallback]);

  const renderPage = () => {
    switch (page) {
      case 'optimizer':
        return <OptimizerPage />;
      case 'autopilot':
        return <AutopilotPage />;
      case 'competitor':
        return <CompetitorRadarPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'faq':
        return <FaqPage />;
      case 'assistant':
        return <VoiceAssistantPage />;
      case 'gift_finder':
        return <GiftFinderPage />;
      case 'loyalty':
        return <LoyaltyPage />;
      case 'story_magazine':
        return <StoryMagazinePage />;
      case 'add_product':
        return <AddProductPage />;
      case 'pricing':
        return <PricingCalculatorPage />;
      case 'image_seo':
        return <ImageSeoPage />;
      case 'settings':
        return <SettingsPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsOfServicePage />;
      case 'contact':
        return <ContactPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  // If not authenticated, allow Landing and legal/contact pages
  if (!auth.isAuthenticated) {
    const renderPublicPage = () => {
      switch (page) {
        case 'privacy': return <PrivacyPolicyPage />;
        case 'terms': return <TermsOfServicePage />;
        case 'contact': return <ContactPage />;
        default: return <LandingPage />;
      }
    };

    return (
      <>
        {renderPublicPage()}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <MainLayout>
      {renderPage()}
      <OptimoBot />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </MainLayout>
  );
};

export default App;