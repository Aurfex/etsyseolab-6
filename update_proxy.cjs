const fs = require('fs');

const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/api/etsy-proxy.ts';
let content = fs.readFileSync(path, 'utf8');

const oldFetch = '`https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`,';
const newFetch = '`https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images,Inventory`,';

content = content.replace(oldFetch, newFetch);
content = content.replace(oldFetch, newFetch);

const oldMap = `        const img =
          listing.images?.[0]?.url_fullxfull ||
          listing.images?.[0]?.url_570xN ||
          listing.Images?.[0]?.url_fullxfull ||
          listing.Images?.[0]?.url_570xN ||
          'https://via.placeholder.com/400x300';

        const title = listing.title || '';
        const description = listing.description || '';
        const tags = Array.isArray(listing.tags) ? listing.tags : [];

        return {
          id: String(listing.listing_id),
          listing_id: String(listing.listing_id),
          title,
          description,
          price: listing.price?.amount && listing.price?.divisor ? listing.price.amount / listing.price.divisor : 0,
          currency: listing.price?.currency_code,
          quantity: listing.quantity,
          tags,
          url: listing.url,
          imageUrl: img,
          seoScore: calcSeoScore(title, description, tags),
          views: listing.views,
          num_favorers: listing.num_favorers,
        };`;

const newMap = `        const imgList = listing.images || listing.Images || [];
        const images = imgList.map((i: any) => ({
          url: i.url_fullxfull || i.url_570xN
        })).filter((i: any) => !!i.url);

        const img = images.length > 0 ? images[0].url : 'https://via.placeholder.com/400x300';

        const title = listing.title || '';
        const description = listing.description || '';
        const tags = Array.isArray(listing.tags) ? listing.tags : [];
        
        let variants: any[] = [];
        if (listing.inventory && listing.inventory.products) {
          variants = listing.inventory.products.map((p: any) => {
            const props = Array.isArray(p.property_values) ? p.property_values.map((v: any) => v.values?.[0] || '').join(' / ') : '';
            const offering = Array.isArray(p.offerings) ? p.offerings[0] : null;
            const vPrice = offering?.price?.amount && offering?.price?.divisor ? offering.price.amount / offering.price.divisor : 0;
            const vQty = offering?.quantity || 0;
            return {
              title: props || 'Default Title',
              price: vPrice || (listing.price?.amount && listing.price?.divisor ? listing.price.amount / listing.price.divisor : 0),
              quantity: vQty,
              sku: p.sku || ''
            };
          });
        }

        return {
          id: String(listing.listing_id),
          listing_id: String(listing.listing_id),
          title,
          description,
          price: listing.price?.amount && listing.price?.divisor ? listing.price.amount / listing.price.divisor : 0,
          currency: listing.price?.currency_code,
          quantity: listing.quantity,
          tags,
          url: listing.url,
          imageUrl: img,
          images,
          variants,
          seoScore: calcSeoScore(title, description, tags),
          views: listing.views,
          num_favorers: listing.num_favorers,
        };`;

content = content.replace(oldMap, newMap); // First occurrence (GET)
content = content.replace(oldMap, newMap); // Second occurrence (POST get_listings)

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated etsy-proxy.ts');
