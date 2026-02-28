import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type PricingRow = { size: string; material: string; price: number };

const norm = (v: any) => String(v ?? '').trim().toLowerCase();
const compact = (v: any) => norm(v).replace(/[^a-z0-9]/g, '');

const toEtsyPriceShape = (_existingPrice: any, newPrice: number) => {
  // Etsy inventory update expects float for offering.price
  return Number(newPrice.toFixed(2));
};

const normalizeOfferingPrice = (p: any): number => {
  if (typeof p === 'number') return Number(p.toFixed(2));
  if (typeof p === 'string') {
    const n = Number(p);
    return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
  }
  if (Array.isArray(p)) {
    const first = p[0];
    const n = Number(first);
    return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
  }
  if (p && typeof p === 'object') {
    const amount = Number(p.amount);
    const divisor = Number(p.divisor || 100);
    if (Number.isFinite(amount) && Number.isFinite(divisor) && divisor > 0) {
      return Number((amount / divisor).toFixed(2));
    }
  }
  return 0;
};

const sanitizeOfferingForPut = (o: any) => ({
  quantity: o?.quantity,
  is_enabled: o?.is_enabled,
  readiness_state_id: o?.readiness_state_id,
  price: normalizeOfferingPrice(o?.price),
});

const sanitizePropertyValueForPut = (pv: any) => ({
  property_id: pv?.property_id,
  property_name: typeof pv?.property_name === 'string' ? pv.property_name : '',
  value_ids: Array.isArray(pv?.value_ids) ? pv.value_ids : [],
  values: Array.isArray(pv?.values) ? pv.values : [],
  scale_id: pv?.scale_id,
});

const sanitizeProductForPut = (p: any) => ({
  sku: Array.isArray(p?.sku) ? (p.sku[0] ?? '') : (typeof p?.sku === 'string' ? p.sku : ''),
  property_values: Array.isArray(p?.property_values) ? p.property_values.map(sanitizePropertyValueForPut) : [],
  offerings: Array.isArray(p?.offerings) ? p.offerings.map(sanitizeOfferingForPut) : [],
});

const getAllVariationValues = (product: any): string[] => {
  const propertyValues = Array.isArray(product?.property_values) ? product.property_values : [];
  const values: string[] = [];
  for (const pv of propertyValues) {
    if (Array.isArray(pv?.values)) {
      for (const val of pv.values) {
        if (val !== null && val !== undefined && String(val).trim()) values.push(String(val).trim());
      }
    }
    if (Array.isArray(pv?.value_ids)) {
      for (const id of pv.value_ids) {
        if (id !== null && id !== undefined && String(id).trim()) values.push(String(id).trim());
      }
    }
  }
  return values;
};

const normalizeSizeNum = (v: any): string => {
  const m = String(v ?? '').match(/\d+(?:\.\d+)?/);
  return m ? m[0] : '';
};

const normalizeMaterialKey = (v: any): string => {
  const s = compact(v);
  const hasGold = s.includes('gold');
  const hasPlatinum = s.includes('platinum');
  const hasSilver = s.includes('silver') || s.includes('sterling');
  const has925 = s.includes('925');
  const has14k = s.includes('14k') || s.includes('k14') || s.includes('14kt') || (s.includes('14') && s.includes('gold'));

  if (hasGold && has14k) return 'gold14k';
  if (hasPlatinum) return 'platinum';
  if (hasSilver && has925) return 'silver925';
  if (hasSilver) return 'silver';
  if (hasGold) return 'gold';
  return s;
};

const matchesRow = (product: any, row: PricingRow) => {
  const vals = getAllVariationValues(product);
  if (!vals.length) return false;

  const rowSize = normalizeSizeNum(row.size);
  const rowMat = normalizeMaterialKey(row.material);

  const productSizeCandidates = vals.map(normalizeSizeNum).filter(Boolean);
  const productMaterialCandidates = vals.map(normalizeMaterialKey).filter(Boolean);

  const hasSize = !!rowSize && productSizeCandidates.some((s) => s === rowSize);
  const hasMaterial = !!rowMat && productMaterialCandidates.some((m) => m === rowMat || m.includes(rowMat) || rowMat.includes(m));

  return hasSize && hasMaterial;
};

const buildInventoryFromPricingRows = (
  rows: PricingRow[],
  baseProduct: any,
  sizeProp: { id: number; name: string; scaleId?: number | null },
  materialProp: { id: number; name: string; scaleId?: number | null }
) => {
  const readiness = Number(baseProduct?.offerings?.[0]?.readiness_state_id || 1);
  const quantityDefault = Number(baseProduct?.offerings?.[0]?.quantity || 999);
  const enabledDefault = baseProduct?.offerings?.[0]?.is_enabled !== false;

  return rows.map((r) => ({
    sku: '',
    property_values: [
      {
        property_id: sizeProp.id,
        property_name: sizeProp.name,
        value_ids: [],
        values: [String(r.size)],
        scale_id: sizeProp.scaleId ?? undefined,
      },
      {
        property_id: materialProp.id,
        property_name: materialProp.name,
        value_ids: [],
        values: [String(r.material)],
        scale_id: materialProp.scaleId ?? undefined,
      },
    ],
    offerings: [
      {
        quantity: quantityDefault,
        is_enabled: enabledDefault,
        readiness_state_id: readiness,
        price: Number(r.price.toFixed(2)),
      },
    ],
  }));
};

const pickVariationProps = async (shopId: string | number, listingId: string | number, headers: any) => {
  const listingResp = await axios.get(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}`, { headers });
  const taxonomyId = Number(listingResp.data?.taxonomy_id || 0);
  if (!taxonomyId) throw new Error('Could not resolve taxonomy_id for listing.');

  const propsResp = await axios.get(
    `https://openapi.etsy.com/v3/application/shops/${shopId}/taxonomy/nodes/${taxonomyId}/properties`,
    { headers }
  );

  const raw = Array.isArray(propsResp.data?.results) ? propsResp.data.results : [];
  const usable = raw.filter((p: any) => {
    const deprecated = Boolean(p?.is_deprecated);
    const variation = Boolean(p?.supports_variations ?? p?.is_variation ?? true);
    return !deprecated && variation;
  });

  const mk = (p: any) => ({
    id: Number(p.property_id),
    name: String(p.name || `Property ${p.property_id}`),
    scaleId: Array.isArray(p.scales) && p.scales[0] ? Number(p.scales[0].scale_id) : null,
  });

  const size = usable.find((p: any) => /size/i.test(String(p.name || '')));
  const material = usable.find((p: any) => /material|metal|finish|color/i.test(String(p.name || '')) && Number(p.property_id) !== Number(size?.property_id));

  if (size && material) return { size: mk(size), material: mk(material) };

  // fallback to first two non-deprecated variation props
  if (usable.length >= 2) {
    return { size: mk(usable[0]), material: mk(usable[1]) };
  }

  throw new Error('No valid variation properties available for this taxonomy.');
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
    let inventoryWarning: string | null = null;
    if (didInventory) {
      try {
        console.log(`📥 Loading inventory for listing ${listing_id}...`);
        const inventoryResp = await axios.get(
          `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory`,
          { headers }
        );

        const inventory = inventoryResp.data || {};
        const products = Array.isArray(inventory.products) ? inventory.products : [];

        const updatedProducts = products.map((p: any) => {
          const row = pricingRows.find((r) => matchesRow(p, r));
          if (!row) return p;

          inventoryMatched += 1;
          const offerings = Array.isArray(p.offerings) ? p.offerings : [];
          const newOfferings = offerings.map((o: any) => ({
            ...o,
            price: toEtsyPriceShape(o?.price, Number(row.price)),
          }));

          return {
            ...p,
            offerings: newOfferings,
          };
        });

        if (inventoryMatched > 0) {
          const inventoryBody = {
            products: updatedProducts.map(sanitizeProductForPut),
            price_on_property: Array.isArray(inventory.price_on_property) ? inventory.price_on_property : [],
            quantity_on_property: Array.isArray(inventory.quantity_on_property) ? inventory.quantity_on_property : [],
            sku_on_property: Array.isArray(inventory.sku_on_property) ? inventory.sku_on_property : [],
          };

          console.log(`📤 Sending inventory update (${inventoryMatched} matched variation rows)...`);
          await axios.put(
            `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory`,
            inventoryBody,
            { headers }
          );
        } else {
          const sampleInventory = products.slice(0, 3).map((p: any) => getAllVariationValues(p));
          const sampleCsv = pricingRows.slice(0, 3).map((r) => ({ size: r.size, material: r.material }));
          console.log('ℹ️ No variation rows matched current Etsy inventory. Rebuilding inventory from pricing rows...', { sampleInventory, sampleCsv });

          const props = await pickVariationProps(shopId, listing_id, headers);
          const rebuiltProducts = buildInventoryFromPricingRows(pricingRows, products[0], props.size, props.material);
          const rebuiltBody = {
            products: rebuiltProducts.map(sanitizeProductForPut),
            price_on_property: [props.size.id, props.material.id],
            quantity_on_property: [props.size.id, props.material.id],
            sku_on_property: [],
          };

          await axios.put(
            `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory`,
            rebuiltBody,
            { headers }
          );

          inventoryMatched = pricingRows.length;
        }
      } catch (invError: any) {
        console.error('⚠️ Inventory update failed (keeping base patch success if applied):', invError.message);
        if (invError?.response?.data) {
          console.error('⚠️ Inventory error details:', JSON.stringify(invError.response.data, null, 2));
        }
        const invData = invError?.response?.data;
        inventoryWarning = invData?.error || invData?.error_description || invData?.detail || (typeof invData === 'string' ? invData : null) || invError?.message || 'Inventory update failed';
      }
    }

    return res.status(200).json({
      success: true,
      data: patchResult,
      inventory: {
        attempted: didInventory,
        rows: pricingRows.length,
        matched: inventoryMatched,
        warning: inventoryWarning,
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
