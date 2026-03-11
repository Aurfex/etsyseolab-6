export type Page = 'landing' | 'dashboard' | 'optimizer' | 'autopilot' | 'competitor' | 'settings' | 'reviews' | 'faq' | 'assistant' | 'gift_finder' | 'loyalty' | 'story_magazine' | 'add_product' | 'pricing' | 'image_seo';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'fa';

export interface Product {
  id: string;
  listing_id?: string;
  title: string;
  description: string;
  tags: string[];
  imageFilename: string;
  imageUrl: string;
  seoScore: number;
  quantity?: number;
  price?: number;
}

export interface OptimizationResult {
  title: string;
  description: string;
  tags: string[];
  altText: string;
}

export type ActivityType = 
    | 'title_optimization' | 'tag_enhancement' | 'image_optimization' | 'description_rewrite' 
    | 'sync_start' | 'sync_complete' | 'report_generated' | 'backup_complete' 
    | 'review_response_generated' | 'review_response_approved' | 'review_response_rejected'
    | 'review_response_post_started' | 'review_response_post_success' | 'review_response_post_failed'
    | 'notification_sent_slack' | 'notification_sent_email'
    | 'data_exported_csv'
    | 'faq_scan_started' | 'faq_scan_completed' | 'faq_answer_generated' | 'faq_published' | 'faq_updated'
    | 'assistant_query_started' | 'assistant_query_success' | 'assistant_query_failed'
    | 'gift_finder_query_started' | 'gift_finder_query_success' | 'gift_finder_query_failed'
    | 'loyalty_reward_redeemed'
    | 'story_created' | 'story_updated' | 'story_published'
    | 'product_created' | 'product_creation_failed';
    
export type ActivityStatus = 'Success' | 'Processing' | 'Running' | 'Failed' | 'Queued';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  tKey: string; // Changed from title to tKey for translation
  subtitle?: string;
  timestamp: Date;
  status: ActivityStatus;
  change?: string; // e.g., "SEO +55%"
  options?: { [key: string]: string | number };
}


export interface Backup {
  id: string;
  timestamp: Date;
  productCount: number;
  data: Product[];
}

export interface Settings {
    language: Language;
    theme: Theme;
    autopilot: {
        enabled: boolean;
        frequency: '6h' | 'daily' | 'weekly';
        safeMode: boolean;
        autoApprove: boolean;
        notifications: boolean;
        analytics: boolean;
    };
    mockMode: boolean;
}

export interface CompetitorData {
    url: string;
    topTags: { tag: string; value: string; }[];
    titlePatterns: string[];
    categoryFocus: { label: string; value: number; }[];
    opportunities: number;
}

export interface ToastData {
  tKey: string;
  options?: { [key: string]: string | number };
  type: 'success' | 'error' | 'info';
}

export type TFunction = (key: string, options?: { [key:string]: string | number }) => string;

export interface Translations {
  [key: string]: string;
}

// --- Auth Types ---
export interface Auth {
    isAuthenticated: boolean;
    token: string | null;
    refreshToken?: string | null;
    user: { name: string; email: string; } | null;
}

// --- REVIEW MODULE TYPES ---

// More detailed status for the human-in-the-loop workflow
export type ReviewResponseStatus = 'pending_generation' | 'pending_approval' | 'approved' | 'posting' | 'posted' | 'rejected' | 'failed_to_post';

export type ReviewSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  customerName: string;
  rating: number; // 1-5
  reviewText: string;
  timestamp: Date;
  language: 'en' | 'fa' | 'unknown'; // For multilingual support
  isFlagged: boolean; // For auto-flagging negative reviews
}

export interface ReviewResponse {
  reviewId: string;
  responseText: string;
  generatedResponseText: string; // Keep original AI response
  sentiment: ReviewSentiment;
  status: ReviewResponseStatus;
  lastUpdated: Date;
}

export interface AuditLogEntry {
    id: string;
    reviewId: string;
    timestamp: Date;
    user: string; // 'System (AI)' or 'Admin'
    action: string; // e.g., 'Generated Response', 'Status Changed', 'Response Edited'
    details: string; // e.g., 'Status changed from pending_approval to approved'
}

export interface QuickReply {
    id: string;
    title: string;
    text: string;
}

export interface ReviewAnalyticsData {
    totalReviews: number;
    averageRating: number;
    sentimentCounts: {
        positive: number;
        neutral: number;
        negative: number;
        mixed: number;
    };
    statusCounts: {
        responded: number;
        unanswered: number;
        pending_approval: number;
    };
}

// Combined data for easier use in the frontend
export interface FullReviewData extends Review {
    response?: ReviewResponse;
    history?: AuditLogEntry[];
}

// --- FAQ MODULE TYPES ---
export type FAQStatus = 'draft' | 'published';

export interface SuggestedQuestion {
    id: string;
    questionText: string;
    source: string; // e.g., "Customer Message", "Search Analytics"
    relevanceScore: number; // e.g., 85
    generatedAnswer?: string;
    isGenerating?: boolean;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    status: FAQStatus;
    createdAt: Date;
    updatedAt: Date;
}

// --- ASSISTANT MODULE TYPES ---
export interface AssistantMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    products?: Product[];
}

export interface AssistantResponse {
    responseText: string;
    products?: Product[];
}

// --- GIFT FINDER MODULE TYPES ---
export interface GiftFinderQuiz {
    occasion: string;
    recipient: string;
    budget: string;
    style: string;
}

export interface RecommendedProduct extends Product {
    reason: string;
}

export interface GiftFinderResponse {
    responseText: string;
    products: RecommendedProduct[];
}

// --- LOYALTY & REFERRAL MODULE TYPES ---
export type LoyaltyActivityType = 'purchase' | 'referral_signup' | 'referral_purchase' | 'social_share' | 'review_left';

export interface LoyaltyActivity {
    id: string;
    type: LoyaltyActivityType;
    tKey: string;
    tKeyOptions?: { [key: string]: string | number };
    points: number;
    timestamp: Date;
}

export interface Reward {
    id: string;
    tKey: string;
    pointsRequired: number;
    discountPercentage?: number;
    freeShipping?: boolean;
}

export interface LoyaltyStatus {
    currentPoints: number;
    referralCode: string;
    referrals: {
        name: string;
        status: 'signed_up' | 'first_purchase';
    }[];
    history: LoyaltyActivity[];
    availableRewards: Reward[];
}

export interface AIRecommendedReward {
    reward: Reward;
    reason: string;
}

export interface LoyaltyData {
    status: LoyaltyStatus;
    aiRecommendation: AIRecommendedReward | null;
}

// --- STORY MAGAZINE TYPES ---
export type StoryStatus = 'draft' | 'published';

export interface Story {
    id: string;
    title: string;
    slug: string;
    content: string; // Can be markdown or HTML
    featuredImageUrl: string;
    status: StoryStatus;
    productIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

// --- ADD PRODUCT TYPES ---
export interface EtsyCategory {
    id: number;
    name: string;
    path: string;
}

export interface NewProductData {
    // Step 1: Basic Info
    title: string;
    taxonomy_id: number | null;
    price: number;
    quantity: number;
    who_made: 'i_did' | 'collective' | 'someone_else';
    when_made: 'made_to_order' | '2020_2026' | '2010_2019' | 'before_2010';
    is_supply: boolean;

    // Step 2: Images
    images: File[];
    imageAltTexts?: string[];
    
    // Step 3: Metadata
    description: string;
    tags: string[];

    // Step 4: Variants + pricing import + required Etsy fields
    ring_sizes?: string[];
    ring_materials?: string[];
    pricing_rows?: Array<{ size: string; material: string; price: number; quantity?: number; sku?: string }>;

    item_type?: 'physical' | 'digital';
    production_type?: 'made_to_order' | 'finished';

    shipping_profile_id?: string;
    return_policy_id?: string;
    processing_profile_id?: string;
    shop_section_id?: string;

    materials_list?: string[];

    personalization_enabled?: boolean;
    personalization_instructions?: string;
    personalization_buyer_limit?: number;
    personalization_optional?: boolean;

    // Optional manual guidance for AI generation
    ai_keywords?: string;
}