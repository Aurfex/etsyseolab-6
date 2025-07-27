
import { LoyaltyData } from '../types';

export const MOCK_LOYALTY_DATA: LoyaltyData = {
    status: {
        currentPoints: 1250,
        referralCode: 'REF-DXB-ADMIN',
        referrals: [
            { name: 'Alice', status: 'first_purchase' },
            { name: 'Bob', status: 'signed_up' },
        ],
        history: [
            { id: 'act_1', type: 'purchase', tKey: 'loyalty_activity_tkey_purchase', tKeyOptions: { orderId: 78912 }, points: 500, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { id: 'act_2', type: 'referral_purchase', tKey: 'loyalty_activity_tkey_referral_purchase', tKeyOptions: { name: 'Alice' }, points: 1000, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { id: 'act_3', type: 'referral_signup', tKey: 'loyalty_activity_tkey_referral_signup', tKeyOptions: { name: 'Bob' }, points: 100, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { id: 'act_4', type: 'review_left', tKey: 'loyalty_activity_tkey_review_left', points: 150, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ],
        availableRewards: [
            { id: 'rew_1', tKey: 'loyalty_reward_tkey_10_percent', pointsRequired: 1000, discountPercentage: 10 },
            { id: 'rew_2', tKey: 'loyalty_reward_tkey_free_shipping', pointsRequired: 2000, freeShipping: true },
            { id: 'rew_3', tKey: 'loyalty_reward_tkey_20_percent', pointsRequired: 3500, discountPercentage: 20 },
        ],
    },
    aiRecommendation: {
        reward: { id: 'rew_1', tKey: 'loyalty_reward_tkey_10_percent', pointsRequired: 1000, discountPercentage: 10 },
        reason: "You've just earned enough points for this! A 10% discount would be perfect for your next purchase."
    }
};
