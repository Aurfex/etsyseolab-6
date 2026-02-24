import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Product, OptimizationResult, ActivityLog, Settings, Theme, CompetitorData, ActivityType, ToastData, Page, Review, ReviewResponse, FullReviewData, QuickReply, ReviewResponseStatus, ReviewAnalyticsData, Auth, FAQ, SuggestedQuestion, AssistantResponse, GiftFinderQuiz, GiftFinderResponse, LoyaltyData, Story, NewProductData, EtsyCategory } from '../types';
import { MOCK_PRODUCTS } from '../utils/mockData';
import { runFullOptimization as apiRunFullOptimization } from '../services/geminiService';
import { MOCK_FULL_REVIEWS, MOCK_QUICK_REPLIES } from '../utils/mockFullReviews';
import { MOCK_FAQS, MOCK_SUGGESTED_QUESTIONS } from '../utils/mockFaqs';
import { MOCK_LOYALTY_DATA } from '../utils/mockLoyalty';
import { MOCK_STORIES } from '../utils/mockStories';
import { generateSeoMetadata as apiGenerateSeoMetadata } from '../services/aiMetadataService';
import { createListing, uploadListingImage } from '../services/etsyApiService';
import { MOCK_ETSY_CATEGORIES } from '../utils/mockEtsyData';


export type ConnectionStatus = 'untested' | 'ok' | 'error' | 'loading';

interface AppContextType {
  page: Page;
  setPage: (page: Page) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  products: Product[];
  activityLogs: ActivityLog[];
  settings: Settings;
  effectiveTheme: 'light' | 'dark';
  updateSettings: (newSettings: Settings) => void;
  resetSettings: () => void;
  runFullOptimization: (product: Product) => Promise<OptimizationResult>;
  runAutomationTask: (type: ActivityType, tKey: string) => Promise<void>;
  runAutopilotFix: (productsToFix: Product[]) => Promise<void>;
  analyzeCompetitor: (url: string) => Promise<void>;
  competitorData: CompetitorData | null;
  toast: ToastData | null;
  setToast: (toast: ToastData | null) => void;
  showToast: (toastData: ToastData) => void;
  // Auth
  auth: Auth;
  login: () => void;
  logout: () => void;
  handleOAuthCallback: (token: string, refreshToken?: string) => void;
  // Reviews
  reviewsData: FullReviewData[];
  quickReplies: QuickReply[];
  isReviewsLoading: boolean;
  reviewsError: string | null;
  fetchReviewData: () => Promise<void>;
  generateReviewResponse: (reviewId: string) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: ReviewResponseStatus, text?: string) => Promise<void>;
  saveEditedResponse: (reviewId: string, newText: string) => Promise<void>;
  getReviewAnalytics: () => ReviewAnalyticsData;
  // FAQ
  faqs: FAQ[];
  suggestedQuestions: SuggestedQuestion[];
  isFaqLoading: boolean;
  faqError: string | null;
  fetchFaqData: () => Promise<void>;
  scanForFaqs: () => Promise<void>;
  generateFaqAnswer: (suggestionId: string, questionText: string) => Promise<void>;
  publishFaq: (suggestionId: string, question: string, answer: string) => Promise<void>;
  updateFaq: (faqId: string, question: string, answer: string) => Promise<void>;
  deleteFaq: (faqId: string) => Promise<void>;
  // Assistant
  askAssistant: (query: string) => Promise<AssistantResponse>;
  // Gift Finder
  findGifts: (quiz: GiftFinderQuiz) => Promise<GiftFinderResponse>;
  // Loyalty
  loyaltyData: LoyaltyData | null;
  isLoyaltyLoading: boolean;
  loyaltyError: string | null;
  fetchLoyaltyData: () => Promise<void>;
  redeemLoyaltyReward: (rewardId: string) => Promise<void>;
  // Story Magazine
  stories: Story[];
  isStoriesLoading: boolean;
  storiesError: string | null;
  fetchStories: () => Promise<void>;
  saveStory: (story: Omit<Story, 'createdAt' | 'updatedAt' | 'slug'>) => Promise<void>;
  // Add Product
  newProductData: Partial<NewProductData>;
  updateNewProductData: (data: Partial<NewProductData>) => void;
  generateSeoMetadata: (details: Pick<NewProductData, 'title' | 'description'>) => Promise<Pick<NewProductData, 'title' | 'description' | 'tags'>>;
  publishNewProduct: (productData: NewProductData) => Promise<void>;
  etsyCategories: EtsyCategory[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: Settings = {
    language: 'en',
    theme: 'light',
    autopilot: {
        enabled: true,
        frequency: '6h',
        safeMode: true,
        autoApprove: true,
        notifications: true,
        analytics: true,
    },
    mockMode: true,
};

const defaultUnauthenticatedAuth: Auth = {
    isAuthenticated: false,
    token: null,
    user: null,
};

const defaultNewProductData: Partial<NewProductData> = {
    title: '',
    taxonomy_id: null,
    price: 0,
    quantity: 1,
    who_made: 'i_did',
    when_made: '2020_2024',
    is_supply: false,
    images: [],
    description: '',
    tags: []
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [page, setPage] = useState<AppContextType['page']>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [settings, setSettingsState] = useState<Settings>(() => {
        const saved = localStorage.getItem('appSettings');
        const initial = saved ? JSON.parse(saved) : defaultSettings;
        if (initial.mockMode === undefined) initial.mockMode = defaultSettings.mockMode;
        return initial;
    });
    const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);
    const [toast, setToast] = useState<ToastData | null>(null);
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
    
    // Auth State
    const [auth, setAuth] = useState<Auth>(() => {
        const savedAuth = sessionStorage.getItem('auth');
        return savedAuth ? JSON.parse(savedAuth) : defaultUnauthenticatedAuth;
    });

    // Review State
    const [reviewsData, setReviewsData] = useState<FullReviewData[]>([]);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false);
    const [reviewsError, setReviewsError] = useState<string | null>(null);

    // FAQ State
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
    const [isFaqLoading, setIsFaqLoading] = useState<boolean>(false);
    const [faqError, setFaqError] = useState<string | null>(null);

    // Loyalty State
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
    const [isLoyaltyLoading, setIsLoyaltyLoading] = useState<boolean>(false);
    const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
    
    // Story Magazine State
    const [stories, setStories] = useState<Story[]>([]);
    const [isStoriesLoading, setIsStoriesLoading] = useState<boolean>(false);
    const [storiesError, setStoriesError] = useState<string | null>(null);
    
    // Add Product State
    const [newProductData, setNewProductData] = useState<Partial<NewProductData>>(defaultNewProductData);
    const etsyCategories = MOCK_ETSY_CATEGORIES;


    // Sidebar State
     useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            setIsSidebarCollapsed(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
            return newState;
        });
    }, []);

     const showToast = useCallback((toastData: ToastData) => {
        setToast(toastData);
    }, []);

    // --- Auth Logic ---
    const login = useCallback(() => {
        // Redirect to OAuth login endpoint
        window.location.href = '/api/auth/login';
    }, []);
    
    const handleOAuthCallback = useCallback((token: string, refreshToken?: string) => {
        const newAuth: Auth = {
            isAuthenticated: true,
            token,
            refreshToken: refreshToken || null,
            user: { name: 'Etsy Seller', email: 'seller@etsy.com' } // Placeholder user info
        };
        // Update state
        setAuth(newAuth);
        // Persist to session storage
        sessionStorage.setItem('auth', JSON.stringify(newAuth));
        showToast({ message: 'Successfully connected to Etsy! 🎉', type: 'success' });
        
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
    }, [showToast]);

    const logout = useCallback(() => {
        sessionStorage.removeItem('auth');
        setAuth(defaultUnauthenticatedAuth);
        showToast({ message: 'Logged out successfully', type: 'info' });
        // Optional: Redirect to home to clear URL params if needed
        window.history.replaceState(null, '', '/');
    }, [showToast]);

    useEffect(() => {
        if (auth.isAuthenticated) {
            sessionStorage.setItem('auth', JSON.stringify(auth));
        } else {
            sessionStorage.removeItem('auth');
        }
    }, [auth]);
    
     const addLog = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
        setActivityLogs(prev => [...prev, { ...log, id: Date.now().toString(), timestamp: new Date() }]);
    }, []);

    const makeApiCall = useCallback(async (endpoint: string, method: 'GET' | 'POST', body?: object) => {
        if (!auth.token) throw new Error('Not authenticated.');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            
            return response.json();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. The server may be unresponsive.');
            }
            throw error;
        } finally {
             clearTimeout(timeoutId);
        }
    }, [auth.token]);


    // --- Data Fetching ---
    useEffect(() => {
        if (auth.isAuthenticated && auth.token) {
            setReviewsError(null);
            setFaqError(null);
            setLoyaltyError(null);
            setStoriesError(null);

            setIsReviewsLoading(true);
            setTimeout(() => {
                setReviewsData(MOCK_FULL_REVIEWS);
                setQuickReplies(MOCK_QUICK_REPLIES);
                setIsReviewsLoading(false);
            }, 300);

            setIsFaqLoading(true);
            setTimeout(() => {
                setFaqs(MOCK_FAQS);
                setSuggestedQuestions(MOCK_SUGGESTED_QUESTIONS.map((s, i) => ({ ...s, id: `mock-sugg-${i}` })));
                setIsFaqLoading(false);
            }, 400);

            setIsLoyaltyLoading(true);
            setTimeout(() => {
                setLoyaltyData(MOCK_LOYALTY_DATA);
                setIsLoyaltyLoading(false);
            }, 500);
            
            setIsStoriesLoading(true);
            setTimeout(() => {
                setStories(MOCK_STORIES);
                setIsStoriesLoading(false);
            }, 600);

        } else {
            setReviewsData([]);
            setQuickReplies([]);
            setIsReviewsLoading(false);
            setReviewsError(null);
            
            setFaqs([]);
            setSuggestedQuestions([]);
            setIsFaqLoading(false);
            setFaqError(null);

            setLoyaltyData(null);
            setIsLoyaltyLoading(false);
            setLoyaltyError(null);

            setStories([]);
            setIsStoriesLoading(false);
            setStoriesError(null);
        }
    }, [auth.isAuthenticated, auth.token]);

    const fetchReviewData = useCallback(async () => {
        try {
            const data = await makeApiCall('/api/reviews', 'GET');
            setReviewsData(data.reviews);
            setQuickReplies(data.quickReplies);
        } catch (error: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: error.message }, type: 'error' });
        }
    }, [makeApiCall, showToast]);

    const fetchFaqData = useCallback(async () => {
         try {
            const data = await makeApiCall('/api/faq', 'GET');
            setFaqs(data.faqs);
            setSuggestedQuestions(data.suggestedQuestions);
        } catch (error: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: error.message }, type: 'error' });
        }
    }, [makeApiCall, showToast]);

     const fetchLoyaltyData = useCallback(async () => {
         try {
            const data = await makeApiCall('/api/loyalty', 'GET');
            setLoyaltyData(data);
        } catch (error: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: error.message }, type: 'error' });
        }
    }, [makeApiCall, showToast]);

    const fetchStories = useCallback(async () => {
         try {
            const data = await makeApiCall('/api/story', 'GET');
            setStories(data.stories);
        } catch (error: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: error.message }, type: 'error' });
        }
    }, [makeApiCall, showToast]);
    
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (themeToApply: 'light' | 'dark') => {
            root.classList.toggle('dark', themeToApply === 'dark');
            setEffectiveTheme(themeToApply);
        };

        if (settings.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches ? 'dark' : 'light');
            const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        } else {
            applyTheme(settings.theme);
        }
    }, [settings.theme]);

    const updateSettings = useCallback((newSettings: Settings) => {
        setSettingsState(newSettings);
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
    }, []);

    const resetSettings = useCallback(() => {
        localStorage.removeItem('appSettings');
        setSettingsState(defaultSettings);
        showToast({ tKey: 'toast_settings_reset', type: 'success' });
    }, [showToast]);

    const runFullOptimization = useCallback(async (product: Product): Promise<OptimizationResult> => {
        if (!settings.mockMode) {
             addLog({ type: 'title_optimization', tKey: 'log_optimization_started', subtitle: product.title, status: 'Processing' });
        }
        try {
            const result = await apiRunFullOptimization(product);
            const newSeoScore = Math.min(99, product.seoScore + Math.floor(Math.random() * 15) + 5);
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...result, seoScore: newSeoScore } : p));
            addLog({ type: 'title_optimization', tKey: 'log_optimization_successful', subtitle: product.title, status: 'Success', change: `SEO +${newSeoScore - product.seoScore}%` });
            showToast({ tKey: 'toast_optimization_successful', type: 'success' });
            return result;
        } catch (e: any) {
            addLog({ type: 'title_optimization', tKey: 'log_optimization_failed', subtitle: product.title, status: 'Failed' });
            showToast({ tKey: 'toast_optimization_failed', options: { error: e.message }, type: 'error' });
            throw e;
        }
    }, [addLog, showToast, settings.mockMode]);
    
    const generateReviewResponse = useCallback(async (reviewId: string) => {
        const review = reviewsData.find(r => r.id === reviewId);
        if (!review) return;
        addLog({ type: 'review_response_generated', tKey: 'log_review_response_started', subtitle: `for ${review.customerName}`, status: 'Processing' });
        try {
            await makeApiCall('/api/reviews', 'POST', { action: 'generate_response', reviewId });
            await fetchReviewData();
            addLog({ type: 'review_response_generated', tKey: 'log_review_response_success', subtitle: `for ${review.customerName}`, status: 'Success' });
            showToast({ tKey: 'toast_review_response_success', type: 'success'});
        } catch (e: any) {
            addLog({ type: 'review_response_generated', tKey: 'log_review_response_failed', subtitle: `for ${review.customerName}`, status: 'Failed' });
            showToast({ tKey: 'toast_review_response_failed', options: { error: e.message }, type: 'error' });
        }
    }, [reviewsData, addLog, makeApiCall, fetchReviewData, showToast]);
    
    const updateReviewStatus = useCallback(async (reviewId: string, status: ReviewResponseStatus) => {
        try {
            await makeApiCall('/api/reviews', 'POST', { action: 'update_status', reviewId, payload: { status } });
            await fetchReviewData();
            showToast({ tKey: `toast_review_status_${status}`, type: 'success' });
            if(status === 'posting') addLog({ type: 'review_response_post_started', tKey: 'log_review_post_started', status: 'Running' });
        } catch (e: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchReviewData, showToast, addLog]);
    
    const saveEditedResponse = useCallback(async (reviewId: string, newText: string) => {
        try {
            await makeApiCall('/api/reviews', 'POST', { action: 'update_text', reviewId, payload: { responseText: newText } });
            await fetchReviewData();
            showToast({ tKey: 'toast_review_response_saved', type: 'success' });
        } catch (e: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchReviewData, showToast]);
    
    const getReviewAnalytics = useCallback((): ReviewAnalyticsData => {
        const totalReviews = reviewsData.length;
        const averageRating = totalReviews > 0 ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / totalReviews : 0;
        let sentimentCounts = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
        let statusCounts = { responded: 0, unanswered: 0, pending_approval: 0 };
        
        reviewsData.forEach(r => {
            if (r.response) {
                sentimentCounts[r.response.sentiment] = (sentimentCounts[r.response.sentiment] || 0) + 1;
                if(r.response.status === 'posted') statusCounts.responded++;
                if(r.response.status === 'pending_approval' || r.response.status === 'approved') statusCounts.pending_approval++;
            } else {
                statusCounts.unanswered++;
            }
        });
        
        return { totalReviews, averageRating, sentimentCounts, statusCounts };
    }, [reviewsData]);

    const scanForFaqs = useCallback(async () => {
        addLog({ type: 'faq_scan_started', tKey: 'log_faq_scan_started', status: 'Running' });
        try {
            await makeApiCall('/api/faq', 'POST', { action: 'scan_for_questions' });
            await fetchFaqData();
            addLog({ type: 'faq_scan_completed', tKey: 'log_faq_scan_completed', status: 'Success' });
            showToast({ tKey: 'toast_faq_scan_completed', type: 'success' });
        } catch (e: any) {
            addLog({ type: 'faq_scan_started', tKey: 'log_faq_scan_failed', status: 'Failed' });
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [addLog, makeApiCall, fetchFaqData, showToast]);
    
    const generateFaqAnswer = useCallback(async (suggestionId: string, questionText: string) => {
        setSuggestedQuestions(prev => prev.map(s => s.id === suggestionId ? { ...s, isGenerating: true } : s));
        addLog({ type: 'faq_answer_generated', tKey: 'log_faq_answer_generation_started', status: 'Processing' });
        try {
            const { answer } = await makeApiCall('/api/faq', 'POST', { action: 'generate_answer', payload: { questionText } });
            setSuggestedQuestions(prev => prev.map(s => s.id === suggestionId ? { ...s, generatedAnswer: answer, isGenerating: false } : s));
            addLog({ type: 'faq_answer_generated', tKey: 'log_faq_answer_generation_success', status: 'Success' });
        } catch (e: any) {
             setSuggestedQuestions(prev => prev.map(s => s.id === suggestionId ? { ...s, isGenerating: false } : s));
             addLog({ type: 'faq_answer_generated', tKey: 'log_faq_answer_generation_failed', status: 'Failed' });
             showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [addLog, makeApiCall, showToast]);

    const publishFaq = useCallback(async (suggestionId: string, question: string, answer: string) => {
        try {
            await makeApiCall('/api/faq', 'POST', { action: 'publish_faq', payload: { suggestionId, question, answer } });
            await fetchFaqData();
            addLog({ type: 'faq_published', tKey: 'log_faq_published', subtitle: question, status: 'Success' });
            showToast({ tKey: 'toast_faq_published', type: 'success' });
        } catch (e: any) {
             showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchFaqData, addLog, showToast]);
    
    const updateFaq = useCallback(async (faqId: string, question: string, answer: string) => {
        try {
            await makeApiCall('/api/faq', 'POST', { action: 'update_faq', payload: { faqId, question, answer } });
            await fetchFaqData();
            addLog({ type: 'faq_updated', tKey: 'log_faq_updated', subtitle: question, status: 'Success' });
            showToast({ tKey: 'toast_faq_updated', type: 'success' });
        } catch (e: any) {
             showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchFaqData, addLog, showToast]);
    
    const deleteFaq = useCallback(async (faqId: string) => {
        try {
            await makeApiCall('/api/faq', 'POST', { action: 'delete_faq', payload: { faqId } });
            await fetchFaqData();
            showToast({ tKey: 'toast_faq_deleted', type: 'success' });
        } catch (e: any) {
             showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchFaqData, showToast]);
    
    const askAssistant = useCallback(async (query: string): Promise<AssistantResponse> => {
        addLog({ type: 'assistant_query_started', tKey: 'log_assistant_query_started', status: 'Processing' });
        try {
            const response = await makeApiCall('/api/assistant', 'POST', { query });
            addLog({ type: 'assistant_query_success', tKey: 'log_assistant_query_success', status: 'Success' });
            return response;
        } catch (e: any) {
            addLog({ type: 'assistant_query_failed', tKey: 'log_assistant_query_failed', status: 'Failed' });
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
            return { responseText: "I'm sorry, I encountered an error. Please try again." };
        }
    }, [addLog, makeApiCall, showToast]);
    
    const findGifts = useCallback(async (quiz: GiftFinderQuiz): Promise<GiftFinderResponse> => {
        addLog({ type: 'gift_finder_query_started', tKey: 'log_gift_finder_query_started', status: 'Processing' });
        try {
            const response = await makeApiCall('/api/gift', 'POST', { quiz });
            addLog({ type: 'gift_finder_query_success', tKey: 'log_gift_finder_query_success', status: 'Success' });
            showToast({ tKey: 'toast_gift_finder_success', type: 'success' });
            return response;
        } catch (e: any) {
            addLog({ type: 'gift_finder_query_failed', tKey: 'log_gift_finder_query_failed', status: 'Failed' });
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
            throw e;
        }
    }, [addLog, makeApiCall, showToast]);

    const redeemLoyaltyReward = useCallback(async (rewardId: string) => {
        try {
            await makeApiCall('/api/loyalty', 'POST', { action: 'redeem', payload: { rewardId } });
            await fetchLoyaltyData();
            const reward = loyaltyData?.status.availableRewards.find(r => r.id === rewardId);
            addLog({type: 'loyalty_reward_redeemed', tKey: 'log_loyalty_reward_redeemed', status: 'Success', subtitle: reward?.tKey || 'reward'});
            showToast({ tKey: 'toast_loyalty_reward_redeemed', type: 'success' });
        } catch (e: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [makeApiCall, fetchLoyaltyData, loyaltyData, addLog, showToast]);
    
    const saveStory = useCallback(async (story: Omit<Story, 'createdAt' | 'updatedAt' | 'slug'>) => {
        const logType = story.id ? 'story_updated' : 'story_created';
        const logTKey = story.id ? 'log_story_updated' : 'log_story_created';

        addLog({ type: logType, tKey: logTKey, status: 'Processing' });
        try {
            await makeApiCall('/api/story', 'POST', { story });
            await fetchStories();
            addLog({ type: logType, tKey: logTKey, status: 'Success' });
            showToast({ tKey: 'toast_story_saved_success', type: 'success' });
        } catch (e: any) {
            addLog({ type: logType, tKey: logTKey, status: 'Failed' });
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        }
    }, [addLog, makeApiCall, fetchStories, showToast]);

    const runAutomationTask = useCallback(async (type: ActivityType, tKey: string) => {
        addLog({ type, tKey, status: 'Running' });
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        addLog({ type, tKey, status: 'Success' });
        showToast({ tKey: 'toast_automation_completed', options: { task: tKey }, type: 'success' });
    }, [addLog, showToast]);

    const runAutopilotFix = useCallback(async (productsToFix: Product[]) => {
        showToast({ tKey: 'toast_autopilot_started', options: { count: productsToFix.length }, type: 'success' });
        for (const product of productsToFix) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const newSeoScore = Math.min(99, product.seoScore + Math.floor(Math.random() * 10) + 5);
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, seoScore: newSeoScore } : p));
            addLog({ type: 'title_optimization', tKey: 'log_autopilot_optimization', subtitle: product.title, status: 'Success', change: `SEO +${newSeoScore - product.seoScore}%` });
        }
        showToast({ tKey: 'toast_autopilot_completed', type: 'success' });
    }, [addLog, showToast]);
    
    const analyzeCompetitor = useCallback(async (url: string) => {
        addLog({ type: 'sync_start', tKey: 'log_competitor_analysis_started', status: 'Running'});
        await new Promise(resolve => setTimeout(resolve, 2500));
        const data: CompetitorData = { url, topTags: [{tag: 'handmade jewelry', value: '92%'}, {tag: 'minimalist', value: '85%'}, {tag: 'gift for her', value: '75%'}, {tag: 'gold earrings', value: '60%'}, {tag: 'dainty jewelry', value: '45%'}], titlePatterns: ["Material + Style + Type + Occasion", "Descriptive + Material + Product", "Style + Material + Size + Product"], categoryFocus: [{label: 'Rings', value: 45}, {label: 'Necklaces', value: 25}, {label: 'Earrings', value: 20}, {label: 'Bracelets', value: 10}], opportunities: Math.floor(Math.random() * 10) + 5 };
        setCompetitorData(data);
        addLog({ type: 'sync_complete', tKey: 'log_competitor_analysis_complete', status: 'Success'});
        showToast({ tKey: 'toast_competitor_analysis_complete', type: 'success' });
    }, [addLog, showToast]);

    // --- Add Product Functions ---
    const updateNewProductData = useCallback((data: Partial<NewProductData>) => {
        setNewProductData(prev => ({ ...prev, ...data }));
    }, []);

    const generateSeoMetadata = useCallback(async (details: Pick<NewProductData, 'title' | 'description'>): Promise<Pick<NewProductData, 'title' | 'description' | 'tags'>> => {
        try {
            const result = await apiGenerateSeoMetadata(details);
            updateNewProductData(result);
            showToast({tKey: 'toast_metadata_generated', type: 'success'});
            return result;
        } catch (e: any) {
            showToast({tKey: 'toast_generic_error_with_message', options: {message: e.message}, type: 'error'});
            throw e;
        }
    }, [updateNewProductData, showToast]);
    
    const publishNewProduct = useCallback(async (productData: NewProductData) => {
        addLog({type: 'product_created', tKey: 'log_product_creation_started', subtitle: productData.title, status: 'Processing' });
        try {
            // Step 1: Create the listing with text data to get a listing ID.
            const { listing_id } = await createListing(productData);

            // Step 2: Sequentially upload images to the new listing ID.
            if (productData.images && productData.images.length > 0) {
                 for (const imageFile of productData.images) {
                    await uploadListingImage(listing_id, imageFile);
                }
            }

            addLog({type: 'product_created', tKey: 'log_product_creation_success', subtitle: productData.title, status: 'Success' });
            showToast({tKey: 'toast_product_published', type: 'success'});
            // Reset form on success
            setNewProductData(defaultNewProductData);
            // Switch page after successful submission
            setPage('dashboard');

        } catch (e: any) {
            addLog({type: 'product_creation_failed', tKey: 'log_product_creation_failed', subtitle: productData.title, status: 'Failed'});
            showToast({tKey: 'toast_generic_error_with_message', options: {message: e.message}, type: 'error'});
            throw e;
        }
    }, [addLog, showToast, setPage]);

    const value = useMemo(() => ({
        page, setPage, isSidebarCollapsed, toggleSidebar, products, activityLogs, settings, effectiveTheme, updateSettings, resetSettings, runFullOptimization, runAutomationTask, runAutopilotFix, analyzeCompetitor, competitorData, toast, setToast, showToast, auth, login, logout, handleOAuthCallback, reviewsData, quickReplies, isReviewsLoading, reviewsError, fetchReviewData, generateReviewResponse, updateReviewStatus, saveEditedResponse, getReviewAnalytics, faqs, suggestedQuestions, isFaqLoading, faqError, fetchFaqData, scanForFaqs, generateFaqAnswer, publishFaq, updateFaq, deleteFaq, askAssistant, findGifts, loyaltyData, isLoyaltyLoading, loyaltyError, fetchLoyaltyData, redeemLoyaltyReward, stories, isStoriesLoading, storiesError, fetchStories, saveStory, newProductData, updateNewProductData, generateSeoMetadata, publishNewProduct, etsyCategories,
    }), [ page, setPage, isSidebarCollapsed, products, activityLogs, settings, effectiveTheme, competitorData, toast, auth, reviewsData, quickReplies, isReviewsLoading, reviewsError, faqs, suggestedQuestions, isFaqLoading, faqError, loyaltyData, isLoyaltyLoading, loyaltyError, stories, isStoriesLoading, storiesError, newProductData, etsyCategories, toggleSidebar, updateSettings, resetSettings, runFullOptimization, runAutomationTask, runAutopilotFix, analyzeCompetitor, showToast, login, logout, handleOAuthCallback, fetchReviewData, generateReviewResponse, updateReviewStatus, saveEditedResponse, getReviewAnalytics, fetchFaqData, scanForFaqs, generateFaqAnswer, publishFaq, updateFaq, deleteFaq, askAssistant, findGifts, fetchLoyaltyData, redeemLoyaltyReward, fetchStories, saveStory, updateNewProductData, generateSeoMetadata, publishNewProduct ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};