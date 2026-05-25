const { query } = require('../database');

const findByUserId = async (userId) => {
    const result = await query(
        `SELECT id, user_id, creem_customer_id, creem_subscription_id, plan, status,
                current_period_start, current_period_end, created_at, updated_at
         FROM subscriptions WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0] || null;
};

const findByCreemCustomerId = async (creemCustomerId) => {
    const result = await query(
        `SELECT s.*, u.email, u.display_name
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         WHERE s.creem_customer_id = $1`,
        [creemCustomerId]
    );
    return result.rows[0] || null;
};

const findByCreemSubscriptionId = async (creemSubscriptionId) => {
    const result = await query(
        `SELECT s.*, u.email, u.display_name
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         WHERE s.creem_subscription_id = $1`,
        [creemSubscriptionId]
    );
    return result.rows[0] || null;
};

const createOrUpdate = async (data) => {
    const { userId, creemCustomerId, creemSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd } = data;
    
    const existing = await findByUserId(userId);
    
    if (existing) {
        const result = await query(
            `UPDATE subscriptions 
             SET creem_customer_id = $1, creem_subscription_id = $2, plan = $3, status = $4,
                 current_period_start = $5, current_period_end = $6
             WHERE user_id = $7
             RETURNING *`,
            [creemCustomerId, creemSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd, userId]
        );
        return result.rows[0];
    }
    
    const result = await query(
        `INSERT INTO subscriptions (user_id, creem_customer_id, creem_subscription_id, plan, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, creemCustomerId, creemSubscriptionId, plan, status, currentPeriodStart, currentPeriodEnd]
    );
    return result.rows[0];
};

const updateStatus = async (userId, status) => {
    const result = await query(
        `UPDATE subscriptions SET status = $1 WHERE user_id = $2 RETURNING *`,
        [status, userId]
    );
    return result.rows[0];
};

const updatePlan = async (userId, plan) => {
    const result = await query(
        `UPDATE subscriptions SET plan = $1 WHERE user_id = $2 RETURNING *`,
        [plan, userId]
    );
    return result.rows[0];
};

const handleCreemWebhook = async (event, data) => {
    const { customer_id, subscription_id, status, plan, current_period_end } = data;
    
    const subscription = await findByCreemCustomerId(customer_id);
    if (!subscription) {
        throw new Error(`No subscription found for customer: ${customer_id}`);
    }
    
    const updates = {
        userId: subscription.user_id,
        creemCustomerId: customer_id,
        creemSubscriptionId: subscription_id,
        status: status || subscription.status,
        plan: plan || subscription.plan,
        currentPeriodEnd: current_period_end ? new Date(current_period_end) : subscription.current_period_end
    };
    
    switch (event) {
        case 'subscription.active':
            updates.status = 'active';
            updates.plan = plan || 'pro';
            break;
        case 'subscription.canceled':
            updates.status = 'canceled';
            break;
        case 'subscription.past_due':
            updates.status = 'past_due';
            break;
        case 'subscription.unpaid':
            updates.status = 'unpaid';
            updates.plan = 'free';
            break;
    }
    
    return await createOrUpdate(updates);
};

const getPermissions = (subscription) => {
    const plan = subscription?.plan || 'free';
    const status = subscription?.status || 'active';
    
    const isActive = status === 'active' && plan === 'pro';
    
    return {
        plan,
        status,
        maxBatchSize: isActive ? 30 : 1,
        features: isActive 
            ? ['batch_processing', 'priority_queue', 'hd_export'] 
            : ['single_image'],
        currentPeriodEnd: subscription?.current_period_end || null
    };
};

const isPro = (subscription) => {
    return subscription?.plan === 'pro' && subscription?.status === 'active';
};

module.exports = {
    findByUserId,
    findByCreemCustomerId,
    findByCreemSubscriptionId,
    createOrUpdate,
    updateStatus,
    updatePlan,
    handleCreemWebhook,
    getPermissions,
    isPro
};
