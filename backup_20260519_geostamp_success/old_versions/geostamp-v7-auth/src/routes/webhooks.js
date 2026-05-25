const crypto = require('crypto');
const express = require('express');
const subscriptionService = require('../services/subscriptionService');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const verifyCreemSignature = (payload, signature) => {
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    if (!secret) {
        console.warn('CREEM_WEBHOOK_SECRET not configured');
        return true;
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
};

router.post('/creem', asyncHandler(async (req, res) => {
    const signature = req.headers['x-creem-signature'];
    const payload = req.body;
    
    console.log('Received Creem webhook:', JSON.stringify(payload, null, 2));
    
    if (!verifyCreemSignature(payload, signature)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { event, data } = payload;
    
    if (!event || !data) {
        return res.status(400).json({ error: 'Missing event or data' });
    }
    
    const validEvents = [
        'subscription.active',
        'subscription.canceled',
        'subscription.past_due',
        'subscription.unpaid',
        'subscription.updated'
    ];
    
    if (!validEvents.includes(event)) {
        console.log(`Ignoring unhandled event: ${event}`);
        return res.json({ received: true, handled: false });
    }
    
    try {
        const result = await subscriptionService.handleCreemWebhook(event, data);
        console.log(`Webhook processed: ${event} for user ${result.user_id}`);
        
        res.json({ received: true, handled: true, subscription: result });
    } catch (error) {
        console.error('Webhook processing error:', error.message);
        
        if (error.message.includes('No subscription found')) {
            return res.status(404).json({ error: error.message });
        }
        
        throw error;
    }
}));

module.exports = router;
