const fs = require('fs');
const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/contexts/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const realProducts: Product\[\] = data\.products\.map\(\(p: any\) => \{[\s\S]*?seoScore: Number\.isFinite\(p\.seoScore\) \? p\.seoScore : calcSeoScore\(title, description, tags\)\s*\}\);\s*\}\);/;

const newMap = `            const realProducts: Product[] = data.products.map((p: any) => {
                const title = p.title || '';
                const description = p.description || '';
                const tags = p.tags || [];

                return ({
                    id: p.id,
                    listing_id: p.listing_id || p.id,
                    title,
                    description,
                    tags,
                    quantity: p.quantity ?? 0,
                    price: p.price ?? 0,
                    imageFilename: p.imageUrl ? p.imageUrl.split('/').pop() : 'placeholder.jpg',
                    imageUrl: p.imageUrl || 'https://via.placeholder.com/300',
                    images: p.images || [],
                    variants: p.variants || [],
                    seoScore: Number.isFinite(p.seoScore) ? p.seoScore : calcSeoScore(title, description, tags)
                });
            });`;

if (regex.test(content)) {
    content = content.replace(regex, newMap);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated AppContext.tsx');
} else {
    console.log('regex not matched in AppContext.tsx');
}
