const fs = require('fs');
const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/api/etsy-proxy.ts';
let content = fs.readFileSync(path, 'utf8');

const oldSalesBlock = `    if (action === 'get_sales_data') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      try {
        const receiptsResponse = await axios.get(
          \`https://openapi.etsy.com/v3/application/shops/\${shopId}/receipts?limit=100\`,
          { headers }
        );`;

const newSalesBlock = `    if (action === 'get_sales_data') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      try {
        const payload = body?.payload || {};
        let url = \`https://openapi.etsy.com/v3/application/shops/\${shopId}/receipts?limit=100\`;
        
        if (payload.startDate) {
          const minCreated = Math.floor(new Date(payload.startDate).getTime() / 1000);
          if (!isNaN(minCreated)) url += \`&min_created=\${minCreated}\`;
        }
        if (payload.endDate) {
          // Add 23:59:59 to end date to include the whole day
          const d = new Date(payload.endDate);
          d.setHours(23, 59, 59, 999);
          const maxCreated = Math.floor(d.getTime() / 1000);
          if (!isNaN(maxCreated)) url += \`&max_created=\${maxCreated}\`;
        }

        const receiptsResponse = await axios.get(url, { headers });`;

if (content.includes("if (action === 'get_sales_data') {")) {
    content = content.replace(oldSalesBlock, newSalesBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated etsy-proxy.ts with date filtering');
} else {
    console.log('Could not find get_sales_data block');
}
