import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_001',
    title: 'Gold Hoop Earrings',
    description: 'Simple gold hoop earrings. Good for daily use.',
    tags: ['gold', 'earrings', 'hoops'],
    imageFilename: 'gold-hoops.jpg',
    imageUrl: 'https://picsum.photos/seed/prod001/400/400',
    seoScore: 65,
  },
  {
    id: 'prod_002',
    title: 'Silver Necklace',
    description: 'A delicate silver chain necklace with a small pendant. 925 sterling silver.',
    tags: ['silver', 'necklace', 'jewelry'],
    imageFilename: 'silver-necklace.jpg',
    imageUrl: 'https://picsum.photos/seed/prod002/400/400',
    seoScore: 72,
  },
  {
    id: 'prod_003',
    title: 'Beaded Bracelet',
    description: 'Colorful beaded bracelet. Handmade with glass beads.',
    tags: ['bracelet', 'beaded', 'handmade'],
    imageFilename: 'beaded-bracelet.jpg',
    imageUrl: 'https://picsum.photos/seed/prod003/400/400',
    seoScore: 58,
  },
];
