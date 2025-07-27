
import { Story } from '../types';

export const MOCK_STORIES: Story[] = [
    {
        id: 'story_1',
        title: 'The Journey of Our Summer Solstice Collection',
        slug: 'summer-solstice-collection',
        content: 'It all started with a walk on a sun-drenched beach, where the glistening pebbles inspired a new line of minimalist yet radiant jewelry. Each piece in the Summer Solstice Collection is designed to capture the warmth and light of the longest day of the year.\n\n- **Materials**: 14k Gold Plating, Sterling Silver\n- **Inspiration**: Nature, Sunlight, Ocean',
        featuredImageUrl: 'https://picsum.photos/seed/story001/800/400',
        status: 'published',
        productIds: ['prod_001', 'prod_003'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'story_2',
        title: 'Behind the Scenes: Crafting the Silver Necklace',
        slug: 'crafting-silver-necklace',
        content: 'A detailed look at how our most popular necklace is made, from raw silver to the final polish. Our artisans spend hours perfecting each link and ensuring the clasp is both secure and elegant.',
        featuredImageUrl: 'https://picsum.photos/seed/story002/800/400',
        status: 'draft',
        productIds: ['prod_002'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
];
