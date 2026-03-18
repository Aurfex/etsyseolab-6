import React, { useState } from 'react';
import { Trophy, Gift, Users, Copy, Check, Sparkles, Loader2, ChevronsRight, ShoppingBag, UserPlus, Award } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { ErrorDisplay } from '../components/AuthBanner';
import { LoyaltyActivity, Reward } from '../types';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const LoyaltyPage: React.FC = () => {
    const { 
        loyaltyData,
        isLoyaltyLoading,
        loyaltyError,
        redeemLoyaltyReward,
        showToast
    } = useAppContext();
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    const handleCopy = () => {
        if (loyaltyData?.status.referralCode) {
            navigator.clipboard.writeText(loyaltyData.status.referralCode);
            setCopied(true);
            showToast({ tKey: 'loyalty_copied', type: 'success' });
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handleRedeem = async (rewardId: string) => {
        setRedeemingId(rewardId);
        await redeemLoyaltyReward(rewardId);
        setRedeemingId(null);
    }

    const getActivityIcon = (type: LoyaltyActivity['type']) => {
        switch(type) {
            case 'purchase': return <ShoppingBag className="w-5 h-5 text-green-500" />;
            case 'referral_signup': return <UserPlus className="w-5 h-5 text-blue-500" />;
            case 'referral_purchase': return <Award className="w-5 h-5 text-[#F1641E]" />;
            case 'review_left': return <Sparkles className="w-5 h-5 text-yellow-500" />;
            default: return <ChevronsRight className="w-5 h-5 text-gray-400" />;
        }
    };

    const renderContent = () => {
        if (isLoyaltyLoading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-[#F1641E] animate-spin" /></div>;
        }
        if (loyaltyError) {
            return <ErrorDisplay message={loyaltyError} />;
        }
        if (!loyaltyData) {
            return null;
        }
        
        const { status, aiRecommendation } = loyaltyData;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('loyalty_current_points')}</h3>
                        <p className="text-5xl font-bold text-gray-900 dark:text-white mt-2">{status.currentPoints.toLocaleString()}</p>
                        <p className="text-lg font-medium text-[#F1641E] dark:text-purple-400">{t('loyalty_points')}</p>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                           <Users className="w-5 h-5 me-2 text-[#F1641E]" /> {t('loyalty_referral_code_title')}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                            <input type="text" readOnly value={status.referralCode} className="flex-grow bg-transparent font-mono text-lg p-1 focus:outline-none" />
                            <button onClick={handleCopy} className="p-2 bg-[#F1641E] text-white rounded-md hover:bg-[#D95A1B] transition-colors">
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </Card>
                    {aiRecommendation && (
                         <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-purple-200 dark:border-purple-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <Sparkles className="w-5 h-5 me-2 text-yellow-400" /> {t('loyalty_ai_recommendation_title')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mt-2 italic">"{aiRecommendation.reason}"</p>
                            <div className="mt-4 bg-white dark:bg-gray-700 p-3 rounded-lg text-center shadow-sm">
                                <p className="font-semibold text-purple-700 dark:text-orange-300">{t(aiRecommendation.reward.tKey)}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('loyalty_points_required', { points: aiRecommendation.reward.pointsRequired })}</p>
                            </div>
                            <button onClick={() => handleRedeem(aiRecommendation.reward.id)} disabled={redeemingId === aiRecommendation.reward.id} className="w-full mt-4 bg-[#F1641E] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#D95A1B] transition-colors disabled:opacity-50">
                                {redeemingId === aiRecommendation.reward.id ? <Loader2 className="w-5 h-5 animate-spin"/> : <Gift className="w-5 h-5" />}
                                {t('loyalty_redeem_now_button')}
                            </button>
                         </Card>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                            <Gift className="w-5 h-5 me-2 text-[#F1641E]" /> {t('loyalty_available_rewards_title')}
                        </h3>
                        <div className="space-y-3">
                            {status.availableRewards.map(reward => (
                                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{t(reward.tKey)}</p>
                                        <p className="text-sm text-[#F1641E] dark:text-purple-400 font-medium">{t('loyalty_points_required', { points: reward.pointsRequired.toLocaleString() })}</p>
                                    </div>
                                    <button onClick={() => handleRedeem(reward.id)} disabled={redeemingId === reward.id || status.currentPoints < reward.pointsRequired} className="px-4 py-2 text-sm font-semibold rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {redeemingId === reward.id ? <Loader2 className="w-4 h-4 animate-spin"/> : t('loyalty_redeem_button')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <Card>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                <Users className="w-5 h-5 me-2 text-[#F1641E]" /> {t('loyalty_referral_status_title')}
                            </h3>
                             {status.referrals.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                            <th className="pb-2">{t('loyalty_referral_name')}</th>
                                            <th className="pb-2">{t('loyalty_referral_status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.referrals.map(ref => (
                                            <tr key={ref.name} className="border-b dark:border-gray-700/50">
                                                <td className="py-2 font-medium text-gray-800 dark:text-gray-200">{ref.name}</td>
                                                <td className={`py-2 font-semibold ${ref.status === 'first_purchase' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {t(`loyalty_status_${ref.status}` as any)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             ) : (
                                <p className="text-center text-gray-500 py-4">{t('loyalty_no_referrals')}</p>
                             )}
                        </Card>
                         <Card>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                <Trophy className="w-5 h-5 me-2 text-[#F1641E]" /> {t('loyalty_activity_history_title')}
                            </h3>
                            <div className="space-y-4 max-h-60 overflow-y-auto">
                                {status.history.length > 0 ? status.history.map(act => (
                                    <div key={act.id} className="flex items-center gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-full">{getActivityIcon(act.type)}</div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t(act.tKey, act.tKeyOptions)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(act.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`text-sm font-bold ${act.points > 0 ? 'text-green-500' : 'text-red-500'}`}>{act.points > 0 ? '+' : ''}{act.points}</div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-4">{t('loyalty_no_activity')}</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Trophy className="w-8 h-8 me-3 text-[#F1641E]" />
                        {t('loyalty_page_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('loyalty_page_subtitle')}</p>
                </div>
            </div>
            
            {renderContent()}

        </div>
    );
};

export default LoyaltyPage;