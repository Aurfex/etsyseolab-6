// --- Security Middleware (Simulated) ---
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Proxy Error: Unauthorized. Missing or invalid token.' }), { status: 401 }) };
    }
    return { authorized: true };
};

// Main endpoint logic
export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    const { ETSY_API_KEY, ETSY_OAUTH_TOKEN, ETSY_SHOP_ID } = process.env;

    if (!ETSY_API_KEY || !ETSY_OAUTH_TOKEN || !ETSY_SHOP_ID) {
        return new Response(JSON.stringify({ error: 'Server is missing required Etsy configuration.' }), { status: 500, headers });
    }

    const etsyApiHeaders = {
        'Authorization': `Bearer ${ETSY_OAUTH_TOKEN}`,
        'x-api-key': ETSY_API_KEY,
        'Content-Type': 'application/json'
    };
    
    const etsyApiHeadersMultipart = {
        'Authorization': `Bearer ${ETSY_OAUTH_TOKEN}`,
        'x-api-key': ETSY_API_KEY,
    };

    const contentType = req.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const { action, payload } = await req.json();
            
            if (action === 'create_listing') {
                const etsyListingData = {
                    title: payload.title,
                    description: payload.description,
                    price: payload.price,
                    taxonomy_id: payload.taxonomy_id,
                    who_made: payload.who_made,
                    when_made: payload.when_made,
                    is_supply: payload.is_supply,
                    tags: payload.tags,
                    quantity: payload.quantity,
                    shipping_profile_id: 1, // Placeholder
                };

                const etsyResponse = await fetch(`https://openapi.etsy.com/v3/application/shops/${ETSY_SHOP_ID}/listings`, {
                    method: 'POST',
                    headers: etsyApiHeaders,
                    body: JSON.stringify(etsyListingData)
                });

                const responseData = await etsyResponse.json();
                if (!etsyResponse.ok) {
                    const errorMessage = responseData.error || `Etsy API returned status ${etsyResponse.status}`;
                    return new Response(JSON.stringify({ error: errorMessage }), { status: etsyResponse.status, headers });
                }
                
                return new Response(JSON.stringify({ listing_id: responseData.listing_id }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ error: 'Invalid action for JSON request.' }), { status: 400, headers });
        }
        
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const action = formData.get('action');
            const listing_id = formData.get('listing_id');
            const imageFile = formData.get('image');

            if (action !== 'upload_image' || !listing_id || !imageFile) {
                return new Response(JSON.stringify({ error: 'Invalid FormData for image upload.' }), { status: 400, headers });
            }

            const imageFormData = new FormData();
            imageFormData.append('image', imageFile);

            const etsyResponse = await fetch(`https://openapi.etsy.com/v3/application/listings/${listing_id}/images`, {
                method: 'POST',
                headers: etsyApiHeadersMultipart,
                body: imageFormData
            });

            if (!etsyResponse.ok) {
                const responseData = await etsyResponse.json();
                const errorMessage = responseData.error || `Etsy API returned status ${etsyResponse.status}`;
                return new Response(JSON.stringify({ error: errorMessage }), { status: etsyResponse.status, headers });
            }

            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }
        
        return new Response(JSON.stringify({ error: 'Unsupported Content-Type.' }), { status: 415, headers });

    } catch (error: any) {
        console.error("Error in Etsy proxy:", error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred in the proxy.' }), { status: 500, headers });
    }
}