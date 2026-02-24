const axios = require('axios');

const TOKEN = '19331530.RsBbVp53kGiMALQMaHCAXPcgP1i8m_QDjh1DyxDJCiKKJ_9-_m4nnqFd4J3G15vZgtwU64In60d0knKtB42kplOviDx'; // Token from user log
const CLIENT_ID = 'rfdxv5ocrtb4t3yptbyjlpy0'; // User's Client ID

async function testEtsy() {
    console.log("🚀 Testing Etsy API...");

    try {
        // Test 1: users/me WITHOUT x-api-key
        console.log("\n--- Test 1: users/me (No x-api-key) ---");
        try {
            const res1 = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("✅ Success!", res1.data);
        } catch (e) {
            console.log("❌ Failed:", e.response?.status, e.response?.data);
        }

        // Test 2: users/me WITH x-api-key
        console.log("\n--- Test 2: users/me (With x-api-key) ---");
        try {
            const res2 = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'x-api-key': CLIENT_ID,
                    'Content-Type': 'application/json'
                }
            });
            console.log("✅ Success!", res2.data);
        } catch (e) {
            console.log("❌ Failed:", e.response?.status, e.response?.data);
        }

        // Test 3: users/me WITH x-api-key = CLIENT_ID:SECRET
        console.log("\n--- Test 3: users/me (x-api-key = ID:SECRET) ---");
        try {
            const res3 = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'x-api-key': 'rfdxv5ocrtb4t3yptbyjlpy0:ct0tzwdmka',
                    'Content-Type': 'application/json'
                }
            });
            console.log("✅ Success!", res3.data);
        } catch (e) {
            console.log("❌ Failed:", e.response?.status, e.response?.data);
        }

    } catch (error) {
        console.error("Critical Error:", error.message);
    }
}

testEtsy();