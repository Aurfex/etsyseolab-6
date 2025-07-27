


import React from 'react';
import { Page } from './types';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import OptimizerPage from './pages/OptimizerPage';
import AutomationPage from './pages/AutomationPage';
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

const App: React.FC = () => {
  const { 
    page,
    toast,
    setToast,
  } = useAppContext();

  const renderPage = () => {
    switch (page) {
      case 'optimizer':
        return <OptimizerPage />;
      case 'automation':
        return <AutomationPage />;
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
      case 'settings':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
      <OptimoBot />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </MainLayout>
  );
};

export default App;