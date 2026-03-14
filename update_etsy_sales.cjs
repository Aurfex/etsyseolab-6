const fs = require('fs');

const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/api/etsy-proxy.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `      return res.status(200).json({ products: formattedProducts, shop: { id: shopId } });
    }`;

const newSalesBlock = `      return res.status(200).json({ products: formattedProducts, shop: { id: shopId } });
    }

    if (action === 'get_sales_data') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      try {
        const receiptsResponse = await axios.get(
          \`https://openapi.etsy.com/v3/application/shops/\${shopId}/receipts?limit=100\`,
          { headers }
        );

        let totalRevenue = 0;
        let orderCount = receiptsResponse.data?.count || 0;
        const recentOrders: any[] = [];

        for (const receipt of (receiptsResponse.data?.results || [])) {
          const grandTotal = receipt.grandtotal;
          const amount = grandTotal?.amount || 0;
          const divisor = grandTotal?.divisor || 100;
          const value = amount / divisor;
          totalRevenue += value;
          
          recentOrders.push({
            receipt_id: receipt.receipt_id,
            buyer_email: receipt.buyer_email,
            status: receipt.status,
            date: new Date((receipt.create_timestamp || 0) * 1000).toISOString(),
            total: value,
            currency: grandTotal?.currency_code || 'USD'
          });
        }

        return res.status(200).json({ 
          total_revenue: totalRevenue, 
          order_count: orderCount,
          recent_orders: recentOrders.slice(0, 10),
          currency: recentOrders[0]?.currency || 'USD'
        });
      } catch (err: any) {
         return res.status(500).json({ error: 'Failed to fetch receipts', details: err?.response?.data || err.message });
      }
    }`;

content = content.replace(targetStr, newSalesBlock);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated etsy-proxy.ts with get_sales_data');
