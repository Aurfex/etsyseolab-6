
export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    const { ETSY_API_KEY } = process.env;
    if (!ETSY_API_KEY) {
        return new Response(JSON.stringify({ error: 'Server is not configured with an Etsy API Key.' }), { status: 500, headers });
    }

    try {
        const { token, shopId } = await req.json();
        if (!token || !shopId) {
            return new Response(JSON.stringify({ error: 'Etsy OAuth Token and Shop ID are required.' }), { status: 400, headers });
        }
        
        const etsyApiHeaders = {
            'Authorization': `Bearer ${token}`,
            'x-api-key': ETSY_API_KEY,
        };

        // The /ping endpoint is a simple way to test authentication.
        const etsyResponse = await fetch('https://openapi.etsy.com/v3/application/ping', {
            method: 'GET',
            headers: etsyApiHeaders,
        });

        if (!etsyResponse.ok) {
            const errorData = await etsyResponse.json().catch(() => null);
            const errorMessage = errorData?.error || `Authentication failed with status ${etsyResponse.status}. Check your token.`;
            return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 401, headers });
        }

        // We can also verify the shopId matches the token's associated shop
        const pingData = await etsyResponse.json();
        if(pingData.shop_id && pingData.shop_id.toString() !== shopId) {
             return new Response(JSON.stringify({ success: false, error: "Token is valid, but does not match the provided Shop ID." }), { status: 400, headers });
        }


        return new Response(JSON.stringify({ success: true, message: 'Etsy API connection is valid.' }), { status: 200, headers });

    } catch (error: any) {
        console.error("Etsy API test failed:", error);
        return new Response(JSON.stringify({ success: false, error: 'An unknown error occurred during the test.' }), { status: 500, headers });
    }
}