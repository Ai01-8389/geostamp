const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'server-debug.log');

// Creem API 配置
const CREEM_API_KEY = 'creem_test_49RRd3OZf8Vuyb54GBNGAQ';
const CREEM_PRODUCT_ID = 'prod_52YqViVwDNmYS5BOhcxVfV';
const CREEM_API_BASE = 'https://test-api.creem.io';

// 自定义日志函数：同时输出到控制台和文件
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 创建 Creem 支付会话
app.post('/api/create-checkout', async (req, res) => {
    try {
        log('=== Creating Creem checkout ===');
        log('API Base: ' + CREEM_API_BASE);
        log('API Key (first 20 chars): ' + CREEM_API_KEY.substring(0, 20) + '...');
        log('Product ID: ' + CREEM_PRODUCT_ID);
        
        // 根据 Creem API 文档，只传递必需的参数
        // 注意：test_mode 不需要，只要在 Dashboard 中切换到 Test Mode 即可
        const requestBody = {
            product_id: CREEM_PRODUCT_ID,
            success_url: `http://localhost:${PORT}/index-fixed.html`
        };
        
        log('Request body: ' + JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(`${CREEM_API_BASE}/v1/checkouts`, {
            method: 'POST',
            headers: {
                'x-api-key': CREEM_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        log('Response status: ' + response.status);

        const data = await response.json();
        log('Response data: ' + JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            log('Creem API error: ' + JSON.stringify(data));
            throw new Error(data.message || `Creem API error: ${response.status}`);
        }

        log('✅ Checkout created successfully');
        
        // 确保使用测试环境的 checkout URL
        // 如果 API 返回正式 URL，手动替换为测试 URL
        if (data.checkout_url) {
            log('Original checkout_url: ' + data.checkout_url);
            // 确保 URL 指向测试环境
            if (!data.checkout_url.includes('/test/checkout')) {
                data.checkout_url = data.checkout_url.replace('https://creem.io/checkout', 'https://creem.io/test/checkout');
            }
            log('Final checkout_url: ' + data.checkout_url);
        }
        
        res.json(data);
    } catch (error) {
        log('❌ Create checkout error: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

// 验证支付状态
app.get('/api/verify-payment', async (req, res) => {
    try {
        const { session_id, checkout_id } = req.query;
        const sessionId = session_id || checkout_id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing session_id' });
        }

        log('Verifying Creem session: ' + sessionId);

        // 根据 Creem API 文档，正确的验证端点是 /v1/checkouts/{id}
        const response = await fetch(`${CREEM_API_BASE}/v1/checkouts/${sessionId}`, {
            headers: {
                'x-api-key': CREEM_API_KEY
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            log('Verification API error: ' + JSON.stringify(data));
            throw new Error(data.message || 'Verification failed');
        }

        log('Verification result: ' + JSON.stringify(data));
        
        // 根据 Creem API 返回格式，检查支付状态
        // 可能返回的字段：status, payment_status, mode 等
        res.json(data);
    } catch (error) {
        log('Verify payment error: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    log(`✅ GeoStamp server running at http://localhost:${PORT}`);
    log(`📄 Open http://localhost:${PORT}/index-fixed.html in your browser`);
    log(`🔑 Creem API configured (Test Mode)`);
});
