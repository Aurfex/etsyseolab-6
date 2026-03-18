import React, { useState, useMemo } from 'react';
import { Star, MessageSquareDashed, Bot, Check, Send, ThumbsUp, ThumbsDown, Meh, Loader2, Edit, Save, X, RotateCcw, AlertTriangle, History, ChevronRight, Filter, TrendingUp, PieChart, ServerCrash, Shield } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { FullReviewData, ReviewResponse, AuditLogEntry, QuickReply, ReviewAnalyticsData, ReviewResponseStatus } from '../types';
import { ErrorDisplay } from '../components/AuthBanner';

type FilterType = 'all' | 'pending' | 'flagged';

const Card: React.FC<{children: React.ReactNode, className?: string, isFlagged?: boolean}> = ({ children, className, isFlagged }) => (
  <div className={`relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-card dark:shadow-card-dark transition-all duration-300 ${isFlagged ? 'border-2 border-red-500/50' : 'border border-transparent'} ${className}`}>
    {children}
    {isFlagged && <div className="absolute top-2 right-2 p-1.5 bg-red-500/10 rounded-full"><AlertTriangle className="w-4 h-4 text-red-500"/></div>}
  </div>
);

const RatingStars: React.FC<{rating: number, size?: 'sm' | 'md'}> = ({ rating, size = 'md' }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
        ))}
    </div>
);

const SentimentIndicator: React.FC<{sentiment: ReviewResponse['sentiment']}> = ({ sentiment }) => {
    const { t } = useTranslation();
    const sentimentConfig = {
        positive: { icon: ThumbsUp, color: 'text-green-500', bgColor: 'bg-green-500/10', key: 'sentiment_positive' },
        neutral: { icon: Meh, color: 'text-blue-500', bgColor: 'bg-blue-500/10', key: 'sentiment_neutral' },
        negative: { icon: ThumbsDown, color: 'text-red-500', bgColor: 'bg-red-500/10', key: 'sentiment_negative' },
        mixed: { icon: Bot, color: 'text-[#F1641E]', bgColor: 'bg-orange-500/10', key: 'sentiment_mixed' },
    }
    const config = sentimentConfig[sentiment] || sentimentConfig.neutral;
    return (
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            <config.icon className="w-3 h-3 me-1.5" />
            {t(config.key)}
        </div>
    )
}

const AuditLogModal: React.FC<{ history: AuditLogEntry[], onClose: () => void }> = ({ history, onClose }) => {
    const { t } = useTranslation();
    const sortedHistory = [...(history || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in-up" onClick={onClose}>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center"><History className="w-5 h-5 me-2" />{t('review_audit_log_title')}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {sortedHistory.length > 0 ? sortedHistory.map(log => (
                        <div key={log.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-orange-500 rounded-full mt-1.5"></div>
                                <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{log.action}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()} by {log.user}</p>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-500">{t('no_recent_activity')}</p>}
                </div>
            </div>
        </div>
    );
};


const ReviewCard: React.FC<{ reviewData: FullReviewData }> = ({ reviewData }) => {
    const { generateReviewResponse, updateReviewStatus, saveEditedResponse, quickReplies } = useAppContext();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(reviewData.response?.responseText || '');
    const [showHistory, setShowHistory] = useState(false);
    
    const { response, history = [] } = reviewData;
    const isPosting = response?.status === 'posting';

    const handleGenerate = async () => {
        setIsLoading(true);
        await generateReviewResponse(reviewData.id);
        setIsLoading(false);
    }

    const handleSaveEdit = async () => {
        setIsLoading(true);
        await saveEditedResponse(reviewData.id, editedText);
        setIsEditing(false);
        setIsLoading(false);
    };
    
    const handleUpdateStatus = async (status: ReviewResponseStatus) => {
        setIsLoading(true);
        await updateReviewStatus(reviewData.id, status);
        setIsLoading(false);
    }

    const handleCancelEdit = () => {
        setEditedText(response?.responseText || '');
        setIsEditing(false);
    };

    const handleQuickReply = (text: string) => {
        setIsEditing(true);
        setEditedText(prev => prev ? `${prev}\n${text}` : text);
    }

    const StatusBadge: React.FC<{status: ReviewResponse['status']}> = ({ status }) => {
        const statusConfig: Record<string, { color: string, icon: React.ElementType, tKey: string}> = {
            pending_approval: { color: 'yellow', icon: Bot, tKey: 'review_status_pending_approval'},
            approved: { color: 'green', icon: Check, tKey: 'review_status_approved'},
            posting: { color: 'blue', icon: Loader2, tKey: 'review_status_posting'},
            posted: { color: 'blue', icon: Send, tKey: 'review_status_posted'},
            rejected: { color: 'red', icon: X, tKey: 'review_status_rejected'},
            failed_to_post: { color: 'red', icon: AlertTriangle, tKey: 'review_status_failed_to_post'},
        }
        const config = statusConfig[status];
        if (!config) return null;
        const colors: Record<string, string> = {
            yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
            green: 'bg-green-500/10 text-green-600 dark:text-green-400',
            blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            red: 'bg-red-500/10 text-red-600 dark:text-red-400'
        }
        return (
             <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${colors[config.color]}`}>
                <config.icon className={`w-3 h-3 ${status === 'posting' ? 'animate-spin' : ''}`} />
                {t(config.tKey)}
            </span>
        )
    }

    return (
        <Card isFlagged={reviewData.isFlagged}>
            {showHistory && <AuditLogModal history={history} onClose={() => setShowHistory(false)} />}
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-900 dark:text-white">{reviewData.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('review_for_product', { product: reviewData.productTitle })}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <RatingStars rating={reviewData.rating} />
                    <p className="text-xs text-gray-400 mt-1">{new Date(reviewData.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
            <p className="mt-4 text-gray-700 dark:text-gray-300 italic">"{reviewData.reviewText}"</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!response ? (
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-[#F1641E] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#D95A1B] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                        <span>{isLoading ? t('review_generating_response') : t('review_generate_response')}</span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('review_ai_suggested_response')}</h4>
                            <SentimentIndicator sentiment={response.sentiment} />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg border border-transparent dark:border-gray-700">
                           {isEditing ? (
                               <textarea
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="w-full bg-transparent focus:outline-none text-gray-800 dark:text-white placeholder-gray-400"
                                rows={4}
                                autoFocus
                               />
                           ) : (
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{response.responseText}</p>
                           )}
                        </div>

                        {isEditing ? (
                             <div className="flex items-center justify-end gap-2">
                                <button onClick={handleCancelEdit} disabled={isLoading} className="px-4 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">
                                    {t('review_cancel_button')}
                                </button>
                                <button onClick={handleSaveEdit} disabled={isLoading} className="px-4 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-3 h-3 me-1" />}
                                    {t('review_save_button')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('review_quick_replies_title')}</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {quickReplies.map(qr => (
                                            <button key={qr.id} onClick={() => handleQuickReply(qr.text)} disabled={isLoading || isPosting} className="px-2 py-1 text-xs font-medium rounded-md text-purple-700 bg-orange-100 hover:bg-purple-200 dark:text-orange-300 dark:bg-purple-900/50 dark:hover:bg-purple-900 disabled:opacity-50">
                                                {qr.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div>
                                        {response.status !== 'pending_generation' && <StatusBadge status={response.status} />}
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button onClick={() => setShowHistory(true)} title="History" className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={isLoading || isPosting}><History className="w-4 h-4"/></button>
                                        
                                        {(response.status === 'pending_approval' || response.status === 'rejected' || response.status === 'failed_to_post') && (
                                            <>
                                                <button onClick={() => setIsEditing(true)} disabled={isLoading} className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">
                                                    <Edit className="w-3 h-3 inline me-1" /> {t('review_edit_button')}
                                                </button>
                                                <button onClick={() => handleUpdateStatus('rejected')} disabled={isLoading} className="p-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center disabled:opacity-50">
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleUpdateStatus('approved')} disabled={isLoading} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center disabled:opacity-50">
                                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                </button>
                                            </>
                                        )}
                                        {response.status === 'approved' && (
                                            <button onClick={() => handleUpdateStatus('posting')} disabled={isLoading || isPosting} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50">
                                                {isPosting ? <Loader2 className="w-3 h-3 me-1 animate-spin" /> : <Send className="w-3 h-3 me-1" />}
                                                {isPosting ? t('review_posting_to_etsy_button') : t('review_post_to_etsy_button')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

const AnalyticsChart: React.FC<{title: string; data: {label: string; value: number; color: string}[]}> = ({title, data}) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
        <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h4>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                            <span className="text-gray-500 dark:text-gray-400">{item.value} ({total > 0 ? Math.round((item.value/total)*100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className={`${item.color} h-2 rounded-full`} style={{width: total > 0 ? `${(item.value/total)*100}%` : '0%'}}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


const ReviewAnalytics: React.FC = () => {
    const { getReviewAnalytics } = useAppContext();
    const { t } = useTranslation();
    const analytics = getReviewAnalytics();

    const sentimentData = [
        { label: t('sentiment_positive'), value: analytics.sentimentCounts.positive, color: 'bg-green-500' },
        { label: t('sentiment_neutral'), value: analytics.sentimentCounts.neutral, color: 'bg-blue-500' },
        { label: t('sentiment_negative'), value: analytics.sentimentCounts.negative, color: 'bg-red-500' },
        { label: t('sentiment_mixed'), value: analytics.sentimentCounts.mixed, color: 'bg-orange-500' },
    ];
    
    const statusData = [
        { label: t('review_unanswered'), value: analytics.statusCounts.unanswered, color: 'bg-gray-400' },
        { label: t('review_pending_approval'), value: analytics.statusCounts.pending_approval, color: 'bg-yellow-500' },
        { label: t('review_status_posted'), value: analytics.statusCounts.responded, color: 'bg-green-500' },
    ];

    return (
        <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                <TrendingUp className="w-6 h-6 me-2 text-[#F1641E]" />
                {t('review_analytics_title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">{t('review_analytics_avg_rating')}</span>
                    <div className="flex items-end gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.averageRating.toFixed(2)}</span>
                        <span className="text-gray-500 dark:text-gray-400 mb-1">/ 5</span>
                    </div>
                     <RatingStars rating={analytics.averageRating} />
                </div>
                <AnalyticsChart title={t('review_analytics_sentiment_dist')} data={sentimentData} />
                <AnalyticsChart title={t('review_analytics_status_overview')} data={statusData} />
            </div>
        </Card>
    );
};


const ReviewsPage: React.FC = () => {
    const { reviewsData, isReviewsLoading, reviewsError } = useAppContext();
    const { t } = useTranslation();
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredReviews = useMemo(() => {
        if (!reviewsData) return [];
        switch (filter) {
            case 'flagged':
                return reviewsData.filter(r => r.isFlagged);
            case 'pending':
                return reviewsData.filter(r => !r.response || r.response.status === 'pending_approval');
            case 'all':
            default:
                return reviewsData;
        }
    }, [reviewsData, filter]);
    
    const FilterButton: React.FC<{type: FilterType; label: string}> = ({ type, label }) => (
        <button 
            onClick={() => setFilter(type)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border ${filter === type ? 'bg-[#F1641E] text-white border-purple-600 shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        if (isReviewsLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 text-[#F1641E] animate-spin" />
                </div>
            );
        }

        if (reviewsError) {
            return <ErrorDisplay message={reviewsError} />;
        }

        if (filteredReviews.length > 0) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredReviews.map(review => (
                        <ReviewCard key={review.id} reviewData={review} />
                    ))}
                </div>
            );
        }

        return (
            <Card>
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('review_no_reviews')}</p>
            </Card>
        );
    }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <MessageSquareDashed className="w-8 h-8 me-3 text-[#F1641E]" />
            {t('reviews_page_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reviews_page_subtitle')}</p>
        </div>
      </div>
      
      {!isReviewsLoading && !reviewsError && <ReviewAnalytics />}

      <Card>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <FilterButton type="all" label={t('review_filter_all')} />
            <FilterButton type="pending" label={t('review_filter_pending')} />
            <FilterButton type="flagged" label={t('review_filter_flagged')} />
          </div>
      </Card>
      
      {renderContent()}
        
    </div>
  );
};

export default ReviewsPage;