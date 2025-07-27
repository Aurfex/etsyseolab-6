
import { SuggestedQuestion, FAQ } from '../types';

export const MOCK_SUGGESTED_QUESTIONS: Omit<SuggestedQuestion, 'id'>[] = [
  {
    questionText: "How long does shipping to the United States take?",
    source: "Customer Message",
    relevanceScore: 92,
  },
  {
    questionText: "What is your return policy?",
    source: "Search Analytics",
    relevanceScore: 88,
  },
  {
    questionText: "Are your necklaces made with hypoallergenic materials?",
    source: "Customer Message",
    relevanceScore: 85,
  },
  {
    questionText: "Do you offer gift wrapping?",
    source: "Support Ticket",
    relevanceScore: 76,
  },
  {
    questionText: "Can I customize the length of a chain?",
    source: "Customer Message",
    relevanceScore: 71,
  },
];

export const MOCK_FAQS: FAQ[] = [
    {
        id: 'faq_1',
        question: 'What materials do you use?',
        answer: 'All of our jewelry is crafted from high-quality, hypoallergenic materials such as 925 sterling silver and 14k gold plating to ensure comfort and durability.',
        status: 'published',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'faq_2',
        question: 'How do I care for my jewelry?',
        answer: 'To keep your jewelry looking its best, avoid contact with perfumes and lotions. Store it in a dry place, and gently polish it with a soft cloth.',
        status: 'published',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    }
];
