const express = require('express');
const jwtService = require('../services/jwtService');
const userService = require('../services/userService');
const subscriptionService = require('../services/subscriptionService');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/verify', authenticate, asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.findByUserId(req.user.id);
    const permissions = subscriptionService.getPermissions(subscription);
    
    if (subscription?.status === 'past_due' || subscription?.status === 'unpaid') {
        return res.status(403).json({
            valid: false,
            error: 'subscription_expired',
            message: 'Your subscription has expired. Please renew to continue.',
            subscription: {
                plan: subscription.plan,
                status: subscription.status
            }
        });
    }
    
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            displayName: req.user.displayName
        },
        subscription: {
            plan: subscription?.plan || 'free',
            status: subscription?.status || 'active',
            maxBatchSize: permissions.maxBatchSize,
            currentPeriodEnd: subscription?.current_period_end || null,
            features: permissions.features
        }
    });
}));

router.get('/callback', asyncHandler(async (req, res) => {
    const { callback, token } = req.query;
    
    if (!callback || !token) {
        return res.status(400).json({ error: 'Missing callback URL or token' });
    }
    
    try {
        const decoded = jwtService.verifyAccessToken(token);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GeoStamp - Authorization Successful</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f5f5f7;
                    }
                    .container {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }
                    .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #1d1d1f;
                        margin-bottom: 10px;
                    }
                    p {
                        color: #86868b;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✓</div>
                    <h1>Authorization Successful</h1>
                    <p>You can now return to the GeoStamp desktop app.</p>
                    <p style="font-size: 12px; color: #86868b;">You can safely close this window.</p>
                </div>
                <script>
                    (function() {
                        const callbackUrl = '${callback}?token=${token}';
                        fetch(callbackUrl).catch(() => {});
                    })();
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GeoStamp - Authorization Failed</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f5f5f7;
                    }
                    .container {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }
                    .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #1d1d1f;
                        margin-bottom: 10px;
                    }
                    p {
                        color: #86868b;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✗</div>
                    <h1>Authorization Failed</h1>
                    <p>The authorization token is invalid or expired.</p>
                    <p>Please try logging in again from the desktop app.</p>
                </div>
            </body>
            </html>
        `);
    }
}));

module.exports = router;
