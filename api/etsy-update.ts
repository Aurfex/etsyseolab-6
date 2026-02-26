import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type PricingRow = { size: string; material: string; price: number };

const norm = (v: any) => String(v ?? '').trim().toLowerCase();

const getVariationValue = (product: any, key: 'size' | 'material') => {
  const propertyValues = Array.isArray(product?.property_values) ? product.property_values : [];
  const byName = propertyValues.find((pv: any) => norm(pv?.property_name).includes(key));
  if (byName?.values?.[0]) return String(byName.values[0]).trim();

  // Fallback for non-standard property names/order
  if (key === 'size') return propertyValues?.[0]?.values?.[0] ? String(propertyValues[0].values[0]).trim() : '';
  if (key === 'material') return propertyValues?.[1]?.values?.[0] ? String(propertyValues[1].values[0]).trim() : '';
  return '';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];

  const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
  const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
  if (!ETSY_API_KEY) return res.status(500).json({ error: 'Server Config Error' });

  const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-api-key': xApiKey,
    'Content-Type': 'application/json'
  };

  try {
    const { listing_id, payload } = req.body;
    console.log(`📝 START Update Listing ID: ${listing_id}`);

    let shopId;
    try {
      const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
      shopId = userResponse.data.shop_id;
      if (!shopId) {
        const userId = userResponse.data.user_id;
        const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
        if (shopResponse.data.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
      }
    } catch (fetchError: any) {
      console.error('❌ Failed to fetch Shop ID for update:', fetchError.message);
      throw new Error(`Could not verify Shop ID: ${fetchError.response?.data?.error || fetchError.message}`);
    }

    if (!shopId) return res.status(404).json({ error: 'Shop ID not found' });

    const updateBody: any = {};
    if (payload?.title && typeof payload.title === 'string') {
      const trimmedTitle = payload.title.trim();
      updateBody.title = trimmedTitle.length > 140 ? trimmedTitle.slice(0, 140) : trimmedTitle;
    }
    if (payload?.description && typeof payload.description === 'string') updateBody.description = payload.description;
    if (Array.isArray(payload?.tags)) {
      updateBody.tags = payload.tags
        .map((t: string) => String(t).trim())
        .filter((t: string) => t.length > 0 && t.length <= 20)
        .slice(0, 13);
    }
    if (payload?.price !== undefined && payload?.price !== null) {
      const priceNum = Number(payload.price);
      if (!Number.isNaN(priceNum) && priceNum > 0) {
        updateBody.price = priceNum.toFixed(2);
      }
    }

    const pricingRows: PricingRow[] = Array.isArray(payload?.pricingRows)
      ? payload.pricingRows
          .map((r: any) => ({
            size: String(r?.size ?? '').trim(),
            material: String(r?.material ?? '').trim(),
            price: Number(r?.price ?? 0),
          }))
          .filter((r: PricingRow) => r.size && r.material && !Number.isNaN(r.price) && r.price > 0)
      : [];

    const didPatch = Object.keys(updateBody).length > 0;
    const didInventory = pricingRows.length > 0;

    if (!didPatch && !didInventory) {
      return res.status(200).json({ success: true, skipped: true, reason: 'No fields to update.' });
    }

    let patchResult: any = null;
    if (didPatch) {
      console.log('📤 Sending PATCH to Etsy with fields:', Object.keys(updateBody));
      const updateResponse = await axios.patch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}`,
        updateBody,
        { headers }
      );
      patchResult = updateResponse.data;
    }

    let inventoryMatched = 0;
    if (didInventory) {
      console.log(`📥 Loading inventory for listing ${listing_id}...`);
      const inventoryResp = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}/inventory`,
        { headers }
      );

      const inventory = inventoryResp.data || {};
      const products = Array.isArray(inventory.products) ? inventory.products : [];

      const byKey = new Map<string, number>();
      for (const r of pricingRows) {
        byKey.set(`${norm(r.size)}|${norm(r.material)}`, Number(r.price.toFixed(2)));
      }

      const updatedProducts = products.map((p: any) => {
        const size = getVariationValue(p, 'size');
        const material = getVariationValue(p, 'material');
        const key = `${norm(size)}|${norm(material)}`;
        const matched = byKey.get(key);
        if (matched === undefined) return p;

        inventoryMatched += 1;
        const offerings = Array.isArray(p.offerings) ? p.offerings : [];
        const newOfferings = offerings.map((o: any) => ({
          ...o,
          price: matched.toFixed(2),
        }));

        return {
          ...p,
          offerings: newOfferings,
        };
      });

      if (inventoryMatched > 0) {
        const inventoryBody = {
          products: updatedProducts,
          price_on_property: Array.isArray(inventory.price_on_property) ? inventory.price_on_property : [],
          quantity_on_property: Array.isArray(inventory.quantity_on_property) ? inventory.quantity_on_property : [],
          sku_on_property: Array.isArray(inventory.sku_on_property) ? inventory.sku_on_property : [],
        };

        console.log(`📤 Sending inventory update (${inventoryMatched} matched variation rows)...`);
        await axios.put(
          `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}/inventory`,
          inventoryBody,
          { headers }
        );
      } else {
        console.log('ℹ️ No variation rows matched current Etsy inventory.');
      }
    }

    return res.status(200).json({
      success: true,
      data: patchResult,
      inventory: {
        attempted: didInventory,
        rows: pricingRows.length,
        matched: inventoryMatched,
      },
    });
  } catch (error: any) {
    console.error('❌ Update Request FAILED:', error.message);
    if (error.response) {
      console.error('❌ Etsy Response Data:', JSON.stringify(error.response.data, null, 2));
      const etsyData = error.response.data || {};
      const etsyMessage = etsyData.error || etsyData.error_description || etsyData.detail || 'Etsy API Error';
      return res.status(error.response.status).json({
        error: etsyMessage,
        details: etsyData,
      });
    }
    return res.status(500).json({ error: error.message });
  }
}
