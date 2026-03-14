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
    price: 45.00,
    quantity: 10,
    variants: [
      { title: 'Small / 14K Gold', price: 45.00, quantity: 5, sku: 'GH-S-14K' },
      { title: 'Medium / 14K Gold', price: 55.00, quantity: 3, sku: 'GH-M-14K' },
      { title: 'Large / 14K Gold', price: 65.00, quantity: 2, sku: 'GH-L-14K' }
    ],
    images: [
      { url: 'https://picsum.photos/seed/prod001/400/400' },
      { url: 'https://picsum.photos/seed/prod001-alt1/400/400' },
      { url: 'https://picsum.photos/seed/prod001-alt2/400/400' }
    ]
  } as any,
  {
    id: 'prod_002',
    title: 'Silver Necklace',
    description: 'A delicate silver chain necklace with a small pendant. 925 sterling silver.',
    tags: ['silver', 'necklace', 'jewelry'],
    imageFilename: 'silver-necklace.jpg',
    imageUrl: 'https://picsum.photos/seed/prod002/400/400',
    seoScore: 72,
    price: 60.00,
    quantity: 8,
    variants: [
      { title: '16 inch chain', price: 60.00, quantity: 4, sku: 'SN-16' },
      { title: '18 inch chain', price: 65.00, quantity: 4, sku: 'SN-18' }
    ],
    images: [
      { url: 'https://picsum.photos/seed/prod002/400/400' },
      { url: 'https://picsum.photos/seed/prod002-alt/400/400' }
    ]
  } as any,
  {
    id: 'prod_003',
    title: 'Beaded Bracelet',
    description: 'Colorful beaded bracelet. Handmade with glass beads.',
    tags: ['bracelet', 'beaded', 'handmade'],
    imageFilename: 'beaded-bracelet.jpg',
    imageUrl: 'https://picsum.photos/seed/prod003/400/400',
    seoScore: 58,
    price: 25.00,
    quantity: 15,
  },
];
