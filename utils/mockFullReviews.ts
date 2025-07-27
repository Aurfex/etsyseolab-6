
import { FullReviewData, QuickReply } from '../types';

// This mock data represents the combined review and response data.
// In a real app, this would be joined in the backend.
export const MOCK_FULL_REVIEWS: FullReviewData[] = [
  {
    id: 'rev_001',
    productId: 'prod_001',
    productTitle: 'Gold Hoop Earrings',
    customerName: 'Sarah J.',
    rating: 5,
    reviewText: 'Absolutely stunning! They are lightweight and look so elegant. I get compliments every time I wear them. Shipping was fast too!',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    language: 'en',
    isFlagged: false,
    response: {
        reviewId: 'rev_001',
        responseText: 'Thank you so much, Sarah! We are thrilled to hear that you love your Gold Hoop Earrings. It makes our day to know they\'re getting so many compliments!',
        generatedResponseText: 'Thank you so much, Sarah! We are thrilled to hear that you love your Gold Hoop Earrings. It makes our day to know they\'re getting so many compliments!',
        sentiment: 'positive',
        status: 'posted',
        lastUpdated: new Date(Date.now() - 20 * 60 * 60 * 1000)
    },
    history: []
  },
  {
    id: 'rev_002',
    productId: 'prod_002',
    productTitle: 'Silver Necklace',
    customerName: 'Mike P.',
    rating: 3,
    reviewText: 'The necklace is okay. Smaller than I expected from the pictures. The clasp is a bit tricky to handle.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    language: 'en',
    isFlagged: false,
    response: {
        reviewId: 'rev_002',
        responseText: 'Hi Mike, thank you for your feedback. We appreciate your honesty and have passed your comments about the clasp to our design team. We hope you still enjoy the necklace!',
        generatedResponseText: 'Hi Mike, thank you for your feedback. We appreciate your honesty and have passed your comments about the clasp to our design team. We hope you still enjoy the necklace!',
        sentiment: 'neutral',
        status: 'approved',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    history: []
  },
  {
    id: 'rev_003',
    productId: 'prod_003',
    productTitle: 'Beaded Bracelet',
    customerName: 'Emily R.',
    rating: 4,
    reviewText: "Very cute bracelet, the colors are vibrant. I'm happy with my purchase.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    language: 'en',
    isFlagged: false,
  },
   {
    id: 'rev_004',
    productId: 'prod_001',
    productTitle: 'Gold Hoop Earrings',
    customerName: 'Jessica B.',
    rating: 1,
    reviewText: "Broke after one use. Very disappointed with the quality for this price. This is unacceptable and a total waste of money. Would not recommend.",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    language: 'en',
    isFlagged: true,
  },
  {
    id: 'rev_005',
    productId: 'prod_002',
    productTitle: 'Silver Necklace',
    customerName: 'آرش',
    rating: 5,
    reviewText: 'بسیار زیبا و با کیفیت بود. خیلی سریع به دستم رسید و بسته بندی عالی بود. ممنونم!',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    language: 'fa',
    isFlagged: false,
    response: {
        reviewId: 'rev_005',
        responseText: 'آرش عزیز، بسیار خوشحالیم که از گردنبند نقره راضی بودید. از خرید و اعتماد شما سپاسگزاریم!',
        generatedResponseText: 'آرش عزیز، بسیار خوشحالیم که از گردنبند نقره راضی بودید. از خرید و اعتماد شما سپاسگزاریم!',
        sentiment: 'positive',
        status: 'pending_approval',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    history: []
  }
];

export const MOCK_QUICK_REPLIES: QuickReply[] = [
    { id: 'qr_01', title: "Thanks!", text: "Thank you so much for your positive feedback! We're thrilled you love it." },
    { id: 'qr_02', title: "Sorry to hear", text: "We're so sorry to hear about your experience. Please contact us directly so we can resolve this for you." },
    { id: 'qr_03', title: "Shipping Feedback", text: "Thank you for your feedback on the shipping. We're always working to improve our process." },
];
